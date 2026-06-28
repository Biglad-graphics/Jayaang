"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUnits } from "viem";
import { hexToBase64 } from "@/lib/bytes";
import { getContractAddress } from "@/lib/config";
import type { CampaignView } from "@/lib/cosmos";
import type { MerkleArtifact } from "@/lib/merkle";
import { fetchMerkleArtifact, getMerkleUrl, normalizeMerkleRoot } from "@/lib/merkle-loader";
import { useWallet } from "@/lib/wallet";
import {
  Search, CheckCircle2, AlertCircle, Loader2, ExternalLink,
  Gift, Clock, Coins, Users, FileSearch, XCircle
} from "lucide-react";

export function ClaimAirdrop() {
  const contract = getContractAddress();
  const { address, isConnected, queryClient, refresh } = useWallet();

  const [campaignId, setCampaignId] = useState("4");
  const [merkleArtifact, setMerkleArtifact] = useState<MerkleArtifact | null>(null);
  const [merkleLoading, setMerkleLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [campaignCount, setCampaignCount] = useState(0);
  const [campaign, setCampaign] = useState<CampaignView | null>(null);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const merkleUrl = useMemo(() => getMerkleUrl(Number(campaignId || "0")), [campaignId]);

  useEffect(() => {
    if (!contract || !queryClient) return;
    queryClient.queryContractSmart(contract, { next_campaign_id: {} })
      .then((v) => setCampaignCount((v as { next_campaign_id: number }).next_campaign_id))
      .catch(() => undefined);
  }, [contract, queryClient]);

  useEffect(() => {
    if (!contract || !queryClient) return;
    queryClient.queryContractSmart(contract, { get_campaign: { campaign_id: Number(campaignId || "0") } })
      .then((data) => {
        const r = data as { merkle_root: string; deposited: string; claimed: string; expires_at: number; name: string; paused: boolean; token?: string; is_native?: boolean };
        if (!r.deposited || r.deposited === "0") { setCampaign(null); return; }
        setCampaign({ id: Number(campaignId), merkleRoot: r.merkle_root, deposited: r.deposited, claimed: r.claimed, expiresAt: r.expires_at, name: r.name, paused: r.paused, token: r.token ?? "inj", is_native: r.is_native ?? true });
      })
      .catch(() => setCampaign(null));
  }, [contract, campaignId, queryClient]);

  useEffect(() => {
    let cancelled = false;
    setMerkleArtifact(null);
    setMerkleLoading(true);
    setLocalError(null);
    fetchMerkleArtifact(Number(campaignId || "0"))
      .then((artifact) => { if (!cancelled) setMerkleArtifact(artifact); })
      .catch((err) => { if (!cancelled) setLocalError(err instanceof Error ? err.message : "Could not load merkle proofs"); })
      .finally(() => { if (!cancelled) setMerkleLoading(false); });
    return () => { cancelled = true; };
  }, [campaignId]);

  useEffect(() => {
    if (!contract || !address || !queryClient) { setAlreadyClaimed(false); return; }
    queryClient.queryContractSmart(contract, { has_claimed: { campaign_id: Number(campaignId || "0"), address } })
      .then((v) => setAlreadyClaimed(Boolean((v as { claimed: boolean }).claimed)))
      .catch(() => setAlreadyClaimed(false));
  }, [contract, campaignId, address, queryClient]);

  const merkleRootMismatch = useMemo(() => {
    if (!campaign || !merkleArtifact) return false;
    return normalizeMerkleRoot(campaign.merkleRoot) !== normalizeMerkleRoot(merkleArtifact.root);
  }, [campaign, merkleArtifact]);

  const eligibility = useMemo(() => {
    if (!address || !merkleArtifact || merkleRootMismatch) return null;
    return merkleArtifact.proofs[address.toLowerCase()] ?? null;
  }, [address, merkleArtifact, merkleRootMismatch]);

  const amountDisplay = useMemo(() => {
    if (!eligibility) return null;
    if (eligibility.amountInj) return `${eligibility.amountInj} INJ`;
    return `${formatUnits(BigInt(eligibility.amount), 18)} INJ`;
  }, [eligibility]);

  async function syncClaimStatus(): Promise<boolean> {
    if (!contract || !address || !queryClient) return false;
    const v = await queryClient.queryContractSmart(contract, { has_claimed: { campaign_id: Number(campaignId || "0"), address } });
    const claimed = Boolean((v as { claimed: boolean }).claimed);
    setAlreadyClaimed(claimed);
    return claimed;
  }

  async function handleClaim() {
    if (!contract || !eligibility || !address) return;
    if (alreadyClaimed) { setStatus("You already claimed this campaign."); return; }
    setBusy(true);
    setLocalError(null);
    setStatus(null);
    try {
      const client = await refresh();
      const result = await client.execute(
        address, contract,
        { claim: { campaign_id: Number(campaignId), amount: eligibility.amount, proof: eligibility.proof.map((step) => hexToBase64(step)) } },
        "auto",
      );
      setAlreadyClaimed(true);
      setTxHash(result.transactionHash);
      setStatus(`Claim successful!`);
      setShowSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/already claimed/i.test(message)) {
        setAlreadyClaimed(true);
        setStatus("You already claimed this campaign.");
        return;
      }
      try { if (await syncClaimStatus()) { setStatus("Claim successful!"); setShowSuccess(true); return; } }
      catch { /* fall through */ }
      setLocalError(message);
    } finally {
      setBusy(false);
    }
  }

  if (!contract) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>Claim Tokens</h1>
        </div>
        <div className="alert alert-warning">
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          Set <code>NEXT_PUBLIC_AIRDROP_CONTRACT</code> in <code>web/.env.local</code> and restart.
        </div>
      </div>
    );
  }

  if (showSuccess && txHash) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>Claim Tokens</h1>
        </div>
        <div style={{ background: "var(--card)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "var(--radius)", padding: 40, textAlign: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", margin: "0 auto 20px", background: "var(--success-dim)", border: "2px solid rgba(34,197,94,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 size={40} color="var(--success)" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }}>Claim Successful!</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 24 }}>
            You have successfully claimed <strong style={{ color: "var(--success)" }}>{amountDisplay}</strong> to your wallet.
          </p>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "14px 20px", marginBottom: 24, textAlign: "left" }}>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Transaction Hash</div>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: "var(--primary)", wordBreak: "break-all" }}>{txHash}</div>
          </div>
          <a
            href={`https://testnet.explorer.injective.network/transaction/${txHash}`}
            target="_blank" rel="noreferrer"
            className="btn btn-secondary"
            style={{ display: "inline-flex", gap: 8 }}
          >
            <ExternalLink size={14} />
            View on Explorer
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>Claim Tokens</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Connect Keplr, select a campaign, and claim your native INJ allocation.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Campaign selector */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div className="icon-box icon-box-primary"><Search size={16} /></div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Select Campaign</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{campaignCount} campaign{campaignCount !== 1 ? "s" : ""} on-chain</div>
              </div>
            </div>

            <label className="field-label">Campaign ID</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                className="input-field"
                value={campaignId}
                onChange={e => { setCampaignId(e.target.value); setShowSuccess(false); }}
                style={{ maxWidth: 120 }}
              />
              {Array.from({ length: Math.min(campaignCount, 6) }, (_, i) => i).map(i => (
                <button
                  key={i}
                  onClick={() => { setCampaignId(String(i)); setShowSuccess(false); }}
                  className={`btn btn-${campaignId === String(i) ? "primary" : "secondary"} btn-sm`}
                >
                  #{i}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              Proofs: <a href={merkleUrl} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontFamily: "monospace" }}>{merkleUrl.split("/").pop()}</a>
            </p>
          </div>

          {/* Campaign info */}
          {campaign && (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="icon-box icon-box-accent"><Coins size={16} /></div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{campaign.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Campaign #{campaign.id}</div>
                  </div>
                </div>
                <span className="badge badge-active">Active</span>
              </div>

              <div className="grid-2" style={{ gap: 12 }}>
                {[
                  { label: "Deposited", value: `${formatUnits(BigInt(campaign.deposited), 18)} INJ`, icon: <Coins size={14} /> },
                  { label: "Claimed", value: `${formatUnits(BigInt(campaign.claimed || "0"), 18)} INJ`, icon: <CheckCircle2 size={14} /> },
                  { label: "Expires", value: new Date(campaign.expiresAt * 1000).toLocaleDateString(), icon: <Clock size={14} /> },
                  { label: "Status", value: campaign.paused ? "Paused" : "Active", icon: <Users size={14} /> },
                ].map(item => (
                  <div key={item.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-tertiary)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {item.icon}
                      {item.label}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {merkleLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
              <Loader2 size={16} color="var(--text-secondary)" style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Checking eligibility…</span>
            </div>
          )}

          {merkleRootMismatch && (
            <div className="alert alert-danger">
              <XCircle size={16} style={{ flexShrink: 0 }} />
              Merkle file does not match this campaign&apos;s on-chain root. Contact the campaign organizer.
            </div>
          )}

          {alreadyClaimed && (
            <div className="alert alert-info">
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <div>
                <strong>Already claimed</strong> — You received {amountDisplay} from campaign #{campaignId}.
                Try a different campaign ID to claim again.
              </div>
            </div>
          )}

          {eligibility && !alreadyClaimed && !merkleRootMismatch && (
            <div style={{ background: "var(--card)", border: "1px solid rgba(34,197,94,0.35)", borderRadius: "var(--radius)", padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--success-dim)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 size={16} color="var(--success)" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--success)" }}>Wallet Eligible</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>You are eligible for this airdrop</div>
                </div>
              </div>

              <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 10, padding: "16px 20px", marginBottom: 20, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Your Allocation</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "var(--success)", letterSpacing: "-0.02em" }}>{amountDisplay}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, fontFamily: "monospace" }}>
                  → {eligibility.injAddress?.slice(0, 20)}…
                </div>
              </div>

              {localError && <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />{localError}
              </div>}

              <button
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "14px" }}
                disabled={!isConnected || busy}
                onClick={handleClaim}
              >
                {busy
                  ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Claiming…</>
                  : <><Gift size={15} /> Claim {amountDisplay}</>
                }
              </button>
            </div>
          )}

          {!merkleLoading && !merkleRootMismatch && !eligibility && !alreadyClaimed && merkleArtifact && (
            <div className="alert alert-warning">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {!isConnected
                ? "Connect your Keplr wallet to check eligibility for this campaign."
                : "Your connected address is not eligible for this campaign. Try a different campaign ID."}
            </div>
          )}

          {status && !showSuccess && (
            <div className="alert alert-success">
              <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
              {status}
            </div>
          )}
          {localError && !eligibility && (
            <div className="alert alert-danger">
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              {localError}
            </div>
          )}
        </div>

        {/* RIGHT: How to claim */}
        <div style={{ position: "sticky", top: 80 }}>
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <FileSearch size={16} color="var(--text-secondary)" />
              <div style={{ fontSize: 14, fontWeight: 700 }}>How to Claim</div>
            </div>
            {[
              { n: 1, title: "Connect Keplr", desc: "Connect your Keplr wallet on injective-888 testnet." },
              { n: 2, title: "Select Campaign", desc: "Enter the campaign ID shared by the airdrop organizer." },
              { n: 3, title: "Check Eligibility", desc: "We automatically verify if your address is in the Merkle tree." },
              { n: 4, title: "Claim", desc: "Submit your proof on-chain and receive native INJ instantly." },
            ].map(step => (
              <div key={step.n} style={{ display: "flex", gap: 12, marginBottom: step.n < 4 ? 16 : 0 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--primary-dim)", border: "1px solid rgba(0,209,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "var(--primary)", flexShrink: 0, marginTop: 1 }}>
                  {step.n}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{step.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
