"use client";

import { useState } from "react";
import { INJECTIVE_TESTNET } from "@/lib/cosmos";
import { useWallet } from "@/lib/wallet";

export function WalletButton() {
  const { address, isConnected, isConnecting, chainId, connect, disconnect } = useWallet();
  const [error, setError] = useState<string | null>(null);

  const shortAddress = address ? `${address.slice(0, 8)}...${address.slice(-6)}` : "";

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#0B1120] border border-[#1F2937]">
          <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
          <span className="text-xs text-[#94A3B8] font-mono">{shortAddress}</span>
        </div>
        
        <button 
          onClick={disconnect}
          className="btn btn-ghost text-sm px-5 py-2"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        className="btn btn-primary px-6 py-2.5 text-sm font-semibold"
        disabled={isConnecting}
        onClick={async () => {
          setError(null);
          try {
            await connect();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to connect wallet");
          }
        }}
      >
        {isConnecting ? (
          <>Connecting to Keplr...</>
        ) : (
          <>Connect Keplr Wallet</>
        )}
      </button>
      {error && (
        <div className="mt-2 text-xs text-[#EF4444] bg-[#EF4444]/10 px-3 py-1.5 rounded-lg border border-[#EF4444]/30">
          {error}
        </div>
      )}
    </div>
  );
}
