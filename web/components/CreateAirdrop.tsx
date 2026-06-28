"use client";

import { useMemo, useState } from "react";
import { getContractAddress } from "@/lib/config";
import { INJECTIVE_TESTNET } from "@/lib/cosmos";
import { hexToBase64 } from "@/lib/bytes";
import { buildMerkleArtifact, downloadJson, parseCsv, type MerkleArtifact } from "@/lib/merkle";
import { useWallet } from "@/lib/wallet";

const EXAMPLE_CSV = `address,amount
inj14rvcf3g0j8vfylws83wgnwzd2nnr4qd7nj04nt,0.004
inj1q2k5v3x4w5e6r7t8y9u0i1o2p3a4s5d6f7g8h9,0.012`;

export function CreateAirdrop() {
  const contract = getContractAddress();
  const { isConnected, address, refresh } = useWallet();

  const [csv, setCsv] = useState(EXAMPLE_CSV);
  const [campaignName, setCampaignName] = useState("Community Airdrop • June 2026");
  const [expiryDays, setExpiryDays] = useState(30);
  const [artifact, setArtifact] = useState<MerkleArtifact | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [txHash, setTxHash] = useState("");

  const totalDisplay = useMemo(() => {
    if (!artifact) return "0 INJ";
    return `${artifact.totalAmountInj} INJ`;
  }, [artifact]);

  function handleGenerate() {
    setLocalError(null);
    setStatus(null);
    try {
      const rows = parseCsv(csv);
      const next = buildMerkleArtifact(rows);
      setArtifact(next);
      downloadJson(`merkle-${Date.now()}.json`, next);
      setStatus("✅ Merkle tree generated & downloaded. Share the JSON with recipients.");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Failed to build Merkle tree");
    }
  }

  async function handleCreateCampaign() {
    if (!contract || !artifact || !address) return;
    setBusy(true);
    setLocalError(null);
    setStatus(null);
    try {
      const client = await refresh();
      const expiresAt = Math.floor(Date.now() / 1000) + expiryDays * 24 * 60 * 60;

      const result = await client.execute(
        address,
        contract,
        {
          create_campaign: {
            merkle_root: hexToBase64(artifact.root),
            expires_at: expiresAt,
            name: campaignName,
          },
        },
        "auto",
        undefined,
        [{ denom: INJECTIVE_TESTNET.coinMinimalDenom, amount: artifact.totalAmount }],
      );

      setTxHash(result.transactionHash);
      setShowSuccess(true);
      setStatus(`Campaign created successfully! Transaction: ${result.transactionHash.slice(0, 12)}...`);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Create campaign failed");
    } finally {
      setBusy(false);
    }
  }

  if (!contract) {
    return (
      <div className="card p-10 text-center max-w-lg mx-auto">
        <div className="text-5xl mb-6 opacity-70">🚀</div>
        <h2 className="text-2xl font-semibold mb-3">Contract not configured</h2>
        <p className="text-[#94A3B8] mb-6">
          Deploy the CosmWasm contract first, then add the address to <code className="text-xs bg-[#1F2937] px-1.5 py-0.5 rounded">web/.env.local</code>
        </p>
        <div className="text-left text-sm bg-[#0B1120] p-5 rounded-xl font-mono text-[#64748B]">
          npm run deploy:cosmwasm
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* LEFT: FORM */}
      <div className="card p-8">
        <div className="mb-8">
          <div className="pill pill-accent mb-3 w-fit">STEP 1 • CREATE</div>
          <h2 className="text-3xl font-semibold tracking-tight">Campaign Details</h2>
          <p className="text-[#94A3B8] mt-2">All data stays in your browser until you sign the transaction.</p>
        </div>

        <div className="space-y-6">
          {/* Campaign Name */}
          <div>
            <label className="label">Campaign Name</label>
            <input 
              className="input" 
              value={campaignName} 
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="My Community Drop"
            />
          </div>

          {/* Expiry */}
          <div>
            <label className="label">Expires in (days)</label>
            <div className="flex gap-3">
              <input
                className="input flex-1"
                type="number"
                min={1}
                max={365}
                value={expiryDays}
                onChange={(e) => setExpiryDays(Math.max(1, Number(e.target.value)))}
              />
              <div className="px-5 flex items-center text-sm text-[#94A3B8] bg-[#0B1120] rounded-xl border border-[#1F2937]">
                {expiryDays} days from now
              </div>
            </div>
          </div>

          {/* CSV Upload Area */}
          <div>
            <label className="label flex items-center justify-between">
              Recipients (CSV)
              <button 
                onClick={() => setCsv(EXAMPLE_CSV)} 
                className="text-xs text-[#00D1FF] hover:underline"
              >
                Load example
              </button>
            </label>
            
            <div className="dropzone mb-3" onClick={() => document.getElementById('csv-input')?.click()}>
              <input 
                id="csv-input" 
                type="file" 
                accept=".csv" 
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setCsv(ev.target?.result as string);
                    reader.readAsText(file);
                  }
                }}
              />
              <div className="text-center">
                <div className="text-3xl mb-3">📄</div>
                <div className="font-semibold">Drop CSV here or click to upload</div>
                <div className="text-xs text-[#64748B] mt-1">address,amount format • inj1... addresses</div>
              </div>
            </div>

            <textarea 
              className="textarea font-mono text-sm" 
              value={csv} 
              onChange={(e) => setCsv(e.target.value)}
              placeholder="inj1...,0.1&#10;inj1...,0.25"
            />
            <p className="text-xs text-[#64748B] mt-2">
              Amounts are in plain INJ (e.g. 0.1 = 100000 inj in smallest units internally)
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button 
              onClick={handleGenerate} 
              className="btn btn-secondary flex-1 py-3.5"
            >
              Generate Merkle Tree & Download JSON
            </button>
            
            <button
              onClick={handleCreateCampaign}
              disabled={!artifact || !isConnected || busy}
              className="btn btn-primary flex-1 py-3.5 disabled:opacity-60"
            >
              {busy ? "Creating Campaign..." : "Create & Fund Campaign"}
            </button>
          </div>

          {localError && (
            <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-sm text-[#EF4444]">
              {localError}
            </div>
          )}
          {status && !showSuccess && (
            <div className="p-4 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 text-sm text-[#22C55E]">
              {status}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: LIVE PREVIEW */}
      <div className="space-y-6">
        <div className="preview-card">
          <div className="uppercase text-xs tracking-widest text-[#64748B] mb-4">LIVE PREVIEW</div>
          
          {!artifact ? (
            <div className="py-12 text-center">
              <div className="text-6xl mb-4 opacity-40">🌳</div>
              <div className="font-medium text-lg">Generate Merkle tree to see preview</div>
              <p className="text-sm text-[#64748B] mt-2 max-w-[260px] mx-auto">
                Your campaign summary and Merkle root will appear here instantly.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <div className="text-xs text-[#94A3B8]">CAMPAIGN NAME</div>
                <div className="font-semibold text-xl tracking-tight mt-1">{campaignName}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0B1120] rounded-2xl p-4">
                  <div className="text-xs text-[#94A3B8]">RECIPIENTS</div>
                  <div className="text-3xl font-semibold mt-1 tracking-tighter">{artifact.recipientCount}</div>
                </div>
                <div className="bg-[#0B1120] rounded-2xl p-4">
                  <div className="text-xs text-[#94A3B8]">TOTAL DEPOSIT</div>
                  <div className="text-3xl font-semibold mt-1 tracking-tighter text-[#00D1FF]">{totalDisplay}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-[#94A3B8] mb-1.5">MERKLE ROOT</div>
                <div className="font-mono text-xs bg-[#050816] p-4 rounded-2xl break-all border border-[#1F2937]">
                  {artifact.root}
                </div>
              </div>

              <div>
                <div className="text-xs text-[#94A3B8] mb-2">FIRST 3 RECIPIENTS</div>
                <div className="space-y-2 text-sm font-mono">
                  {artifact.recipients.slice(0, 3).map((r, i) => (
                    <div key={i} className="flex justify-between bg-[#0B1120] px-4 py-2.5 rounded-2xl text-xs">
                      <span className="text-[#94A3B8]">{r.injAddress.slice(0, 12)}...</span>
                      <span className="font-semibold text-white">{r.amountInj} INJ</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="card p-6 text-sm">
          <div className="font-semibold mb-3 flex items-center gap-2">🔐 What happens next?</div>
          <ul className="space-y-2 text-[#94A3B8] text-sm">
            <li>• Merkle tree is generated 100% client-side</li>
            <li>• You sign one transaction to create + fund the campaign</li>
            <li>• Recipients use the downloaded JSON to claim</li>
            <li>• Campaign expires automatically after the selected period</li>
          </ul>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="modal-overlay" onClick={() => setShowSuccess(false)}>
          <div className="modal p-9 text-center" onClick={e => e.stopPropagation()}>
            <div className="success-check mx-auto mb-6">
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            
            <h3 className="text-3xl font-semibold tracking-tight mb-2">Campaign Created!</h3>
            <p className="text-[#94A3B8] mb-8">Your airdrop is now live on Injective Testnet.</p>

            <div className="bg-[#0B1120] rounded-2xl p-5 mb-8 text-left">
              <div className="text-xs text-[#64748B] mb-1">TRANSACTION HASH</div>
              <div className="font-mono text-sm break-all text-[#00D1FF]">{txHash}</div>
            </div>

            <div className="flex gap-3">
              <a 
                href={`https://testnet.blockscout.injective.network/tx/${txHash}`} 
                target="_blank"
                className="btn btn-secondary flex-1"
              >
                View on Explorer
              </a>
              <button 
                onClick={() => {
                  setShowSuccess(false);
                  setArtifact(null);
                  setStatus(null);
                }} 
                className="btn btn-primary flex-1"
              >
                Create Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
