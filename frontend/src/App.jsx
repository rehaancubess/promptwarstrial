import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Activity, Zap, ShieldCheck, AlertTriangle, ChevronRight, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine } from 'recharts';

function MetricChart({ metric }) {
  // A premium looking small chart demonstrating where the value falls relative to the normal range.
  // We'll create a chart with the range 0 to Max*1.5, to give it some padding.
  
  const chartMax = Math.max(metric.max_normal * 1.5, metric.value * 1.2);
  const data = [{ name: metric.name, value: metric.value }];
  
  let barColor = "#2ea043"; // Success by default
  if (metric.status.toLowerCase() === "low") barColor = "#58a6ff"; // Warning/blue for low
  if (metric.status.toLowerCase() === "high") barColor = "#f85149"; // Danger for high

  return (
    <div style={{ height: '100px', width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
          <XAxis type="number" domain={[0, chartMax]} hide />
          <YAxis dataKey="name" type="category" hide />
          <Tooltip 
             contentStyle={{ backgroundColor: '#1E232D', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
             cursor={{fill: 'rgba(255,255,255,0.05)'}}
          />
          {/* Shaded area for normal range */}
          <ReferenceArea x1={metric.min_normal} x2={metric.max_normal} fill="#ffffff" fillOpacity={0.05} />
          
          {/* The actual value bar */}
          <Bar dataKey="value" fill={barColor} radius={[0, 4, 4, 0]} barSize={20} />
          
          {/* Min/Max markers */}
          <ReferenceLine x={metric.min_normal} stroke="#8b949e" strokeDasharray="3 3" />
          <ReferenceLine x={metric.max_normal} stroke="#8b949e" strokeDasharray="3 3" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function App() {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

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

    try {
      // Pointing to deployed backend Cloud Run endpoint or fallback to localhost
      const apiUrl = import.meta.env.VITE_API_URL || 'https://hemora-backend-713215250376.us-central1.run.app';
      const res = await fetch(`${apiUrl}/api/analyze`, { 
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) {
         throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      setResults(data);
    } catch (e) {
      console.error(e);
      setError("Failed to analyze the report. Please try again.");
    } finally {
      setAnalyzing(false);
    }
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
            <p className="mb-4 text-sm mt-4">Upload your latest medical report (PDF, Image). AI will parse the exact values.</p>
            
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

            {error && <p className="text-danger mt-4 text-sm">{error}</p>}

            <button 
              className="btn btn-primary mt-4 w-full" 
              style={{ width: '100%', marginTop: '1.5rem' }}
              onClick={handleUpload}
              disabled={!file || analyzing}
            >
              {analyzing ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
              {analyzing ? "Analyzing with Gemini..." : "Extract & Analyze Report"}
            </button>
          </div>
        </motion.section>

        {/* Right Column: Insights & Graphs */}
        <motion.section 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="glass-panel h-full" style={{ minHeight: '500px' }}>
            <h2 className="text-sm text-gray flex items-center gap-2 mb-4"><ShieldCheck size={16}/> Health Dashboard</h2>
            
            {!results && !analyzing && (
              <div className="flex flex-col items-center justify-center h-full text-center mt-4 pt-4" style={{ marginTop: '5rem', opacity: 0.5 }}>
                <Activity size={48} className="mb-4 text-gray" />
                <p>Upload a report to generate structure, verify risks,<br/>and see your real data graphed here.</p>
              </div>
            )}

            {analyzing && (
              <div className="flex flex-col items-center justify-center h-full mt-4 pt-4" style={{ marginTop: '5rem' }}>
                <Loader2 className="animate-spin text-accent" size={48} style={{ animation: 'spin 1s linear infinite' }} />
                <p className="mt-4 text-sm text-gray">Gemini is translating your medical data...</p>
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {results && !analyzing && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                
                {/* Metrics Breakdown (Graphs) */}
                <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--panel-border)', marginBottom: '1.5rem' }}>
                    <h3 className="text-primary flex items-center gap-2 mb-4">
                      <Activity size={18} className="text-accent"/> Extracted Metrics (vs Healthy Range)
                    </h3>
                    <div className="grid gap-4 mt-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                      {results.extracted_metrics && results.extracted_metrics.map((metric, idx) => (
                        <div key={idx} className="glass-panel" style={{ padding: '16px' }}>
                          <div className="flex justify-between items-center mb-2">
                             <span className="font-semibold text-sm">{metric.name}</span>
                             <span className={`text-sm ${metric.status.toLowerCase() === 'high' ? 'text-danger' : metric.status.toLowerCase() === 'low' ? 'text-warning' : 'text-success'}`}>
                               {metric.value} {metric.unit} ({metric.status})
                             </span>
                          </div>
                          <MetricChart metric={metric} />
                          <div className="flex justify-between text-xs text-gray mt-1">
                            <span>0</span>
                            <span>Normal Range: {metric.min_normal} - {metric.max_normal}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                </div>

                {/* AI Insights */}
                <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--panel-border)', marginBottom: '1.5rem' }}>
                  <h3 className="text-warning flex items-center gap-2 mb-4">
                    <AlertTriangle size={18} /> Personalized Report Insights
                  </h3>
                  {results.insights && results.insights.map((insight, idx) => (
                    <div key={idx} className="insight-card warning">
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </div>

                {/* Recommendations Plan */}
                <div>
                  <h3 className="text-success flex items-center gap-2 mb-4">
                    <Zap size={18} /> Recommended Action Plan
                  </h3>
                  {results.recommendations && results.recommendations.map((rec, idx) => (
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
