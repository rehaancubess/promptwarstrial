import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  Activity,
  Zap,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Loader2,
  CheckCircle2,
  History as HistoryIcon,
  TrendingUp,
  TrendingDown,
  Minus,
  LogOut,
  User,
  FileUp,
  CheckCircle,
  Lock,
  Mic,
  BarChart2,
  ArrowRight,
  Sparkles,
  Shield,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "./firebase";

const VoiceDoctor = React.lazy(() => import("./components/VoiceDoctor"));

/* ─── LANDING PAGE ──────────────────────────────────────────────────────────── */
function LandingPage({ onGetStarted }) {
  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-brand">Hemora Health AI</div>
        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#reviews">Reviews</a>
          <a href="#safety">Safety</a>
        </div>
        <button className="landing-login-btn" onClick={onGetStarted}>
          Log in
        </button>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <p className="landing-eyebrow">Future of Medical AI</p>
          <h1 className="landing-hero-title">
            Instantly analyze your <em>medical reports</em> with Gemini AI.
          </h1>
          <p className="landing-hero-desc">
            Transform complex laboratory data into clear, actionable health
            insights. Precision medicine meets intuitive editorial design.
          </p>
          <div className="landing-hero-ctas">
            <button className="landing-cta-primary" onClick={onGetStarted}>
              Get Started
            </button>
            <button className="landing-cta-secondary">View Demo</button>
          </div>
        </div>
        <div className="landing-hero-visual">
          <div className="landing-hero-card">
            <div className="landing-hero-card-header">
              <span className="landing-status-dot" />
              Analysis Complete
            </div>
            <div className="landing-hero-metrics">
              {[
                {
                  name: "Hemoglobin",
                  val: "14.2",
                  unit: "g/dL",
                  status: "normal",
                },
                { name: "Glucose", val: "112", unit: "mg/dL", status: "high" },
                {
                  name: "Cholesterol",
                  val: "185",
                  unit: "mg/dL",
                  status: "normal",
                },
              ].map((m) => (
                <div className="landing-metric-row" key={m.name}>
                  <span className="landing-metric-name">{m.name}</span>
                  <span className={`landing-metric-val ${m.status}`}>
                    {m.val} {m.unit}
                  </span>
                </div>
              ))}
            </div>
            <div className="landing-hero-tag">
              AI risk scored as <strong>Low</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Sophisticated label */}
      <div className="landing-section-label">
        <span>Sophisticated Clinical Intelligence</span>
        <div className="landing-label-line" />
      </div>

      {/* Feature cards */}
      <section className="landing-features" id="features">
        <div className="landing-features-grid">
          <div className="landing-feature-card">
            <div className="landing-feature-icon red">
              <Mic size={20} />
            </div>
            <h3>Real-time Voice Doctor</h3>
            <p>
              Speak naturally with our AI clinical assistant. Gemini answers
              with synthesis, creative interpretive context for your lab values,
              explaining complex hematology in human terms.
            </p>
            <div className="landing-waveform">
              {[3, 6, 4, 8, 5, 10, 6, 8, 4, 7, 5, 9, 4].map((h, i) => (
                <div
                  key={i}
                  className="landing-wave-bar"
                  style={{ height: `${h * 2.5}px` }}
                />
              ))}
            </div>
          </div>

          <div className="landing-feature-card highlighted">
            <div style={{ display: "flex", gap: "12px" }}>
              <div>
                <div className="landing-feature-icon gray">
                  <Shield size={20} />
                </div>
                <h3>Secure Google Sign-In</h3>
                <p>
                  HIPAA-compliant security architecture. Access your health
                  records instantly and safely using your existing credentials.
                </p>
                <div className="landing-google-pill">
                  <GoogleG /> Continue with Google
                </div>
              </div>
            </div>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon red">
              <BarChart2 size={20} />
            </div>
            <h3>Trend Tracking</h3>
            <p>
              Watch your health evolve. Our system cross-references historical
              clinical data to map trends in your metabolic, cardiac, and entire
              health markers.
            </p>
            <div className="landing-trend-bars">
              {[30, 45, 38, 60, 52, 70, 65].map((h, i) => (
                <div
                  key={i}
                  className="landing-trend-bar"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>
          </div>

          <div className="landing-feature-card">
            <div
              style={{
                borderLeft: "3px solid var(--red)",
                paddingLeft: "1rem",
              }}
            >
              <h3>Editorial Summaries</h3>
              <p style={{ marginBottom: "0.75rem" }}>
                We don't just share numbers. Hemora generates high-end editorial
                summaries that read like a p personalized health brief curated
                for your longevity.
              </p>
              <ul className="landing-summary-list">
                <li>
                  <span className="dot" />
                  Instant Health Reports
                </li>
                <li>
                  <span className="dot" />
                  Contextual Medical Glossary
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="landing-testimonial" id="reviews">
        <div className="landing-testimonial-image" />
        <div className="landing-testimonial-content">
          <p className="landing-quote">
            &ldquo;Hemora turned my confusing blood work into a clear roadmap
            for my wellness journey. It&rsquo;s the health companion I
            didn&rsquo;t know I needed.&rdquo;
          </p>
          <p className="landing-quote-author">
            &mdash; Sarah Jenkins, Wellness Enthusiast &amp; Busy Disruptor
          </p>
          <div className="landing-stats">
            <div className="landing-stat">
              <strong>99.8%</strong>
              <span>AI Accuracy</span>
            </div>
            <div className="landing-stat">
              <strong>50K+</strong>
              <span>Reports Analyzed</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="landing-cta-section">
        <h2>Ready to decode your health?</h2>
        <p>
          Join thousands of health-conscious individuals taking control of their
          medical data with our clinical editorial analysis.
        </p>
        <div className="landing-hero-ctas">
          <button className="landing-cta-primary" onClick={onGetStarted}>
            Get Started for Free
          </button>
          <button className="landing-cta-secondary">Clinical Standards</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-brand">
          <div className="landing-footer-logo">Hemora Health AI</div>
          <p>
            Bringing medical editorial intelligence and precision design to
            healthcare.
          </p>
        </div>
        <div className="landing-footer-cols">
          <div>
            <strong>PLATFORM</strong>
            <a href="#">Analysis Engine</a>
            <a href="#">Safety Archives</a>
            <a href="#">Pricing</a>
          </div>
          <div>
            <strong>COMPANY</strong>
            <a href="#">About Us</a>
            <a href="#">Research</a>
            <a href="#">Careers</a>
          </div>
          <div>
            <strong>SUPPORT</strong>
            <a href="#">Help Center</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <span>
            © 2024 Hemora Health AI. All rights reserved. Clinical Editorial
            Suite v1.0
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ─── Google G SVG ─────────────────────────────────────────────────────────── */
function GoogleG() {
  return (
    <svg
      className="google-logo"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

/* ─── Metric Mini Chart ────────────────────────────────────────────────────── */
const MetricChart = React.memo(function MetricChart({ metric }) {
  const chartMax = Math.max(metric.max_normal * 1.5, metric.value * 1.2);
  const data = useMemo(
    () => [{ name: metric.name, value: metric.value }],
    [metric.name, metric.value],
  );

  let barColor = "#16a34a";
  if (metric.status.toLowerCase() === "low") barColor = "#2563eb";
  if (metric.status.toLowerCase() === "high") barColor = "#C41230";

  return (
    <div style={{ height: "60px", width: "100%", marginTop: "0.5rem" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, left: -24, bottom: 0 }}
        >
          <XAxis type="number" domain={[0, chartMax]} hide />
          <YAxis dataKey="name" type="category" hide />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #E8E4DF",
              borderRadius: "8px",
              fontSize: "0.8rem",
              color: "#1A1A18",
            }}
            cursor={{ fill: "rgba(0,0,0,0.03)" }}
          />
          <ReferenceArea
            x1={metric.min_normal}
            x2={metric.max_normal}
            fill="rgba(22,163,74,0.07)"
          />
          <Bar
            dataKey="value"
            fill={barColor}
            radius={[0, 4, 4, 0]}
            barSize={12}
          />
          <ReferenceLine
            x={metric.min_normal}
            stroke="#d1d5db"
            strokeDasharray="3 3"
          />
          <ReferenceLine
            x={metric.max_normal}
            stroke="#d1d5db"
            strokeDasharray="3 3"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

/* ─── LOGIN PAGE ───────────────────────────────────────────────────────────── */
function LoginPage({ onLogin }) {
  return (
    <div className="login-page">
      <div className="login-blob login-blob-1" />
      <div className="login-blob login-blob-2" />

      <div className="login-content">
        {/* Logo */}
        <div className="login-logo-wrap">
          <span style={{ fontSize: "26px" }}>🩺</span>
        </div>

        <h1 className="login-title">Hemora Health AI</h1>
        <p className="login-subtitle">Clinical Editorial Platform</p>

        {/* Card */}
        <div className="login-card">
          <h2>Sign in</h2>
          <p>
            Access your laboratory insights and clinical reports through our
            secure gateway.
          </p>

          <button
            className="google-btn"
            onClick={onLogin}
            aria-label="Sign in with Google"
          >
            <GoogleG />
            Sign in with Google
          </button>

          <div className="login-divider">
            <span>Secured Access</span>
          </div>

          <div className="privacy-card">
            <CheckCircle size={18} />
            <div>
              <strong>Privacy Guaranteed</strong>
              <p>
                Your clinical data is encrypted with enterprise-grade protocols.
                We never share results with third parties without explicit
                consent.
              </p>
            </div>
          </div>
        </div>

        {/* Footer links */}
        <div className="login-footer-links">
          <a href="#">Help Center</a>
          <a href="#">Privacy Policy</a>
        </div>

        {/* Bottom section */}
        <div className="login-bottom">
          <div className="login-tiny-icon">
            <Lock size={14} />
          </div>
          <p className="login-copyright">
            © 2024 Hemora Health Systems &bull; Version 2.4.0-stable
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── SIDEBAR NAV ──────────────────────────────────────────────────────────── */
function Sidebar({ view, onNav }) {
  const items = [
    { id: "upload", label: "Upload", icon: <FileUp size={16} /> },
    { id: "history", label: "History", icon: <HistoryIcon size={16} /> },
    { id: "voice", label: "AI Doctor", icon: <Activity size={16} /> },
  ];

  return (
    <aside className="sidebar" role="navigation" aria-label="App Navigation">
      <div className="sidebar-brand-box">
        <div className="sidebar-brand-icon">
          <span style={{ fontSize: "16px" }}>🔬</span>
        </div>
        <div className="sidebar-brand-text">
          <strong>CLINICAL LAB</strong>
          <span>AI Editorial v1.0</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${view === item.id ? "active" : ""}`}
            onClick={() => onNav(item.id)}
            aria-current={view === item.id ? "page" : undefined}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Storage widget */}
      <div className="storage-widget">
        <div className="storage-label">Storage Usage</div>
        <div className="storage-bar-track">
          <div className="storage-bar-fill" />
        </div>
        <div className="storage-bar-used">
          <div className="storage-bar-used-fill" />
        </div>
        <div className="storage-note">50% of 2GB Clinical Data used</div>
      </div>
    </aside>
  );
}

/* ─── HIPAA IMAGE CARD ─────────────────────────────────────────────────────── */
function HipaaCard() {
  return (
    <div className="hipaa-card">
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #6b2d3e 100%)",
        }}
      />
      <div className="hipaa-card-text">
        <p>HIPAA Compliant Encryption active for all clinical uploads.</p>
      </div>
    </div>
  );
}

/* ─── UPLOAD VIEW ──────────────────────────────────────────────────────────── */
function UploadView({ user, apiUrl }) {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      let token = "fake-token";
      if (user?.getIdToken) token = await user.getIdToken();
      const res = await fetch(`${apiUrl}/api/analyze`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setResults(data);
      setFile(null);
    } catch (e) {
      console.error(e);
      setError(
        "Failed to analyze the report. Please check if the backend is running.",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const riskLevel = results?.risk_level?.toLowerCase() || "low";

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          Clinical <em>Analysis</em> Intake
        </h1>
        <p className="page-desc">
          Upload your laboratory results and medical imaging for AI-driven
          clinical interpretation. Our system processes data with clinical-grade
          precision.
        </p>
      </div>

      {/* Upload + Status grid */}
      {!results && (
        <div className="upload-grid">
          {/* Drop zone */}
          <div
            className={`file-drop-card ${file ? "active" : ""}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() =>
              !analyzing && document.getElementById("fileUpload").click()
            }
            tabIndex={0}
            role="button"
            aria-label="Upload medical report"
            onKeyDown={(e) => {
              if (e.key === "Enter")
                document.getElementById("fileUpload").click();
            }}
          >
            <input
              id="fileUpload"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
              aria-hidden="true"
            />

            {analyzing ? (
              <div className="analyzing-state">
                <div className="spinner" />
                <p>
                  Gemini is parsing your metrics and comparing
                  <br />
                  them to your private health baseline…
                </p>
              </div>
            ) : (
              <>
                <div className="file-drop-icon">
                  {file ? <FileText size={28} /> : <FileUp size={28} />}
                </div>

                {file ? (
                  <>
                    <h3>{file.name}</h3>
                    <p>File ready — click below to analyze</p>
                  </>
                ) : (
                  <>
                    <h3>Drag &amp; Drop Reports</h3>
                    <p>
                      Securely upload your clinical documents for instant review
                    </p>
                  </>
                )}

                <button
                  className="select-files-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    file
                      ? handleUpload()
                      : document.getElementById("fileUpload").click();
                  }}
                  disabled={analyzing}
                  aria-label={file ? "Analyze Report" : "Select Files"}
                >
                  {file ? (
                    <>
                      <Zap size={16} /> Analyze Report
                    </>
                  ) : (
                    <>
                      <UploadCloud size={16} /> Select Files
                    </>
                  )}
                </button>

                <div className="file-type-badges">
                  {["PDF", "DICOM", "JPG/PNG"].map((t) => (
                    <span className="file-badge" key={t}>
                      <CheckCircle size={12} /> {t}
                    </span>
                  ))}
                </div>
              </>
            )}

            {error && (
              <div className="error-banner" role="alert">
                {error}
              </div>
            )}
          </div>

          {/* Right sidebar widgets */}
          <div>
            <div className="status-card">
              <div className="status-card-label">System Status</div>
              <div className="status-row">
                <span>AI Engine</span>
                <span className="status-badge-op">Operational</span>
              </div>
              <div className="status-row">
                <span>OCR Accuracy</span>
                <span>99.8%</span>
              </div>
              <div className="status-note">
                Average processing time for standard blood work is &lt; 45
                seconds.
              </div>
            </div>

            <HipaaCard />
          </div>
        </div>
      )}

      {/* Results */}
      {results && !analyzing && (
        <motion.div
          className="results-section"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={`risk-banner ${riskLevel}`}>
            {riskLevel === "high" && <AlertTriangle size={18} />}
            {riskLevel === "moderate" && <AlertTriangle size={18} />}
            {riskLevel === "low" && <ShieldCheck size={18} />}
            Overall Risk Level:{" "}
            <strong style={{ textTransform: "capitalize" }}>
              {results.risk_level}
            </strong>
          </div>

          <button
            className="select-files-btn"
            style={{ marginBottom: "1.5rem" }}
            onClick={() => {
              setResults(null);
              setFile(null);
            }}
          >
            <UploadCloud size={16} /> Analyze Another Report
          </button>

          {/* Insights */}
          <div className="section-title">Dynamic Insights &amp; Trends</div>
          <div className="insights-card">
            {results.insights?.map((insight, i) => (
              <div className="insight-item" key={i}>
                <div className="insight-dot" />
                <p style={{ color: "inherit" }}>{insight}</p>
              </div>
            ))}
          </div>

          {/* Metrics */}
          <div className="section-title">Extracted Metrics</div>
          <div className="metrics-grid">
            {results.extracted_metrics?.map((metric, i) => {
              const st = metric.status.toLowerCase();
              const dir = metric.delta_direction;
              const hasDelta = metric.delta != null && dir && dir !== "none";
              const badgeClass = hasDelta
                ? st !== "normal"
                  ? dir === "up"
                    ? "up-bad"
                    : "down-bad"
                  : dir === "up"
                    ? "up-good"
                    : "down-good"
                : "neutral";
              return (
                <div className="metric-card" key={i}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <div className="metric-name">{metric.name}</div>
                      <div className={`metric-value ${st}`}>
                        {metric.value} {metric.unit} ({metric.status})
                      </div>
                    </div>
                    {hasDelta && (
                      <span className={`trend-badge ${badgeClass}`}>
                        {dir === "up" ? (
                          <TrendingUp size={11} />
                        ) : (
                          <TrendingDown size={11} />
                        )}
                        {metric.delta}
                      </span>
                    )}
                    {metric.delta != null && dir === "none" && (
                      <span className="trend-badge neutral">
                        <Minus size={11} /> 0
                      </span>
                    )}
                  </div>
                  <MetricChart metric={metric} />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      marginTop: "4px",
                    }}
                  >
                    <span>Min: {metric.min_normal}</span>
                    <span>Max: {metric.max_normal}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommendations */}
          <div className="section-title">Recommended Action Plan</div>
          <div className="insights-card">
            {results.recommendations?.map((rec, i) => (
              <div className="rec-item" key={i}>
                <CheckCircle2 size={16} className="rec-check" />
                <p style={{ color: "var(--text-secondary)" }}>{rec}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Feature callouts */}
      {!results && !analyzing && (
        <div className="features-section">
          <div className="features-grid">
            <div>
              <div className="feature-num">01</div>
              <h3 className="feature-title">Secure Extraction</h3>
              <p className="feature-desc">
                Our clinical OCR identifies biomarkers, reference ranges, and
                physician notes with sub-millimeter precision.
              </p>
            </div>
            <div>
              <div className="feature-num">02</div>
              <h3 className="feature-title">Cross-Reference</h3>
              <p className="feature-desc">
                The AI compares your results against the latest peer-reviewed
                clinical guidelines and historical lab data.
              </p>
            </div>
            <div>
              <div className="feature-num">03</div>
              <h3 className="feature-title">Editorial Insight</h3>
              <p className="feature-desc">
                Receive a beautifully curated report that translates complex
                data into actionable health insights and trend lines.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── HISTORY VIEW ─────────────────────────────────────────────────────────── */
function HistoryView({ user, apiUrl }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!user) return;
      setLoading(true);
      try {
        let token = "fake-token";
        if (user?.getIdToken) token = await user.getIdToken();
        const res = await fetch(`${apiUrl}/api/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setItems(data.history || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [user, apiUrl]);

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>Health Timeline</h2>
        <p>
          Your chronologically tracked medical parses. Watch your trends over
          time.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <div className="spinner" style={{ margin: "0 auto" }} />
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "var(--text-muted)",
          }}
        >
          <HistoryIcon
            size={40}
            style={{ margin: "0 auto 1rem", opacity: 0.3 }}
          />
          <p>
            No historical reports found. Upload your first one from the
            Dashboard.
          </p>
        </div>
      ) : (
        <div className="timeline" role="list">
          {items.map((item) => {
            const rl = item.analysis?.risk_level?.toLowerCase() || "low";
            return (
              <div className="timeline-item" key={item.id} role="listitem">
                <div className="timeline-dot" />
                <div className="timeline-card">
                  <div className="timeline-card-header">
                    <div>
                      <div className="timeline-filename">
                        {item.filename || "Uploaded Report"}
                      </div>
                      <div className="timeline-date">
                        {new Date(item.created_at).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>
                    <span className={`risk-pill ${rl}`}>
                      {item.analysis?.risk_level} Risk
                    </span>
                  </div>
                  <div
                    style={{
                      borderTop: "1px solid var(--border-light)",
                      paddingTop: "1rem",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: "600",
                        color: "var(--text-muted)",
                        marginBottom: "0.5rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Key Insights
                    </p>
                    <ul
                      style={{
                        paddingLeft: "1rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      {item.analysis?.insights?.slice(0, 2).map((ins, i) => (
                        <li
                          key={i}
                          style={{
                            fontSize: "0.875rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {ins}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── ROOT APP ─────────────────────────────────────────────────────────────── */
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState("upload");
  // 'landing' | 'login' | 'app'
  const [screen, setScreen] = useState("landing");

  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "https://hemora-backend-713215250376.us-central1.run.app";

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      // If already logged in, skip to app
      if (u) setScreen("app");
    });
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    if (!auth) {
      alert("Firebase config missing. Login disabled.");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
      alert("Failed to login with Google.");
    }
  };

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    setScreen("landing");
  };

  if (authLoading) {
    return (
      <div className="full-page-loader">
        <div className="spinner" />
      </div>
    );
  }

  // ── LANDING ──
  if (screen === "landing") {
    return <LandingPage onGetStarted={() => setScreen("login")} />;
  }

  // ── LOGIN ──
  if (screen === "login" && !user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      {/* Top Navbar */}
      <header className="top-nav" role="banner">
        <button
          className="top-nav-brand"
          onClick={() => setView("upload")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
          }}
          aria-label="Hemora Health AI home"
        >
          Hemora Health AI
        </button>

        <div className="top-nav-right">
          <button
            className="logout-btn"
            onClick={handleLogout}
            aria-label="Logout"
          >
            Logout <LogOut size={15} />
          </button>
          <div className="avatar" aria-label="User avatar">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || "User"} />
            ) : (
              <User size={16} />
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="app-body">
        <Sidebar view={view} onNav={setView} />

        <main className="main-content" role="main">
          <AnimatePresence mode="wait">
            {view === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <UploadView user={user} apiUrl={apiUrl} />
              </motion.div>
            )}

            {view === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <HistoryView user={user} apiUrl={apiUrl} />
              </motion.div>
            )}

            {view === "voice" && (
              <motion.div
                key="voice"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <React.Suspense
                  fallback={
                    <div className="spinner" style={{ margin: "3rem auto" }} />
                  }
                >
                  <VoiceDoctor user={user} />
                </React.Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Footer */}
      <footer className="main-footer" role="contentinfo">
        <span>© 2024 Hemora Health Systems</span>
        <div className="footer-links">
          <a href="#">Privacy Protocol</a>
          <a href="#">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}
