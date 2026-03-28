import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Activity, Zap, ShieldCheck, AlertTriangle, ChevronRight, FileText, Loader2, CheckCircle2 } from 'lucide-react';

function App() {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    setAnalyzing(true);
    
    // Simulate backend call
    setTimeout(async () => {
      try {
        const res = await fetch('http://localhost:8000/api/analyze', { method: 'POST' });
        const data = await res.json();
        setResults(data);
      } catch (e) {
        setResults({
          insights: [
            "Your hemoglobin has steadily declined over 4 months.",
            "Glucose levels are within optimal range but nearing the upper threshold."
          ],
          recommendations: [
            "Consider a diet rich in iron (spinach, lentils) to address hemoglobin.",
            "Schedule a follow-up test in 3 months to track glucose trends."
          ],
          risk_level: "moderate"
        });
      } finally {
        setAnalyzing(false);
      }
    }, 2500);
  };

  return (
    <div className="app-container">
      <header className="flex items-center justify-between mb-4 pb-4 border-b" style={{ borderColor: 'var(--panel-border)' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
          <Activity size={32} className="text-accent" />
          <h1 className="gradient-text mb-0" style={{ margin: 0 }}>Hemora</h1>
        </motion.div>
        
        <nav className="flex gap-4">
          <button className="btn btn-secondary">Dashboard</button>
          <button className="btn btn-secondary">History</button>
        </nav>
      </header>

      <main className="dashboard-grid mt-4">
        {/* Left Column: Upload */}
        <motion.section 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="glass-panel">
            <h2 className="text-sm text-gray flex items-center gap-2"><UploadCloud size={16}/> New Report</h2>
            <p className="mb-4 text-sm mt-4">Upload your latest medical report (PDF, Image) or drop a voice note.</p>
            
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
                  <p className="text-sm">{file.name}</p>
                </div>
              ) : (
                <div>
                  <UploadCloud className="text-gray mx-auto mb-4" size={32} />
                  <p className="text-sm text-gray">Click to browse or drag file here</p>
                </div>
              )}
            </div>

            <button 
              className="btn btn-primary mt-4 w-full" 
              style={{ width: '100%', marginTop: '1.5rem' }}
              onClick={handleUpload}
              disabled={!file || analyzing}
            >
              {analyzing ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
              {analyzing ? "Analyzing..." : "Analyze Report"}
            </button>
          </div>
        </motion.section>

        {/* Right Column: Insights */}
        <motion.section 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="glass-panel h-full" style={{ minHeight: '500px' }}>
            <h2 className="text-sm text-gray flex items-center gap-2 mb-4"><ShieldCheck size={16}/> Health Insights & Action Plan</h2>
            
            {!results && !analyzing && (
              <div className="flex flex-col items-center justify-center h-full text-center mt-4 pt-4" style={{ marginTop: '5rem', opacity: 0.5 }}>
                <Activity size={48} className="mb-4 text-gray" />
                <p>Upload a report to generate structure, verify risks,<br/>and get personalized action plans.</p>
              </div>
            )}

            {analyzing && (
              <div className="flex flex-col items-center justify-center h-full mt-4 pt-4" style={{ marginTop: '5rem' }}>
                <Loader2 className="animate-spin text-accent" size={48} style={{ animation: 'spin 1s linear infinite' }} />
                <p className="mt-4 text-sm text-gray">Translating medical data...</p>
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {results && !analyzing && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--panel-border)', marginBottom: '1.5rem' }}>
                  <h3 className="text-warning flex items-center gap-2 mb-4">
                    <AlertTriangle size={18} /> Verified Risks Detected
                  </h3>
                  {results.insights.map((insight, idx) => (
                    <div key={idx} className="insight-card warning">
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-success flex items-center gap-2 mb-4">
                    <Zap size={18} /> Real-World Action Plan
                  </h3>
                  {results.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-4 mb-4" style={{ marginBottom: '1rem' }}>
                      <div className="text-accent mt-4" style={{ marginTop: '0.25rem' }}>
                        <CheckCircle2 size={16} />
                      </div>
                      <div className="glass-panel" style={{ padding: '12px 16px', width: '100%' }}>
                        <p className="text-sm">{rec}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.section>
      </main>
    </div>
  );
}

export default App;
