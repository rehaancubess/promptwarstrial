import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Activity, Zap, ShieldCheck, AlertTriangle, FileText, Loader2, CheckCircle2, History, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine } from 'recharts';

function MetricChart({ metric }) {
  const chartMax = Math.max(metric.max_normal * 1.5, metric.value * 1.2);
  const data = [{ name: metric.name, value: metric.value }];
  
  let barColor = "#2ea043"; 
  if (metric.status.toLowerCase() === "low") barColor = "#58a6ff"; 
  if (metric.status.toLowerCase() === "high") barColor = "#f85149"; 

  return (
    <div style={{ height: '70px', width: '100%', marginTop: '0.5rem' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
          <XAxis type="number" domain={[0, chartMax]} hide />
          <YAxis dataKey="name" type="category" hide />
          <Tooltip 
             contentStyle={{ backgroundColor: '#1E232D', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
             cursor={{fill: 'rgba(255,255,255,0.05)'}}
          />
          <ReferenceArea x1={metric.min_normal} x2={metric.max_normal} fill="#ffffff" fillOpacity={0.05} />
          <Bar dataKey="value" fill={barColor} radius={[0, 4, 4, 0]} barSize={16} />
          <ReferenceLine x={metric.min_normal} stroke="#8b949e" strokeDasharray="3 3" />
          <ReferenceLine x={metric.max_normal} stroke="#8b949e" strokeDasharray="3 3" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function App() {
  const [userId, setUserId] = useState('');
  const [view, setView] = useState('dashboard'); // 'dashboard', 'history'
  
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  const [historyItems, setHistoryItems] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || 'https://hemora-backend-713215250376.us-central1.run.app';

  // Private Anonymous Identification
  useEffect(() => {
    let storedId = localStorage.getItem('hemora_uid');
    if (!storedId) {
      storedId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('hemora_uid', storedId);
    }
    setUserId(storedId);
  }, []);

  const fetchHistory = async () => {
    if (!userId) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`${apiUrl}/api/history?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryItems(data.history || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleNav = (newView) => {
    setView(newView);
    if (newView === 'history') {
      fetchHistory();
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId);

    try {
      const res = await fetch(`${apiUrl}/api/analyze`, { 
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) {
         throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      setResults(data);
      setFile(null); // Clear file after success
    } catch (e) {
      console.error(e);
      setError("Failed to analyze the report. Please check if the backend is running.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="app-container">
      <header className="flex items-center justify-between mb-6 pb-4 border-b" style={{ borderColor: 'var(--panel-border)' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 cursor-pointer" onClick={() => handleNav('dashboard')}>
          <Activity size={32} className="text-accent" />
          <h1 className="gradient-text mb-0" style={{ margin: 0 }}>Hemora</h1>
        </motion.div>
        
        <nav className="flex gap-2 sm:gap-4">
          <button className={`btn ${view === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleNav('dashboard')}>
             <Activity size={16}/> <span className="hidden sm:inline">Dashboard</span>
          </button>
          <button className={`btn ${view === 'history' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleNav('history')}>
             <History size={16}/> <span className="hidden sm:inline">History</span>
          </button>
        </nav>
      </header>

      <main>
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="dashboard-grid"
            >
              <section>
                <div className="glass-panel sticky top-4">
                  <h2 className="text-sm text-gray flex items-center gap-2"><UploadCloud size={16}/> New Report</h2>
                  <p className="mb-4 text-sm mt-4 text-gray">Upload your latest medical report (PDF, Image). AI will cross-reference your past baselines and chart improvements.</p>
                  
                  <div 
                    className={`file-drop-area ${file ? 'active' : ''}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('fileUpload').click()}
                  >
                    <input 
                      id="fileUpload" 
                      type="file" 
                      className="hidden" 
                      style={{ display: 'none' }}
                      onChange={(e) => setFile(e.target.files[0])}
                    />
                    {file ? (
                      <div>
                        <FileText className="text-accent mx-auto mb-4" size={32} />
                        <p className="text-sm font-medium">{file.name}</p>
                      </div>
                    ) : (
                      <div>
                        <UploadCloud className="text-gray mx-auto mb-4" size={32} />
                        <p className="text-sm text-gray">Click to browse or drag file here</p>
                      </div>
                    )}
                  </div>

                  {error && <p className="text-danger mt-4 text-sm bg-red-950/20 p-2 rounded">{error}</p>}

                  <button 
                    className="btn btn-primary mt-4 w-full justify-center" 
                    style={{ width: '100%', marginTop: '1.5rem', display: 'flex' }}
                    onClick={handleUpload}
                    disabled={!file || analyzing}
                  >
                    {analyzing ? <Loader2 className="animate-spin mr-2" size={18} /> : <Zap className="mr-2" size={18} />}
                    {analyzing ? "Analyzing with Gemini..." : "Extract & Compare History"}
                  </button>
                </div>
              </section>

              <section>
                <div className="glass-panel" style={{ minHeight: '500px' }}>
                  <h2 className="text-sm text-gray flex items-center gap-2 mb-4"><ShieldCheck size={16}/> Real-Time Analysis</h2>
                  
                  {!results && !analyzing && (
                    <div className="flex flex-col items-center justify-center text-center py-20 opacity-50">
                      <History size={48} className="mb-4 text-gray" />
                      <p className="text-sm">Upload a report to generate structure, verify risks,<br/>and see your real data graphed here against your history.</p>
                    </div>
                  )}

                  {analyzing && (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 className="text-accent" size={48} style={{ animation: 'spin 1s linear infinite' }} />
                      <p className="mt-6 text-sm text-gray text-center">Gemini is parsing the metrics and comparing<br/>them to your private health baseline...</p>
                      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                  )}

                  {results && !analyzing && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                      
                      {/* AI Delta Insights */}
                      <div className="mb-8 p-4 rounded-xl bg-[rgba(56,189,248,0.03)] border border-[rgba(56,189,248,0.1)]">
                        <h3 className="text-accent font-medium flex items-center gap-2 mb-4">
                          <Activity size={18} /> Dynamic Insights & Trends
                        </h3>
                        {results.insights && results.insights.map((insight, idx) => (
                          <p key={idx} className="text-sm text-gray-100 mb-2 leading-relaxed">{insight}</p>
                        ))}
                      </div>

                      {/* Metrics Breakdown */}
                      <div className="mb-8">
                          <div className="metrics-grid">
                            {results.extracted_metrics && results.extracted_metrics.map((metric, idx) => (
                              <div key={idx} className="glass-panel" style={{ padding: '16px' }}>
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <span className="font-semibold block">{metric.name}</span>
                                    <span className={`text-sm ${metric.status.toLowerCase() === 'high' ? 'text-danger' : metric.status.toLowerCase() === 'low' ? 'text-warning' : 'text-success'}`}>
                                      {metric.value} {metric.unit} ({metric.status})
                                    </span>
                                  </div>
                                  
                                  {/* Trend Indicator */}
                                  {metric.delta != null && metric.delta_direction && metric.delta_direction !== 'none' && (
                                    <div className={`trend-badge ${['high', 'low'].includes(metric.status.toLowerCase()) ? 'danger' : 'success'}`}>
                                      {metric.delta_direction === 'up' ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                                      <span>{metric.delta}</span>
                                    </div>
                                  )}
                                  {metric.delta != null && metric.delta_direction === 'none' && (
                                    <div className="trend-badge neutral">
                                      <Minus size={12}/> <span>0</span>
                                    </div>
                                  )}
                                </div>
                                
                                <MetricChart metric={metric} />
                                
                                <div className="flex justify-between text-xs text-gray mt-2">
                                  <span>Min: {metric.min_normal}</span>
                                  <span>Max: {metric.max_normal}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                      </div>

                      {/* Recommendations Plan */}
                      <div>
                        <h3 className="text-success font-medium flex items-center gap-2 mb-4">
                          <Zap size={18} /> Recommended Action Plan
                        </h3>
                        {results.recommendations && results.recommendations.map((rec, idx) => (
                          <div key={idx} className="flex items-start gap-4 mb-3">
                            <CheckCircle2 size={16} className="text-success mt-1 flex-shrink-0" />
                            <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] w-full">
                              <p className="text-sm text-gray-200">{rec}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </section>
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto"
            >
              <div className="glass-panel mb-6">
                <h2 className="text-lg font-medium mb-2 flex items-center gap-2"><History size={20} className="text-accent" /> Health Timeline</h2>
                <p className="text-gray text-sm">Your chronologically tracked medical parses. Watch your trends over time.</p>
              </div>

              {loadingHistory ? (
                <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-accent" size={32}/></div>
              ) : historyItems.length === 0 ? (
                <div className="text-center py-20 text-gray">
                  <p>No historical reports found.</p>
                  <button onClick={() => handleNav('dashboard')} className="text-accent mt-2 hover:underline">Upload your first one</button>
                </div>
              ) : (
                <div className="relative border-l border-[rgba(255,255,255,0.1)] ml-4 pl-6 space-y-8">
                  {historyItems.map((item, idx) => (
                    <div key={item.id} className="relative">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[31px] top-2 w-3 h-3 rounded-full bg-accent ring-4 ring-[#0F1219]"></span>
                      
                      <div className="glass-panel p-5 hover:border-accent transition-colors">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-medium text-gray-200">{item.filename || 'Uploaded Report'}</h3>
                            <p className="text-xs text-gray mt-1">
                               {new Date(item.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded uppercase font-bold tracking-wider ${
                            item.analysis?.risk_level === 'High' ? 'bg-red-500/20 text-danger' :
                            item.analysis?.risk_level === 'Moderate' ? 'bg-yellow-500/20 text-warning' :
                            'bg-green-500/20 text-success'
                          }`}>
                            {item.analysis?.risk_level} Risk
                          </span>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.05)]">
                           <p className="text-sm text-gray mb-3 pb-2"><strong>Key Insights Recorded:</strong></p>
                           <ul className="text-sm text-gray-300 space-y-2 list-disc pl-4">
                             {item.analysis?.insights?.slice(0, 2).map((insight, i) => (
                               <li key={i}>{insight}</li>
                             ))}
                           </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
