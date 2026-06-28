"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUnits } from "viem";
import { hexToBase64 } from "@/lib/bytes";
import { getContractAddress } from "@/lib/config";
import type { CampaignView } from "@/lib/cosmos";
import type { MerkleArtifact } from "@/lib/merkle";
import { fetchMerkleArtifact, getMerkleUrl, normalizeMerkleRoot } from "@/lib/merkle-loader";
import { useWallet } from "@/lib/wallet";

export function ClaimAirdrop() {
  const contract = getContractAddress();
  const { address, isConnected, queryClient, signingClient, refresh } = useWallet();

  const [campaignId, setCampaignId] = useState("4");
  const [merkleArtifact, setMerkleArtifact] = useState<MerkleArtifact | null>(null);
  const [merkleLoading, setMerkleLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [campaignCount, setCampaignCount] = useState(0);
  const [campaign, setCampaign] = useState<CampaignView | null>(null);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [claimAmount, setClaimAmount] = useState("");
  const [txHash, setTxHash] = useState("");

  const merkleUrl = useMemo(() => getMerkleUrl(Number(campaignId || "0")), [campaignId]);

  // Load next campaign id
  useEffect(() => {
    if (!contract || !queryClient) return;
    queryClient
      .queryContractSmart(contract, { next_campaign_id: {} })
      .then((value) => {
        const next = (value as { next_campaign_id: number }).next_campaign_id;
        setCampaignCount(next);
      })
      .catch(() => undefined);
  }, [contract, queryClient]);

  // Load selected campaign
  useEffect(() => {
    if (!contract || !queryClient || !campaignId) return;
    setCampaign(null);
    setAlreadyClaimed(false);
    
    queryClient
      .queryContractSmart(contract, { get_campaign: { campaign_id: Number(campaignId) } })
      .then((data) => {
        const response = data as any;
        setCampaign({
         id: Number(campaignId),
         token: response.token || "",
         is_native: response.is_native ?? true,
         merkleRoot: response.merkle_root,
         deposited: response.deposited,
         claimed: response.claimed,
         expiresAt: response.expires_at,
         name: response.name || `Campaign #${campaignId}`,
         paused: response.paused ?? false,
         });
         })
      .catch(() => setCampaign(null));
  }, [contract, queryClient, campaignId]);

  // Check if already claimed when address + campaign changes
  useEffect(() => {
    if (!contract || !queryClient || !address || !campaignId) return;
    queryClient
      .queryContractSmart(contract, {
        has_claimed: { campaign_id: Number(campaignId), address },
      })
      .then((res: any) => setAlreadyClaimed(!!res))
      .catch(() => setAlreadyClaimed(false));
  }, [contract, queryClient, address, campaignId]);

  async function handleLoadMerkle() {
    setLocalError(null);
    setMerkleLoading(true);
    try {
      const art = await fetchMerkleArtifact(merkleUrl);
      setMerkleArtifact(art);
      setStatus("Merkle file loaded successfully. Checking eligibility...");
    } catch (e) {
      setLocalError("Could not load merkle.json. Make sure the file is hosted or use a public URL.");
    } finally {
      setMerkleLoading(false);
    }
  }

  async function handleClaim() {
    if (!signingClient || !address || !merkleArtifact || !campaignId) return;

    setBusy(true);
    setLocalError(null);
    setStatus(null);

    try {
      const myEntry = merkleArtifact.recipients.find((r) => r.injAddress === address);
      if (!myEntry) {
        throw new Error("Your wallet is not in the recipient list for this campaign.");
      }

      const proof = myEntry.proof.map((p: string) => hexToBase64(p));
      const amount = myEntry.amount;

      const client = await refresh();

      const result = await client.execute(
        address,
        contract!,
        {
          claim: {
            campaign_id: Number(campaignId),
            amount,
            proof,
          },
        },
        "auto"
      );

      setTxHash(result.transactionHash);
      setClaimAmount(myEntry.amountInj);
      setShowSuccess(true);
      setAlreadyClaimed(true);
    } catch (err: any) {
      setLocalError(err.message || "Claim failed. Check eligibility and try again.");
    } finally {
      setBusy(false);
    }
  }

  const isEligible = !!merkleArtifact && !!address && 
    merkleArtifact.recipients.some(r => r.injAddress === address);

  const myClaimAmount = merkleArtifact?.recipients.find(r => r.injAddress === address)?.amountInj;

  return (
    <div className="card p-9">
      {!contract && (
        <div className="text-center py-8 text-[#EF4444]">Contract address missing in environment.</div>
      )}

      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-9">
          <div className="pill pill-primary mx-auto mb-4 w-fit">CLAIM FLOW</div>
          <h2 className="text-3xl font-semibold tracking-tight">Claim Your Airdrop</h2>
          <p className="text-[#94A3B8] mt-2">Upload your campaign file or enter campaign ID</p>
        </div>

        {/* Campaign Selector */}
        <div className="mb-8">
          <label className="label">Campaign ID</label>
          <div className="flex gap-3">
            <input 
              className="input flex-1" 
              value={campaignId} 
              onChange={(e) => setCampaignId(e.target.value)} 
              placeholder="4"
            />
            <div className="px-4 flex items-center text-xs text-[#64748B] bg-[#0B1120] rounded-2xl border border-[#1F2937]">
              {campaignCount > 0 ? `${campaignCount} campaigns live` : "Loading..."}
            </div>
          </div>
        </div>

        {/* Campaign Info */}
        {campaign && (
          <div className="mb-8 p-5 bg-[#0B1120] rounded-3xl border border-[#1F2937]">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-[#64748B]">CAMPAIGN</div>
                <div className="font-semibold text-xl tracking-tight mt-px">{campaign.name}</div>
              </div>
              <div className={`pill ${campaign.paused ? 'pill-danger' : 'pill-success'}`}>
                {campaign.paused ? "PAUSED" : "ACTIVE"}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-6 text-sm">
              <div>
                <div className="text-[#64748B] text-xs">DEPOSITED</div>
                <div className="font-mono font-semibold mt-px">{(Number(campaign.deposited) / 1e18).toFixed(4)} INJ</div>
              </div>
              <div>
                <div className="text-[#64748B] text-xs">CLAIMED</div>
                <div className="font-mono font-semibold mt-px">{(Number(campaign.claimed) / 1e18).toFixed(4)} INJ</div>
              </div>
              <div>
                <div className="text-[#64748B] text-xs">EXPIRES</div>
                <div className="font-mono font-semibold mt-px text-xs">
                  {new Date(campaign.expires_at * 1000).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Merkle Upload */}
        <div className="mb-6">
          <label className="label">Upload merkle.json (or use hosted file)</label>
          
          <div 
            className="dropzone py-9"
            onClick={() => document.getElementById('merkle-upload')?.click()}
          >
            <input 
              id="merkle-upload" 
              type="file" 
              accept=".json" 
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                try {
                  const parsed = JSON.parse(text);
                  setMerkleArtifact(parsed);
                  setStatus("Local merkle file loaded. Checking your eligibility...");
                } catch {
                  setLocalError("Invalid JSON file");
                }
              }}
            />
            
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-[#1F2937] flex items-center justify-center mb-4">
                📁
              </div>
              <div className="font-semibold">Drop your merkle.json here</div>
              <div className="text-xs text-[#64748B] mt-1">or click to browse • contains proof for your address</div>
            </div>
          </div>

          <button 
            onClick={handleLoadMerkle} 
            disabled={merkleLoading}
            className="btn btn-ghost w-full mt-3 text-sm"
          >
            {merkleLoading ? "Loading from server..." : `Or load from hosted URL (campaign #${campaignId})`}
          </button>
        </div>

        {/* Eligibility Status */}
        {merkleArtifact && address && (
          <div className={`mb-8 p-5 rounded-3xl border ${isEligible ? "border-[#22C55E] bg-[#22C55E]/5" : "border-[#EF4444] bg-[#EF4444]/5"}`}>
            <div className="flex items-center gap-3">
              <div className={`text-2xl ${isEligible ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                {isEligible ? "✅" : "❌"}
              </div>
              <div>
                <div className="font-semibold">
                  {isEligible ? "You are eligible to claim!" : "Wallet not found in this campaign"}
                </div>
                {isEligible && myClaimAmount && (
                  <div className="text-3xl font-semibold tracking-tighter text-[#22C55E] mt-1">
                    {myClaimAmount} INJ
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Claim Button */}
        <button
          onClick={handleClaim}
          disabled={!isConnected || !merkleArtifact || !isEligible || alreadyClaimed || busy}
          className="btn btn-success w-full py-4 text-lg font-semibold disabled:bg-[#1F2937] disabled:text-[#64748B]"
        >
          {!isConnected 
            ? "Connect Keplr to Claim" 
            : alreadyClaimed 
              ? "Already Claimed ✓" 
              : busy 
                ? "Claiming..." 
                : isEligible 
                  ? `Claim ${myClaimAmount || ""} INJ` 
                  : "Not Eligible"}
        </button>

        {/* Messages */}
        {localError && <div className="mt-4 p-4 text-sm rounded-2xl bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20">{localError}</div>}
        {status && <div className="mt-4 p-4 text-sm rounded-2xl bg-[#00D1FF]/10 text-[#00D1FF] border border-[#00D1FF]/20">{status}</div>}

        {!isConnected && (
          <p className="text-center text-xs text-[#64748B] mt-6">Connect your Keplr wallet on Injective testnet to continue</p>
        )}
      </div>

      {/* Success Modal with Confetti */}
      {showSuccess && (
        <div className="modal-overlay" onClick={() => setShowSuccess(false)}>
          <div className="modal p-10 text-center relative overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Confetti particles */}
            {Array.from({ length: 18 }).map((_, i) => (
              <div 
                key={i}
                className="confetti absolute"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-10px`,
                  background: i % 3 === 0 ? '#00D1FF' : i % 2 === 0 ? '#7C3AED' : '#22C55E',
                  animationDelay: `${Math.random() * 0.6}s`,
                  transform: `rotate(${Math.random() * 40 - 20}deg)`
                }}
              />
            ))}

            <div className="success-check mx-auto mb-7">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>

            <h3 className="text-4xl font-semibold tracking-[-1.5px] mb-2">Claim Successful!</h3>
            <p className="text-[#94A3B8] mb-8">Tokens have been sent to your wallet.</p>

            <div className="bg-[#050816] rounded-3xl p-6 mb-8 text-left">
              <div className="text-xs text-[#64748B]">AMOUNT RECEIVED</div>
              <div className="text-4xl font-semibold tracking-tighter text-[#22C55E] mt-1">{claimAmount} INJ</div>
              <div className="text-xs text-[#64748B] mt-4">TX HASH</div>
              <div className="font-mono text-xs text-[#00D1FF] break-all mt-px">{txHash}</div>
            </div>

            <div className="flex gap-3">
              <a 
                href={`https://testnet.blockscout.injective.network/tx/${txHash}`} 
                target="_blank" 
                className="btn btn-secondary flex-1"
              >
                View on Explorer
              </a>
              <button onClick={() => setShowSuccess(false)} className="btn btn-primary flex-1">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
