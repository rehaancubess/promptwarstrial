import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Activity, Volume2, Loader2, Stethoscope, MessageCircle } from 'lucide-react';
import { trackEvent } from '../firebase';

const WS_URL = (import.meta.env.VITE_API_URL || 'https://hemora-backend-713215250376.us-central1.run.app')
  .replace('https://', 'wss://')
  .replace('http://', 'ws://');

// Target sample rate for Gemini Live API input
const TARGET_SAMPLE_RATE = 16000;
// Target sample rate for Gemini Live API output
const OUTPUT_SAMPLE_RATE = 24000;

function downsampleBuffer(buffer, inputRate, outputRate) {
  if (inputRate === outputRate) return buffer;
  const ratio = inputRate / outputRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    result[i] = buffer[Math.round(i * ratio)];
  }
  return result;
}

function float32ToInt16(float32Array) {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Array;
}

export default function VoiceDoctor({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | connected | thinking | speaking | error
  const [transcript, setTranscript] = useState([]);
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const transcriptEndRef = useRef(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const playNextChunk = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      return;
    }
    isPlayingRef.current = true;
    setIsSpeaking(true);

    const ctx = audioCtxRef.current;
    const pcmData = audioQueueRef.current.shift();

    // Decode 16-bit PCM at 24kHz
    const int16 = new Int16Array(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength / 2);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }

    const audioBuffer = ctx.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
    audioBuffer.copyToChannel(float32, 0);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.onended = playNextChunk;
    source.start();
  }, []);

  const enqueueAudio = useCallback((base64Data) => {
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    audioQueueRef.current.push(bytes);
    if (!isPlayingRef.current) {
      playNextChunk();
    }
  }, [playNextChunk]);

  const disconnect = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    trackEvent('voice_session_ended', { transcript_length: transcript.length });
    setIsRecording(false);
    setIsSpeaking(false);
    setStatus('idle');
  }, [transcript.length]);

  const connect = useCallback(async () => {
    if (!user) return;
    setError(null);
    setIsConnecting(true);
    setTranscript([]);

    try {
      // Init AudioContext
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: TARGET_SAMPLE_RATE });
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }

      // Get Firebase token
      let token = '';
      try {
        token = await user.getIdToken();
      } catch (_) { /* offline/dev mode */ }

      const ws = new WebSocket(`${WS_URL}/ws/voice?token=${token}`);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnecting(false);
        setStatus('connected');
        trackEvent('voice_session_started');
        startMic(ws);
      };

      ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case 'audio':
              setStatus('speaking');
              enqueueAudio(msg.data);
              break;
            case 'text':
              setTranscript(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'doctor') {
                  return [...prev.slice(0, -1), { role: 'doctor', text: last.text + msg.data }];
                }
                return [...prev, { role: 'doctor', text: msg.data }];
              });
              break;
            case 'status':
              if (msg.data === 'done') setStatus('connected');
              else setStatus(msg.data);
              break;
            case 'error':
              setError(msg.data);
              setStatus('error');
              break;
          }
        }
      };

      ws.onerror = () => {
        setError('Connection failed. Is the backend running?');
        setStatus('error');
        setIsConnecting(false);
      };

      ws.onclose = () => {
        setStatus('idle');
        setIsRecording(false);
      };
    } catch (e) {
      setError(e.message);
      setStatus('error');
      setIsConnecting(false);
    }
  }, [user, enqueueAudio]);

  const startMic = useCallback(async (ws) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      mediaStreamRef.current = stream;

      const ctx = audioCtxRef.current;
      const source = ctx.createMediaStreamSource(stream);

      // Use ScriptProcessor (widely supported) to capture raw PCM
      const bufferSize = 4096;
      const processor = ctx.createScriptProcessor(bufferSize, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const downsampled = downsampleBuffer(inputData, ctx.sampleRate, TARGET_SAMPLE_RATE);
        const int16 = float32ToInt16(downsampled);
        ws.send(int16.buffer);
      };

      source.connect(processor);
      processor.connect(ctx.destination);
      setIsRecording(true);
      setStatus('connected');
    } catch (e) {
      setError('Microphone access denied. Please allow microphone access.');
      setStatus('error');
    }
  }, []);

  const handleToggle = useCallback(() => {
    if (status === 'idle') {
      connect();
    } else {
      disconnect();
    }
  }, [status, connect, disconnect]);

  const handleClose = useCallback(() => {
    disconnect();
    setIsOpen(false);
    setTranscript([]);
    setError(null);
  }, [disconnect]);

  const statusColor = {
    idle: '#8b949e',
    connected: '#2ea043',
    thinking: '#f0883e',
    speaking: '#58a6ff',
    error: '#f85149',
  }[status] || '#8b949e';

  const statusLabel = {
    idle: 'Tap mic to start',
    connected: isRecording ? 'Listening...' : 'Connected',
    thinking: 'Thinking...',
    speaking: 'Speaking...',
    error: 'Error',
  }[status] || status;

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        className="voice-doctor-fab"
        onClick={() => setIsOpen(true)}
        style={{ display: isOpen ? 'none' : 'flex' }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open AI Voice Doctor"
        title="Talk to Dr. Hemora"
      >
        <Stethoscope size={22} />
        <span>Voice Doctor</span>
        <motion.span
          className="voice-fab-ping"
          animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </motion.button>

      {/* Doctor Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="voice-doctor-panel"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            role="dialog"
            aria-label="Voice Doctor"
          >
            {/* Header */}
            <div className="voice-doctor-header">
              <div className="flex items-center gap-3">
                <div className="voice-avatar">
                  <Stethoscope size={18} />
                  {/* Live status dot */}
                  <motion.span
                    className="voice-status-dot"
                    style={{ background: statusColor }}
                    animate={status === 'connected' || status === 'speaking' ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  />
                </div>
                <div>
                  <p className="font-semibold text-sm">Dr. Hemora</p>
                  <p className="text-xs" style={{ color: statusColor }}>{statusLabel}</p>
                </div>
              </div>
              <button onClick={handleClose} className="voice-close-btn" aria-label="Close Voice Doctor">
                <X size={16} />
              </button>
            </div>

            {/* Transcript area */}
            <div className="voice-transcript" role="log" aria-live="polite" aria-label="Conversation transcript">
              {transcript.length === 0 && (
                <div className="voice-empty-state">
                  <Activity size={32} className="mb-3 opacity-40" />
                  <p className="text-sm opacity-50 text-center">
                    Hi! Press the mic button below to start talking to Dr. Hemora.
                    <br /><br />
                    Ask about your lab results, what your metrics mean, or general health questions.
                  </p>
                </div>
              )}
              {transcript.map((msg, i) => (
                <div
                  key={i}
                  className={`voice-message ${msg.role}`}
                >
                  <span className="voice-message-label">
                    {msg.role === 'doctor' ? '🩺 Dr. Hemora' : '🎤 You'}
                  </span>
                  <p>{msg.text}</p>
                </div>
              ))}
              {status === 'thinking' && (
                <div className="voice-message doctor">
                  <span className="voice-message-label">🩺 Dr. Hemora</span>
                  <div className="voice-thinking">
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}>●</motion.span>
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}>●</motion.span>
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}>●</motion.span>
                  </div>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* Error */}
            {error && (
              <div className="voice-error" role="alert">
                {error}
              </div>
            )}

            {/* Controls */}
            <div className="voice-controls">
              {/* Waveform visualizer */}
              <div className="voice-waveform" aria-hidden="true">
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="voice-bar"
                    animate={isRecording ? {
                      height: ['4px', `${8 + Math.random() * 20}px`, '4px'],
                    } : { height: '4px' }}
                    transition={{ repeat: Infinity, duration: 0.4 + i * 0.05, ease: 'easeInOut' }}
                  />
                ))}
              </div>

              {/* Mic toggle button */}
              <motion.button
                className={`voice-mic-btn ${status !== 'idle' ? 'active' : ''}`}
                onClick={handleToggle}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isConnecting}
                aria-label={status === 'idle' ? 'Start conversation' : 'End conversation'}
                aria-pressed={status !== 'idle'}
              >
                {isConnecting ? (
                  <Loader2 size={22} className="animate-spin" />
                ) : status === 'idle' ? (
                  <Mic size={22} />
                ) : (
                  <MicOff size={22} />
                )}
              </motion.button>

              {/* Speaker indicator */}
              <div className="voice-speaker-indicator" aria-label={isSpeaking ? 'Doctor is speaking' : 'Waiting'}>
                <Volume2 size={14} style={{ opacity: isSpeaking ? 1 : 0.3, color: isSpeaking ? '#58a6ff' : 'inherit' }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
