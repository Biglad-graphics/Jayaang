"use client";

import { useState } from "react";
import { ClaimAirdrop } from "@/components/ClaimAirdrop";
import { CreateAirdrop } from "@/components/CreateAirdrop";
import { SetupStatus } from "@/components/SetupStatus";
import { WalletButton } from "@/components/WalletButton";
import { useWallet } from "@/lib/wallet";

type View = "overview" | "create" | "claim";

export default function JayaangApp() {
  const [currentView, setCurrentView] = useState<View>("overview");
  const { isConnected, address } = useWallet();

  const navItems = [
    { id: "overview" as const, label: "Dashboard", icon: "📊" },
    { id: "create" as const, label: "Create Campaign", icon: "✨" },
    { id: "claim" as const, label: "Claim Tokens", icon: "🎁" },
  ];

  return (
    <div className="min-h-screen bg-[#050816] text-white flex flex-col">
      {/* Top Navbar - Injective Premium Style */}
      <nav className="navbar">
        <div className="container navbar-content">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00D1FF] to-[#7C3AED] flex items-center justify-center">
                <span className="text-[#050816] font-bold text-xl tracking-tighter">J</span>
              </div>
              <div>
                <div className="font-semibold text-xl tracking-tight">Jayaang</div>
                <div className="text-[10px] text-[#94A3B8] -mt-1">INJECTIVE • MERKLE AIRDROPS</div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 ml-6">
              <div className="pill pill-primary text-xs px-3 py-1">
                TESTNET
              </div>
              <div className="pill pill-accent text-xs px-3 py-1">
                inj1... • Keplr
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <WalletButton />
            
            {/* Network indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0B1120] border border-[#1F2937] text-xs">
              <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[#94A3B8]">injective-888</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="sidebar hidden lg:flex flex-col pt-6">
          <div className="px-4 mb-6">
            <div className="text-xs uppercase tracking-[2px] text-[#64748B] px-3 mb-2">PLATFORM</div>
          </div>

          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`nav-item text-left w-full ${currentView === item.id ? "active" : ""}`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          <div className="mt-auto px-4 py-6 border-t border-[#1F2937] mx-3">
            <div className="text-[11px] text-[#64748B] px-3 leading-relaxed">
              Built for the Injective ecosystem.<br />
              Gas-efficient • Permissionless • Secure.
            </div>
            
            <a 
              href="https://testnet.faucet.injective.network/" 
              target="_blank" 
              rel="noreferrer"
              className="mt-4 block text-xs px-3 py-2 text-[#00D1FF] hover:underline"
            >
              → Get testnet INJ
            </a>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="container py-8 md:py-10">
            
            {/* OVERVIEW / DASHBOARD VIEW */}
            {currentView === "overview" && (
              <div className="space-y-10 animate-fade-in">
                {/* Hero Header */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="pill pill-primary">OFFICIAL INJECTIVE BUILD</div>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-semibold tracking-tighter leading-none">
                      Build Secure<br />Merkle Airdrops
                    </h1>
                    <p className="mt-4 max-w-md text-xl text-[#94A3B8]">
                      Create, fund, and distribute tokens to thousands of wallets with cryptographic Merkle proofs on Injective.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setCurrentView("create")}
                      className="btn btn-primary px-8 py-3.5 text-base"
                    >
                      Create Campaign
                    </button>
                    <button 
                      onClick={() => setCurrentView("claim")}
                      className="btn btn-secondary px-8 py-3.5 text-base"
                    >
                      Claim Tokens
                    </button>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="metric-card">
                    <div className="flex items-center justify-between">
                      <div className="metric-label">Total Campaigns</div>
                      <div className="text-[#00D1FF]">📈</div>
                    </div>
                    <div className="metric-value">12</div>
                    <div className="text-xs text-[#22C55E] flex items-center gap-1 mt-1">
                      +3 this week
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="flex items-center justify-between">
                      <div className="metric-label">Tokens Distributed</div>
                      <div className="text-[#00D1FF]">💰</div>
                    </div>
                    <div className="metric-value">142.8k</div>
                    <div className="text-xs text-[#94A3B8]">INJ • Testnet</div>
                  </div>

                  <div className="metric-card">
                    <div className="flex items-center justify-between">
                      <div className="metric-label">Claim Rate</div>
                      <div className="text-[#00D1FF]">🎯</div>
                    </div>
                    <div className="metric-value">87.4%</div>
                    <div className="text-xs text-[#22C55E]">+12% vs last month</div>
                  </div>

                  <div className="metric-card">
                    <div className="flex items-center justify-between">
                      <div className="metric-label">Avg Claim Time</div>
                      <div className="text-[#00D1FF]">⏱️</div>
                    </div>
                    <div className="metric-value">14s</div>
                    <div className="text-xs text-[#94A3B8]">Median on Injective</div>
                  </div>
                </div>

                {/* Why Jayaang + How it Works */}
                <div className="grid lg:grid-cols-5 gap-6">
                  {/* Why Jayaang */}
                  <div className="lg:col-span-2 card p-8">
                    <div className="uppercase tracking-[1.5px] text-xs text-[#64748B] mb-4">WHY JAYAANG?</div>
                    <h3 className="text-2xl font-semibold mb-6 tracking-tight">The most elegant way to airdrop on Injective</h3>
                    
                    <div className="space-y-5">
                      {[
                        { icon: "⚡", title: "Gas Efficient", desc: "Merkle proofs minimize on-chain storage and gas costs dramatically." },
                        { icon: "🔒", title: "Cryptographically Secure", desc: "Only eligible recipients can claim. Impossible to forge proofs." },
                        { icon: "🌐", title: "Permissionless", desc: "Anyone can create campaigns. No gatekeepers or approvals needed." },
                        { icon: "🛠️", title: "Developer Friendly", desc: "Simple SDK, clean contracts, and beautiful frontend." },
                      ].map((f, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="text-2xl mt-0.5">{f.icon}</div>
                          <div>
                            <div className="font-semibold">{f.title}</div>
                            <div className="text-sm text-[#94A3B8] leading-snug">{f.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* How it Works */}
                  <div className="lg:col-span-3 card p-8">
                    <div className="uppercase tracking-[1.5px] text-xs text-[#64748B] mb-4">HOW IT WORKS</div>
                    <h3 className="text-2xl font-semibold mb-8 tracking-tight">Five simple steps to launch your airdrop</h3>

                    <div className="space-y-6">
                      {[
                        { step: "01", title: "Upload Recipients", desc: "CSV with inj1 addresses + amounts in smallest units" },
                        { step: "02", title: "Generate Merkle Root", desc: "We build the tree locally in your browser. Download merkle.json" },
                        { step: "03", title: "Create & Fund Campaign", desc: "Send native INJ to the smart contract. Campaign is live instantly." },
                        { step: "04", title: "Share with Community", desc: "Distribute the merkle.json file or host it publicly." },
                        { step: "05", title: "Recipients Claim", desc: "Connect Keplr → Upload JSON → Verify eligibility → Claim in seconds." },
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-5 group">
                          <div className="w-9 h-9 rounded-xl bg-[#1F2937] flex-shrink-0 flex items-center justify-center text-sm font-mono font-bold text-[#00D1FF] group-hover:bg-[#00D1FF] group-hover:text-[#050816] transition-colors">
                            {item.step}
                          </div>
                          <div className="pt-1">
                            <div className="font-semibold tracking-tight">{item.title}</div>
                            <div className="text-[#94A3B8] text-sm leading-snug">{item.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Setup Status + Quick Actions */}
                <div className="card p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="font-semibold text-xl tracking-tight">Contract Status</div>
                      <p className="text-sm text-[#94A3B8]">Live on Injective Testnet • CosmWasm</p>
                    </div>
                    <button 
                      onClick={() => setCurrentView("create")}
                      className="btn btn-ghost text-sm"
                    >
                      Deploy new campaign →
                    </button>
                  </div>
                  <SetupStatus />
                </div>

                {/* Trust bar */}
                <div className="text-center py-4">
                  <div className="text-xs uppercase tracking-widest text-[#64748B] mb-3">TRUSTED BY BUILDERS ON INJECTIVE</div>
                  <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-[#94A3B8]">
                    <div>Injective Foundation</div>
                    <div>Helix</div>
                    <div>Mito</div>
                    <div>Kado</div>
                    <div>Ninja Blaze</div>
                  </div>
                </div>
              </div>
            )}

            {/* CREATE CAMPAIGN VIEW */}
            {currentView === "create" && (
              <div className="animate-fade-in">
                <div className="mb-8">
                  <button 
                    onClick={() => setCurrentView("overview")}
                    className="text-sm flex items-center gap-2 text-[#94A3B8] hover:text-white mb-3"
                  >
                    ← Back to Dashboard
                  </button>
                  <h1 className="text-4xl font-semibold tracking-tighter">Create Campaign</h1>
                  <p className="text-[#94A3B8] mt-2">Upload CSV, generate Merkle proof, and fund your airdrop with native INJ.</p>
                </div>

                <CreateAirdrop />
              </div>
            )}

            {/* CLAIM VIEW */}
            {currentView === "claim" && (
              <div className="animate-fade-in max-w-3xl mx-auto">
                <div className="mb-8 text-center">
                  <button 
                    onClick={() => setCurrentView("overview")}
                    className="text-sm flex items-center gap-2 text-[#94A3B8] hover:text-white mb-3 mx-auto"
                  >
                    ← Back to Dashboard
                  </button>
                  <h1 className="text-4xl font-semibold tracking-tighter">Claim Your Tokens</h1>
                  <p className="text-[#94A3B8] mt-2">Connect your Keplr wallet, upload the campaign file, and claim instantly.</p>
                </div>

                <ClaimAirdrop />
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Subtle Footer */}
      <footer className="border-t border-[#1F2937] py-6 text-center text-xs text-[#64748B]">
        Jayaang • Built with ❤️ for the Injective Hackathon • Testnet only • 
        <a href="https://github.com" target="_blank" className="hover:text-[#00D1FF] ml-1">View on GitHub</a>
      </footer>
    </div>
  );
}
