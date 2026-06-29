"use client";

import { useState } from "react";
import { useWallet } from "@/lib/wallet";

const KeplrIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#1A1A2E"/>
    <path d="M10 8h4v7l6-7h5L17 17l9 7h-5.5l-6.5-6v6H10V8z" fill="url(#kg)"/>
    <defs>
      <linearGradient id="kg" x1="10" y1="8" x2="26" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7C4DFF"/>
        <stop offset="1" stopColor="#00B0FF"/>
      </linearGradient>
    </defs>
  </svg>
);

export function WalletButton() {
  const { address, isConnected, isConnecting, connect, disconnect } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const short = address ? `${address.slice(0, 8)}...${address.slice(-6)}` : "";

  async function handleConnect() {
    setError(null);
    try {
      await connect();
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  }

  if (isConnected && address) {
    return (
      <div className="wallet-connected">
        <div className="wallet-connected-dot" />
        <span className="wallet-connected-addr">{short}</span>
        <button onClick={disconnect} className="wallet-disconnect">Disconnect</button>
      </div>
    );
  }

  return (
    <>
      <button className="wallet-connect-btn" onClick={() => setShowModal(true)}>
        Connect Wallet
      </button>

      {showModal && (
        <div className="wmodal-overlay" onClick={() => setShowModal(false)}>
          <div className="wmodal" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="wmodal-header">
              <div className="wmodal-logo">
                <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
                  <path d="M24 4L40 14V34L24 44L8 34V14L24 4Z" stroke="white" strokeWidth="1.5" fill="none" opacity="0.9"/>
                  <circle cx="24" cy="24" r="5" fill="white" opacity="0.95"/>
                </svg>
                <span className="wmodal-brand">JAYAANG</span>
              </div>
              <button className="wmodal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="wmodal-title">Log in or sign up</div>

            {/* Wallet option */}
            <div className="wmodal-wallets">
              <button
                className="wmodal-wallet-row"
                disabled={isConnecting}
                onClick={handleConnect}
              >
                <KeplrIcon />
                <span className="wmodal-wallet-name">
                  {isConnecting ? "Connecting…" : "Keplr"}
                </span>
                <span className="wmodal-wallet-arrow">›</span>
              </button>
            </div>

            {error && (
              <div className="wmodal-error">{error}</div>
            )}

            <div className="wmodal-footer">
              Make sure Keplr is installed and set to <strong>injective-888</strong>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
