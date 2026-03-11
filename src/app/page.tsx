"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Info, 
  History, 
  X, 
  Copy, 
  CheckCircle2, 
  UploadCloud, 
  Download, 
  Eye, 
  Cpu, 
  Zap, 
  Activity,
  Box,
  RefreshCw,
  Loader2,
  Terminal,
  ShieldCheck,
  LayoutGrid,
  FileJson
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"normalizer" | "config">("normalizer");
  const [configMode, setConfigMode] = useState<"parser" | "weightage">("parser");
  
  // Normalizer State
  const [status, setStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [phase, setPhase] = useState("-");
  const [message, setMessage] = useState("Telemetry awaiting signal...");
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showReadout, setShowReadout] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Config State
  const [rawInput, setRawInput] = useState("");
  const [configOutput, setConfigOutput] = useState("// Awaiting data transmission...");
  const [configCount, setConfigCount] = useState("00");
  const [isConfigProcessing, setIsConfigProcessing] = useState(false);

  // Modals
  const [showInfo, setShowInfo] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);

  // Copy Feedback
  const [copiedMain, setCopiedMain] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("nova_vortex_history");
    if (saved) setHistoryList(JSON.parse(saved));
  }, []);

  const saveToHistory = (data: string, mode: string) => {
    const newEntry = {
      id: Date.now(),
      data,
      mode,
      time: new Date().toLocaleTimeString(),
    };
    const updated = [newEntry, ...historyList].slice(0, 5);
    setHistoryList(updated);
    localStorage.setItem("nova_vortex_history", JSON.stringify(updated));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setStatus("idle");
      setPhase("Ready");
      setMessage(`Artifact "${file.name}" identified.`);
      setProgress(0);
      setShowReadout(false);
    }
  };

  const handleNormalizerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setStatus("running");
    setPhase("Extraction");
    setMessage("Launching Mission...");
    setProgress(20);
    setSummary(null);
    setReportData(null);
    setShowReadout(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const resp = await fetch("/api/process", { method: "POST", body: formData });
      const data = await resp.json();
      
      if (!resp.ok) throw new Error(data.error || "Mission Failed");

      setProgress(100);
      setPhase("Analysis");
      setMessage("Mission Complete.");
      setSummary(data.summary);
      setReportData(data.report);
      setStatus("completed");
    } catch (err: any) {
      setStatus("error");
      setMessage("Error: " + err.message);
      setPhase("ABORTED");
    }
  };

  const handleConfigProcess = async () => {
    if (!rawInput) return;
    setIsConfigProcessing(true);
    
    try {
      const endpoint = configMode === "parser" ? "/api/config/parse" : "/api/config/weightage";
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: rawInput }),
      });
      const result = await resp.json();
      const jsonStr = JSON.stringify(result.output, null, 2);
      setConfigOutput(jsonStr);
      saveToHistory(jsonStr, configMode);

      let count = 0;
      if (configMode === "parser") {
        count = result.output.tests?.length || 0;
      } else {
        count = result.output[0]?.testcases?.length || 0;
      }
      setConfigCount(count.toString().padStart(2, "0"));
    } catch (e) {}
    finally {
      setIsConfigProcessing(false);
    }
  };

  const copyToClipboard = async (text: string, type: "main" | "config") => {
    if (!text || text.startsWith("//")) return;
    try {
      await navigator.clipboard.writeText(text);
      if (type === "main") {
        setCopiedMain(true);
        setTimeout(() => setCopiedMain(false), 2000);
      } else {
        setCopiedConfig(true);
        setTimeout(() => setCopiedConfig(false), 2000);
      }
    } catch (e) {}
  };

  const downloadReport = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "normalized_report.json";
    a.click();
  };

  return (
    <div className="app-container">
      <nav className="celestial-nav">
        <div className="container-custom nav-flex">
          <div className="nav-brand">NOVA SYSTEM</div>
          <div className="nav-tabs">
            <button className={`nav-btn ${activeTab === "normalizer" ? "active" : ""}`} onClick={() => setActiveTab("normalizer")}>Report Normalizer</button>
            <button className={`nav-btn ${activeTab === "config" ? "active" : ""}`} onClick={() => setActiveTab("config")}>Config Generator</button>
          </div>
        </div>
      </nav>

      {/* Modals */}
      {showInfo && (
        <div className="overlay active" onClick={() => setShowInfo(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-close" onClick={() => setShowInfo(false)}><X size={20} /></div>
            <div className="modal-accent-br"></div>
            <h3 className="modal-title">Mission Protocol</h3>
            <div className="modal-content">
              <div className="protocol-card">
                <div style={{background: "rgba(6, 182, 212, 0.1)", padding: "0.75rem", borderRadius: "12px", color: "var(--ion-cyan)"}}>
                  <FileJson size={20} />
                </div>
                <div>
                  <b>1. NORMALIZER</b>
                  <span>Extracts structured telemetry from report artifacts. Deep-parses nested spec suites with millisecond precision.</span>
                </div>
              </div>
              <div className="protocol-card">
                <div style={{background: "rgba(219, 39, 119, 0.1)", padding: "0.75rem", borderRadius: "12px", color: "var(--nebula-pink)"}}>
                  <Terminal size={20} />
                </div>
                <div>
                  <b>2. LOG SCANNER</b>
                  <span>Neural pattern recognition for raw logs. Maps chaotic terminal output to calibrated JSON structures.</span>
                </div>
              </div>
              <div className="protocol-card">
                <div style={{background: "rgba(16, 185, 129, 0.1)", padding: "0.75rem", borderRadius: "12px", color: "var(--emerald)"}}>
                  <LayoutGrid size={20} />
                </div>
                <div>
                  <b>3. WEIGHTAGE</b>
                  <span>Orbital gravity calibration for CI shards. Optimizes test distribution loads for zero-latency execution.</span>
                </div>
              </div>
            </div>
            <button className="btn-ion" onClick={() => setShowInfo(false)} style={{marginTop: "1.5rem", height: "50px", borderRadius: "14px"}}>Synchronize Control</button>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="overlay active" onClick={() => setShowHistory(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-close" onClick={() => setShowHistory(false)}><X size={20} /></div>
            <h3 className="modal-title">Celestial Archive</h3>
            <div id="historyContent">
              {historyList.length === 0 ? (
                <div style={{textAlign: "center", opacity: 0.3, padding: "5rem 0"}}>
                  <RefreshCw size={48} style={{margin: "0 auto 1.5rem", opacity: 0.2}} />
                  <p className="history-text" style={{letterSpacing: "0.2em"}}>ARCHIVE EMPTY</p>
                </div>
              ) : (
                historyList.map(item => (
                  <div key={item.id} className="history-card">
                    <div className="history-meta">
                      <span className="history-mode">{item.mode}</span>
                      <span className="history-time">{item.time}</span>
                    </div>
                    <pre className="history-text" style={{maxHeight:"60px", overflow:"hidden", background: "rgba(0,0,0,0.4)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", marginBottom: "1rem"}}>{item.data.substring(0, 150)}...</pre>
                    <button className="btn-ion" onClick={() => { setConfigOutput(item.data); setShowHistory(false); }} style={{padding:"0.6rem 1.25rem", fontSize:"0.7rem", height:"40px", borderRadius: "10px", width: "auto"}}>Restore Archive</button>
                  </div>
                ))
              )}
            </div>
            <button className="btn-blue-close" onClick={() => setShowHistory(false)}>Close Archives</button>
          </div>
        </div>
      )}

      <header className="app-header">
        <div className="container-custom">
          <div className="brand-orbit">
            <div className="planet-atmosphere"></div>
            <div className="orbit-ring-1"></div>
            <div className="orbit-ring-2"></div>
            <div className="orbit-nodes">
              <div className="mini-planet p1"></div>
              <div className="mini-planet p2"></div>
              <div className="mini-planet p3"></div>
              <div className="mini-planet p4"></div>
              <div className="mini-planet p5"></div>
              <div className="mini-planet p6"></div>
              <div className="mini-planet p7"></div>
              <div className="mini-planet p8"></div>
              <div className="mini-planet p9"></div>
            </div>
            <div className="sphere-container">
              <div className="main-sphere"></div>
              <div className="tech-shell"></div>
            </div>
          </div>
          <h1 className="title-main">Nova</h1>
          <p className="tagline">Galaxy-Scale Data Transformation</p>
        </div>
      </header>

      <main className="container-custom">
        {activeTab === "normalizer" ? (
          <div className="dashboard-grid">
            <aside>
              <section className="glass-card">
                <div className="card-title">Launch Protocol</div>
                <form onSubmit={handleNormalizerSubmit}>
                  <label className="ion-dropzone" htmlFor="zipInput">
                    <input id="zipInput" type="file" accept=".zip" required ref={fileInputRef} onChange={handleFileChange} />
                    <div className="ion-icon-wrap"><UploadCloud size={32} /></div>
                    <span className="ion-label">Transmit Artifact</span>
                    <span className="ion-sub">{fileName || "Target: report.zip"}</span>
                  </label>
                  <button id="startBtn" type="submit" className="btn-ion" disabled={status === "running"} style={{marginTop: "1.5rem", height: "44px"}}>
                    {status === "running" ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}       
                    {status === "running" ? "Initiating Warp..." : "Initiate Warp"}
                  </button>
                </form>
                <p style={{textAlign:"center", fontSize:"0.7rem", color:"var(--ion-cyan)", marginTop:"1rem", fontWeight:800}}>STATION: {status.toUpperCase()}</p>
              </section>

              <section className="glass-card">
                <div className="card-title">Mission Status <span className={`badge-celestial ${status === "running" ? "running" : "idle"}`}>{status.toUpperCase()}</span></div>
                <div className="progress-meta"><span>Sector: {phase}</span><span>{progress}%</span></div>
                <div className="energy-track"><div className="energy-bar" style={{width: `${progress}%`}}></div></div>
                <p className="log-stream">{message}</p>
              </section>
            </aside>

            <article>
              <section className="glass-card">
                <div className="card-title">Discovery Data</div>
                <div className="celestial-stats">
                  <div className="stat-orb"><span className="label">Total Tests</span><strong>{summary?.total || 0}</strong></div>
                  <div className="stat-orb"><span className="label">Success</span><strong style={{color:"var(--success)"}}>{summary?.passed || 0}</strong></div>
                  <div className="stat-orb"><span className="label">Failed</span><strong style={{color:"var(--danger)"}}>{summary?.failed || 0}</strong></div>
                  <div className="stat-orb"><span className="label">Efficiency</span><strong>{summary?.passRate || 0}%</strong></div>
                  <div className="stat-orb full"><span className="label">Total Steps Extracted</span><strong style={{color:"var(--star-gold)"}}>{summary?.steps || 0}</strong></div>
                </div>
                <div className="mission-actions">
                  <button className="btn-ion" onClick={downloadReport} disabled={!reportData} style={{background: "var(--success)", color: "#000"}}><Download size={14} /> Recover</button>
                  <button className="btn-secondary" onClick={() => setShowReadout(!showReadout)} disabled={!reportData}><Eye size={14} /> Readout</button>
                </div>
              </section>

              {showReadout && (
                <section className="glass-card">
                  <div className="card-title"><span>Artifact Readout</span><button className="btn-copy" onClick={() => copyToClipboard(reportData ? JSON.stringify(reportData, null, 2) : "", "main")} style={{ background: copiedMain ? "var(--emerald)" : "", color: copiedMain ? "#000" : "" }}><Copy size={12} /> {copiedMain ? "Copied" : "Copy JSON"}</button></div>
                  <div className="hologram-console"><pre>{reportData ? JSON.stringify(reportData, null, 2) : "// Transmission empty..."}</pre></div>
                </section>
              )}
            </article>
          </div>
        ) : (
          <div id="section-config">
            <div className="config-header-hud">
              <div className="tabs-custom">
                <button className={`tab-custom ${configMode === "parser" ? "active" : ""}`} onClick={() => setConfigMode("parser")}>LOG SCANNER</button>
                <button className={`tab-custom ${configMode === "weightage" ? "active" : ""}`} onClick={() => setConfigMode("weightage")}>WEIGHTAGE</button>
              </div>
              <div className="utility-controls">
                <div className="icon-btn" title="Mission Briefing" onClick={() => setShowInfo(true)}><Info size={16} /></div>
                <div className="icon-btn" title="Celestial Archive" onClick={() => setShowHistory(true)}><History size={16} /></div>
                <div className="stat-orb-mini"><span className="label">Identified</span><strong>{configCount}</strong></div>
              </div>
            </div>

            <div className="dashboard-grid">
              <section className="glass-card">
                <div className="card-title"><span>Raw Input Terminal</span><button className="btn-copy" style={{padding:"0.2rem 0.6rem", borderRadius:"6px"}} onClick={() => setRawInput("")}>Purge</button></div>
                <textarea className="input-area" placeholder={configMode === "parser" ? "// Paste logs here..." : "// Paste source JSON..."} value={rawInput} onChange={(e) => setRawInput(e.target.value)}></textarea>
                <button className="btn-ion" onClick={handleConfigProcess} style={{marginTop:"1.5rem", height: "44px"}} disabled={isConfigProcessing}><Cpu size={14} /> {isConfigProcessing ? "Scanning..." : "Initiate Scan"}</button>      
              </section>

              <section className="glass-card">
                <div className="card-title"><span>Output Matrix</span><button className="btn-copy" onClick={() => copyToClipboard(configOutput, "config")} style={{ background: copiedConfig ? "var(--emerald)" : "", color: copiedConfig ? "#000" : "" }} disabled={configOutput.startsWith("//")}><Copy size={12} /> {copiedConfig ? "Copied" : "Copy JSON"}</button></div>
                <div className="hologram-console"><pre>{configOutput}</pre></div>
              </section>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer"><div className="container-custom"><p>&copy; 2026 NOVA UNIFIED SYSTEM &bull; DATA TRANSFORMATION FRONTIER</p></div></footer>
    </div>
  );
}
