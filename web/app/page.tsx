"use client";

import { useState } from "react";
import { ClaimAirdrop } from "@/components/ClaimAirdrop";
import { CreateAirdrop } from "@/components/CreateAirdrop";
import { SetupStatus } from "@/components/SetupStatus";
import { WalletButton } from "@/components/WalletButton";
import { useWallet } from "@/lib/wallet";

type View = "landing" | "overview" | "create" | "claim";

const JayaangLogo = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <path d="M24 4L40 14V34L24 44L8 34V14L24 4Z" stroke="white" strokeWidth="1.5" fill="none" opacity="0.9"/>
    <path d="M24 12L34 18V30L24 36L14 30V18L24 12Z" fill="white" fillOpacity="0.15"/>
    <circle cx="24" cy="24" r="5" fill="white" opacity="0.95"/>
  </svg>
);

export default function JayaangApp() {
  const [currentView, setCurrentView] = useState<View>("landing");
  const { isConnected } = useWallet();

  const navItems = [
    { id: "overview" as const, label: "Dashboard", emoji: "▣" },
    { id: "create" as const, label: "Create Campaign", emoji: "✦" },
    { id: "claim" as const, label: "Claim Tokens", emoji: "◈" },
  ];

  // ── LANDING PAGE ──────────────────────────────────────────────
  if (currentView === "landing") {
    return (
      <div className="landing-root">
        {/* Radial glow background */}
        <div className="landing-glow" />
        <div className="landing-glow landing-glow-2" />

        {/* Noise/grain overlay */}
        <div className="landing-grain" />

        {/* Content */}
        <div className="landing-content">
          <div className="landing-logo">
            <JayaangLogo />
          </div>

          <h1 className="landing-title">
            Enter the Jayaang<br />Airdrop Portal
          </h1>

          <p className="landing-subtitle">
            Create and claim gas-efficient Merkle airdrops on Injective
          </p>

          <button
            className="landing-cta"
            onClick={() => setCurrentView("overview")}
          >
            Enter Portal
          </button>

          <div className="landing-badge">
            <span className="landing-dot" />
            injective-888 testnet
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN APP ──────────────────────────────────────────────────
  return (
    <div className="app-root">
      {/* Navbar */}
      <nav className="app-nav">
        <div className="app-nav-inner">
          {/* Left: logo + nav */}
          <div className="app-nav-left">
            <button className="app-logo" onClick={() => setCurrentView("landing")}>
              <JayaangLogo />
              <div>
                <div className="app-logo-name">Jayaang</div>
                <div className="app-logo-sub">INJECTIVE • MERKLE AIRDROPS</div>
              </div>
            </button>

            <div className="app-nav-links">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`app-nav-link ${currentView === item.id ? "active" : ""}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: wallet + network */}
          <div className="app-nav-right">
            <div className="app-network-pill">
              <span className="app-network-dot" />
              injective-888
            </div>
            <WalletButton />
          </div>
        </div>
      </nav>

      {/* Mobile tab bar */}
      <div className="app-tabbar">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`app-tab ${currentView === item.id ? "active" : ""}`}
          >
            <span>{item.emoji}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main */}
      <main className="app-main">
        <div className="app-container">

          {/* OVERVIEW */}
          {currentView === "overview" && (
            <div className="fade-in">
              <div className="page-header">
                <div>
                  <div className="page-eyebrow">INJECTIVE TESTNET</div>
                  <h1 className="page-title">Merkle Airdrop Platform</h1>
                  <p className="page-desc">Create, fund, and distribute tokens with cryptographic Merkle proofs on Injective.</p>
                </div>
                <div className="page-actions">
                  <button onClick={() => setCurrentView("create")} className="app-btn-primary">Create Campaign</button>
                  <button onClick={() => setCurrentView("claim")} className="app-btn-ghost">Claim Tokens</button>
                </div>
              </div>

              {/* Metrics */}
              <div className="metrics-grid">
                {[
                  { label: "Total Campaigns", value: "12", sub: "+3 this week", color: "#6366F1" },
                  { label: "Tokens Distributed", value: "142.8k", sub: "INJ • Testnet", color: "#8B5CF6" },
                  { label: "Claim Rate", value: "87.4%", sub: "+12% vs last month", color: "#6366F1" },
                  { label: "Avg Claim Time", value: "14s", sub: "Median on Injective", color: "#8B5CF6" },
                ].map(m => (
                  <div key={m.label} className="metric-card">
                    <div className="metric-label">{m.label}</div>
                    <div className="metric-value" style={{ color: m.color }}>{m.value}</div>
                    <div className="metric-sub">{m.sub}</div>
                  </div>
                ))}
              </div>

              {/* How it works */}
              <div className="info-grid">
                <div className="info-card">
                  <div className="info-eyebrow">WHY JAYAANG?</div>
                  <h3 className="info-title">The most elegant way to airdrop on Injective</h3>
                  <div className="feature-list">
                    {[
                      { icon: "⚡", title: "Gas Efficient", desc: "Merkle proofs minimize on-chain storage and gas costs dramatically." },
                      { icon: "🔒", title: "Cryptographically Secure", desc: "Only eligible recipients can claim. Impossible to forge proofs." },
                      { icon: "🌐", title: "Permissionless", desc: "Anyone can create campaigns. No gatekeepers or approvals needed." },
                      { icon: "🛠️", title: "Developer Friendly", desc: "Simple SDK, clean contracts, and a beautiful frontend." },
                    ].map((f, i) => (
                      <div key={i} className="feature-item">
                        <span className="feature-icon">{f.icon}</span>
                        <div>
                          <div className="feature-title">{f.title}</div>
                          <div className="feature-desc">{f.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-eyebrow">HOW IT WORKS</div>
                  <h3 className="info-title">Five simple steps to launch your airdrop</h3>
                  <div className="steps-list">
                    {[
                      { n: "01", title: "Upload Recipients", desc: "CSV with inj1 addresses + amounts in smallest units" },
                      { n: "02", title: "Generate Merkle Root", desc: "We build the tree locally in your browser. Download merkle.json" },
                      { n: "03", title: "Create & Fund Campaign", desc: "Send native INJ to the smart contract. Campaign is live instantly." },
                      { n: "04", title: "Share with Community", desc: "Distribute the merkle.json file or host it publicly." },
                      { n: "05", title: "Recipients Claim", desc: "Connect Keplr → Upload JSON → Verify eligibility → Claim in seconds." },
                    ].map((s, i) => (
                      <div key={i} className="step-item">
                        <div className="step-num">{s.n}</div>
                        <div>
                          <div className="step-title">{s.title}</div>
                          <div className="step-desc">{s.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contract status */}
              <div className="info-card">
                <div className="info-card-header">
                  <div>
                    <div className="info-title" style={{ marginBottom: 4 }}>Contract Status</div>
                    <div className="metric-sub">Live on Injective Testnet • CosmWasm</div>
                  </div>
                  <button onClick={() => setCurrentView("create")} className="app-btn-ghost" style={{ fontSize: 13 }}>
                    Deploy new campaign →
                  </button>
                </div>
                <SetupStatus />
              </div>
            </div>
          )}

          {/* CREATE */}
          {currentView === "create" && (
            <div className="fade-in">
              <button onClick={() => setCurrentView("overview")} className="back-btn">← Back to Dashboard</button>
              <div className="page-header" style={{ marginBottom: 32 }}>
                <div>
                  <h1 className="page-title">Create Campaign</h1>
                  <p className="page-desc">Upload CSV, generate Merkle proof, and fund your airdrop with native INJ.</p>
                </div>
              </div>
              <CreateAirdrop />
            </div>
          )}

          {/* CLAIM */}
          {currentView === "claim" && (
            <div className="fade-in">
              <button onClick={() => setCurrentView("overview")} className="back-btn">← Back to Dashboard</button>
              <div className="page-header" style={{ marginBottom: 32, textAlign: "center" }}>
                <div style={{ width: "100%" }}>
                  <h1 className="page-title">Claim Your Tokens</h1>
                  <p className="page-desc">Connect your Keplr wallet, select a campaign, and claim instantly.</p>
                </div>
              </div>
              <ClaimAirdrop />
            </div>
          )}

        </div>
      </main>

      <footer className="app-footer">
        Jayaang · Built for the Injective Hackathon · Testnet only ·{" "}
        <a href="https://github.com" target="_blank" rel="noreferrer">View on GitHub</a>
      </footer>
    </div>
  );
}
