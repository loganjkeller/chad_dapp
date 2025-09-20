// src/PresalePanel.jsx
import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { bsc } from "wagmi/chains";
import { parseEther } from "viem";
import { PRESALE_ABI } from "./presaleAbi";
import { CONTRACTS, USD_GOAL } from "./constants";
// import StakingPanel from "./StakingPanel";

function fmt(n, d = 4) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: d });
}

function openWallet() {
  const el = document.querySelector("w3m-button");
  if (el) { el.click(); return; }
  if (window?.ethereum?.request) {
    window.ethereum.request({ method: "eth_requestAccounts" }).catch(() => {});
  }
}

function resetWalletCacheAndOpen() {
  try {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('wagmi') || k.startsWith('wc:') || k.startsWith('walletconnect')) {
        localStorage.removeItem(k);
      }
    });
  } catch {}
  document.querySelector('w3m-button')?.click();
}

function Countdown({ label, target }) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  if (!target || now >= target) return <div>{label}: <b>0d 0h 0m 0s</b></div>;
  const diff = target - now;
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return <div>{label}: <b>{d}d {h}h {m}m {s}s</b></div>;
}

/** CoinGecko BNB/USD (client-side fallback) */
function useBnbUsd() {
  const [bnbUsd, setBnbUsd] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        setErr("");
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd",
          { cache: "no-store" }
        );
        const j = await res.json();
        const v = j?.binancecoin?.usd;
        if (!stop) setBnbUsd(typeof v === "number" ? v : null);
      } catch {
        if (!stop) setErr("Failed to load BNB/USD from CoinGecko");
      }
    }
    load();
    const t = setInterval(load, 60_000);
    return () => { stop = true; clearInterval(t); };
  }, []);
  return { bnbUsd, err };
}

export default function PresalePanel() {
  const { address } = useAccount();
  const myAddr = address ?? "0x0000000000000000000000000000000000000000";

  // ---- On-chain reads ----
  const { data: P } = useReadContract({
    address: CONTRACTS.presale,
    abi: PRESALE_ABI,
    functionName: "P",
    chainId: bsc.id,
    query: { refetchInterval: 15000 },
  });

  const { data: chadPerBnbRaw } = useReadContract({
    address: CONTRACTS.presale,
    abi: PRESALE_ABI,
    functionName: "currentRate",
    chainId: bsc.id,
    query: { refetchInterval: 15000 },
  });

  const { data: usdPerChad18 } = useReadContract({
    address: CONTRACTS.presale,
    abi: PRESALE_ABI,
    functionName: "currentUsdPerCHAD",
    chainId: bsc.id,
    query: { refetchInterval: 15000 },
  });

  const { data: usdRaised18 } = useReadContract({
    address: CONTRACTS.presale,
    abi: PRESALE_ABI,
    functionName: "usdRaised",
    chainId: bsc.id,
    query: { refetchInterval: 15000 },
  });

  const { data: totalRaisedWei } = useReadContract({
    address: CONTRACTS.presale,
    abi: PRESALE_ABI,
    functionName: "totalRaised",
    chainId: bsc.id,
    query: { refetchInterval: 15000 },
  });

  const { data: myContribRaw } = useReadContract({
    address: CONTRACTS.presale,
    abi: PRESALE_ABI,
    functionName: "contributed",
    args: [myAddr],
    chainId: bsc.id,
    query: { refetchInterval: 15000 },
  });

  const { data: myPurchasedRaw } = useReadContract({
    address: CONTRACTS.presale,
    abi: PRESALE_ABI,
    functionName: "purchased",
    args: [myAddr],
    chainId: bsc.id,
    query: { refetchInterval: 15000 },
  });

  const { data: isFinalized } = useReadContract({
    address: CONTRACTS.presale,
    abi: PRESALE_ABI,
    functionName: "finalized",
    chainId: bsc.id,
    query: { refetchInterval: 15000 },
  });

  const { data: isCanceled } = useReadContract({
    address: CONTRACTS.presale,
    abi: PRESALE_ABI,
    functionName: "canceled",
    chainId: bsc.id,
    query: { refetchInterval: 15000 },
  });

  // ---- Live BNB/USD (fallback) ----
  const { bnbUsd } = useBnbUsd();

// ---- Numbers (single source of truth) ----
  const start = P ? Number((P.start ?? P[0])) : undefined;
  const end   = P ? Number((P.end   ?? P[1])) : undefined;

  // On-chain dynamic values
  const chadPerBNB       = chadPerBnbRaw != null ? Number(chadPerBnbRaw) / 1e18 : null; // CHAD / 1 BNB
  const priceUsdOnchain  = usdPerChad18 != null ? Number(usdPerChad18) / 1e18 : null;   // USD / CHAD
  const raisedBNB        = totalRaisedWei != null ? Number(totalRaisedWei) / 1e18 : null;
  const raisedUSDOnchain = usdRaised18 != null ? Number(usdRaised18) / 1e18 : null;

  // Preferred values used by UI
  const priceUsd  = priceUsdOnchain ?? ((bnbUsd != null && chadPerBNB) ? (bnbUsd / chadPerBNB) : null);
  const raisedUSD = raisedUSDOnchain ?? ((raisedBNB != null && bnbUsd != null) ? (raisedBNB * bnbUsd) : null);

  const minBuy  = P ? Number(P.minBuy) / 1e18 : 0;
  const maxBuy  = P ? Number(P.maxBuy) / 1e18 : 0;

  const myContrib   = myContribRaw   ? Number(myContribRaw)   / 1e18 : 0;
  const myPurchased = myPurchasedRaw ? Number(myPurchasedRaw) / 1e18 : 0;

  // ⛓ Use chain time; fall back to device time
  const publicClient = usePublicClient({ chainId: bsc.id });
  const [chainNow, setChainNow] = useState(null);
  useEffect(() => {
    let t;
    async function tick() {
      try {
        const block = await publicClient.getBlock();
        setChainNow(Number(block.timestamp));
      } catch {}
    }
    tick();
    t = setInterval(tick, 15000);
    return () => clearInterval(t);
  }, [publicClient]);

  const now = chainNow ?? Math.floor(Date.now() / 1000);

  // Tri-state flags (null while loading)
  const hasStarted = (start !== undefined) ? (now >= start) : null;
  const hasEnded   = (end   !== undefined) ? (now >  end)   : null;

  // Next price bump (24h cadence from start)
  const nextBumpTarget =
    hasStarted ? (start + (Math.floor((now - start) / 86400) + 1) * 86400) : null;

  const goalHit    = raisedUSD !== null ? raisedUSD >= USD_GOAL : false;
  const claimsOpen = hasEnded || goalHit; // if you rely only on goal, use: const claimsOpen = goalHit || Boolean(isFinalized);

  // ---- Write actions ----
  const [bnbInput, setBnbInput] = useState("");
  const [uiError, setUiError]   = useState("");

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: txLoading, isSuccess: txSuccess } =
    useWaitForTransactionReceipt({ hash: txHash });

  const buyDisabledReason = useMemo(() => {
    if (!bnbInput) return "Enter BNB amount";
    if (hasStarted === false) return "Presale not started";
    if (goalHit) return "Goal reached";
    if (hasEnded === true) return "Presale ended";
    if (minBuy && Number(bnbInput) < minBuy) return `Min buy ${fmt(minBuy)} BNB`;
    if (maxBuy && myContrib + Number(bnbInput) > maxBuy) return `Max per wallet ${fmt(maxBuy)} BNB`;
    return "";
  }, [bnbInput, hasStarted, hasEnded, goalHit, minBuy, maxBuy, myContrib]);

  async function onBuy() {
    setUiError("");
    try {
      const wei = parseEther(bnbInput || "0");
      await writeContract({
        address: CONTRACTS.presale,
        abi: PRESALE_ABI,
        functionName: "buy",
        value: wei,
        chainId: bsc.id,
      });
      setBnbInput("");
    } catch (e) {
      setUiError(e?.shortMessage || e?.message || "Transaction failed");
    }
  }

  const canClaim = Boolean(isFinalized && !isCanceled && myPurchased > 0);

  async function onClaim() {
    if (!canClaim) return;
    setUiError("");
    try {
      await writeContract({
        address: CONTRACTS.presale,
        abi: PRESALE_ABI,
        functionName: "claim",
        chainId: bsc.id,
      });
    } catch (e) {
      setUiError(e?.shortMessage || e?.message || "Claim failed");
    }
  }

  // ---- UI ----
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="row" style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>CHAD Presale</h2>

        {/* Status / timers */}
        {isCanceled ? (
          <div style={{ color: "salmon" }}>Presale canceled</div>
        ) : isFinalized ? (
          <div style={{ color: "#8bfa97" }}>Finalized — claims open</div>
        ) : start ? (
          hasStarted === false ? (
            <Countdown label="Starts in" target={start} />
          ) : (
            <>
              {/* Next price bump every 24h from start */}
              {nextBumpTarget && nextBumpTarget > now ? (
                <Countdown label="Next price bump in" target={nextBumpTarget} />
              ) : (
                <div className="muted" style={{ fontSize: 12 }}>
                  Next price bump calculating…
                </div>
              )}

              {/* If you don't want a time end, show goal message instead */}
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Closes at <b>${USD_GOAL.toLocaleString()}</b> raised
              </div>
            </>
          )
        ) : (
          <div className="muted" style={{ fontSize: 12 }}>Loading sale window…</div>
        )}
      </div>

     {/* Top stats */}
<div className="grid" style={{ marginBottom: 12, gap: 12 }}>
  {/* Price card */}
  <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}>
    <div style={{ fontSize: 14, fontWeight: 500, color: "#aaa" }}>Price (USD)</div>
    <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>
      {priceUsd !== null ? `$${fmt(priceUsd, 6)} / CHAD` : "—"}
    </div>
    <div style={{ fontSize: 12, marginTop: 6, color: "#888", textAlign: "center" }}>
      Fixed in USD — BNB converted at live rate
    </div>
  </div>

  {/* Rate card */}
  <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}>
    <div style={{ fontSize: 14, fontWeight: 500, color: "#aaa" }}>Rate (BNB)</div>
    <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>
      {chadPerBNB !== null ? `${fmt(chadPerBNB, 0)} CHAD` : "—"}
    </div>
    <div style={{ fontSize: 12, marginTop: 6, color: "#888", textAlign: "center" }}>
      {bnbUsd !== null ? `1 BNB ≈ $${fmt(bnbUsd, 2)} USD` : "—"}
    </div>
    <div style={{ fontSize: 12, marginTop: 4, color: "#888", textAlign: "center" }}>
      Updates with market price
    </div>
  </div>

  {/* Contribution card */}
  <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}>
    <div style={{ fontSize: 14, fontWeight: 500, color: "#aaa" }}>Your Wallet</div>
    <div style={{ fontSize: 18, marginTop: 4 }}>{fmt(myContrib)} BNB</div>
    <div style={{ fontSize: 12, marginTop: 6, color: "#888" }}>Contributed</div>
    <div style={{ fontSize: 18, marginTop: 4 }}>{fmt(myPurchased, 0)} CHAD</div>
    <div style={{ fontSize: 12, marginTop: 6, color: "#888" }}>Allocation</div>
  </div>
</div>

      {/* Goal progress */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="row">
          <div>
            <div className="muted" style={{ fontSize: 13 }}>Raised</div>
            <div style={{ fontSize: 18 }}>
              {raisedUSD !== null
                ? `$${fmt(raisedUSD, 0)} (${fmt(raisedBNB, 3)} BNB)`
                : (raisedBNB !== null ? `${fmt(raisedBNB, 3)} BNB` : "—")}
            </div>
          </div>
          <div className="muted" style={{ fontSize: 12 }}>
            Launch goal: ${USD_GOAL.toLocaleString()}
          </div>
        </div>
        <div className="progress" style={{ marginTop: 8 }}>
          <span
            style={{
              width: `${raisedUSD !== null ? Math.min(100, (raisedUSD / USD_GOAL) * 100) : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Buy / Claim actions */}
      <div className="card" style={{ marginTop: 12 }}>
        {!address ? (
  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
    <w3m-button balance="hide"></w3m-button>
    <button onClick={openWallet} className="btn">Connect Wallet</button>
  </div>
        ) : (
          <>
            <div className="row" style={{ marginBottom: 8 }}>
              <div className="muted" style={{ fontSize: 13 }}>Buy CHAD (pay in BNB)</div>
              {chadPerBNB !== null && (
                <div className="muted" style={{ fontSize: 13 }}>
                  Est. you get ≈ {bnbInput ? fmt(Number(bnbInput) * chadPerBNB, 0) : 0} CHAD
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input
                value={bnbInput}
                onChange={(e) => setBnbInput(e.target.value)}
                placeholder="0.0"
                inputMode="decimal"
                style={{
                  background: "#0f0f0f",
                  border: "1px solid #333",
                  color: "#fff",
                  padding: "10px 12px",
                  borderRadius: 12,
                  width: 160,
                }}
              />
              <button
                onClick={onBuy}
                className="btn"
                disabled={!!buyDisabledReason || isPending || txLoading}
                title={buyDisabledReason || ""}
              >
                {isPending || txLoading ? "Processing…" : goalHit ? "Goal reached" : "Buy"}
              </button>

              {claimsOpen && (
                <button
                  onClick={onClaim}
                  className="btn secondary"
                  disabled={isPending || txLoading || !canClaim}
                >
                  Claim
                </button>
              )}
            </div>
          </>
        )}

        {(buyDisabledReason && bnbInput) && (
          <div style={{ color: "salmon", marginTop: 8, fontSize: 12 }}>{buyDisabledReason}</div>
        )}
        {uiError && (
          <div style={{ color: "salmon", marginTop: 8, fontSize: 12 }}>{uiError}</div>
        )}
        {txSuccess && (
          <div style={{ color: "#8bfa97", marginTop: 8, fontSize: 12 }}>Success! Confirmed.</div>
        )}
      </div>

      {/* Staking section (enable later) */}
      <div style={{ marginTop: 24 }}>
        {/* <StakingPanel /> */}
      </div>


                 {/* CHAD Story / Branding */}
            
{/* Quick Facts */}
{/* Official Email */}
<div style={{ textAlign: "center", margin: "20px 0" }}>
  <p style={{ 
    fontSize: "16px", 
    color: "#ffd700", 
    fontWeight: 500, 
    background: "rgba(255, 215, 0, 0.1)", 
    padding: "8px 16px", 
    borderRadius: "8px", 
    display: "inline-block"
  }}>
    📧 Official Email: <span style={{ fontWeight: 600 }}>chadthecoin@gmail.com</span>
  </p>
</div>
{/* Trust & Transparency Card */}
<div 
  className="card" 
  style={{ 
    marginTop: 20, 
    padding: "20px 24px", 
    textAlign: "center",
    background: "linear-gradient(145deg, #111, #1b1b1b)",
    border: "1px solid #333",
    borderRadius: 16
  }}
>
  <h3 style={{ margin: "0 0 16px", fontSize: 20, color: "#ffd700" }}>
    🔒 Why You Can Trust This Presale
  </h3>

  <div style={{ display: "grid", gap: 12, textAlign: "left", fontSize: 15, maxWidth: 500, margin: "0 auto" }}>
    <div>💵 <b>Fair Pricing</b> — Starts at <b>$0.003</b>, bumps +$0.0005 every 24h. Transparent & automatic.</div>
    <div>📈 <b>Live BNB/USD</b> — Price updates with Chainlink oracle. No fake numbers.</div>
    <div>🚀 <b>Hard Cap</b> — Presale ends at exactly <b>$5,000,000</b>. No endless money grab.</div>
    <div>💧 <b>Liquidity Locked</b> — BNB + CHAD are paired on PancakeSwap, LP tokens locked.</div>
    <div>🙅 <b>No Rug Pulls</b> — Contract code guarantees nobody (not even the owner) can steal your funds.</div>
  </div>

  <div style={{ fontSize: 14, marginTop: 18, color: "#aaa" }}>
    ✅ Safe • 🤝 Transparent • 😂 Meme-powered  
    <br/>Buy early = more CHAD per BNB. Don’t be last!
  </div>
</div>
<div
  style={{
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "24px",
    margin: "40px auto",
    maxWidth: "900px",
    textAlign: "center",
  }}
>
  <div
    style={{
      flex: "1 1 200px",
      background: "linear-gradient(145deg, #111, #1b1b1b)",
      border: "1px solid #333",
      borderRadius: "16px",
      padding: "20px",
      color: "#fff",
      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
    }}
  >
    <h3 style={{ margin: "0 0 10px", fontSize: "18px", color: "#fbd13d" }}>
      🔒 Liquidity
    </h3>
    <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>
      Locked after launch — no rug pulls
    </p>
  </div>

  <div
    style={{
      flex: "1 1 200px",
      background: "linear-gradient(145deg, #111, #1b1b1b)",
      border: "1px solid #333",
      borderRadius: "16px",
      padding: "20px",
      color: "#fff",
      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
    }}
  >
    <h3 style={{ margin: "0 0 10px", fontSize: "18px", color: "#fbd13d" }}>
      ✅ Presale
    </h3>
    <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>
      Fair & transparent — no hidden tokens
    </p>
  </div>

  <div
    style={{
      flex: "1 1 200px",
      background: "linear-gradient(145deg, #111, #1b1b1b)",
      border: "1px solid #333",
      borderRadius: "16px",
      padding: "20px",
      color: "#fff",
      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
    }}
  >
    <h3 style={{ margin: "0 0 10px", fontSize: "18px", color: "#fbd13d" }}>
      🔥 Supply
    </h3>
    <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>
      Fixed 1 Billion CHAD — no extra minting
    </p>
  </div>
</div>


      <div className="card" style={{ marginTop: 40, textAlign: "center" }}>
        {/* Hero image */}
        <img 
          src="/chad_hero.png"
          alt="CHAD Hero" 
          style={{ width: "100%", borderRadius: 16, marginBottom: 24 }}
        />

        {/* Title */}
        <h2 style={{ fontSize: 28, marginBottom: 12, color: "#fbd13d" }}>
          WHO IS CHAD?
        </h2>

        <p style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 32, color: "#ddd" }}>
          CHAD is not just a meme. CHAD is a <b>movement</b>.
He is the spirit of every true crypto believer — the ones who laugh at fear, who never fold, who hold through storms with <b>diamond hands</b>.
CHAD is strength, conviction, and unapologetic confidence.
He is the leader of a new generation of decentralized warriors — building, fighting, and winning together.
This isn’t just a coin. This is a legend in the making.
        </p>

        {/* Section 1: The Legend */}
        <div style={{ marginBottom: 40 }}>
          <img 
            src="/chad_Legend.png" 
            alt="CHAD Legend" 
            style={{ width: "100%", maxWidth: 480, borderRadius: 12, margin: "0 auto 20px" }}
          />
          <h3 style={{ color: "#fff", marginBottom: 8 }}>The Legend</h3>
         <p style={{ lineHeight: 1.8, color: "#ccc" }}>
  Long ago, in the chaotic world of pump-and-dumps and rug pulls,  
  there was one trader who never panicked.  
  When others cried, he smiled.  
  When markets bled, he bought.  
  When paper hands folded, he held with <b>diamond hands</b>.  
  They called him <b>CHAD</b> — not just a meme, but a <b>movement</b>.  
  The spirit of every crypto believer, the symbol of unshakable conviction,  
  and the leader of a new generation of decentralized warriors.  
</p>
        </div>

        {/* Section 2: The Mission */}
        <div style={{ marginBottom: 40 }}>
          <img 
            src="/chad_mission.png"
            alt="CHAD Mission" 
           style={{
    width: "100%",     // fill container width
    height: "auto",    // keep natural height ratio
    display: "block",  // removes inline spacing
    borderRadius: "12px"
  }}
          />
          <h3 style={{ color: "#fff", marginBottom: 8 }}>The Mission</h3>
          <p style={{ lineHeight: 1.8, color: "#ccc" }}>
  <b>CHAD</b> was born for one reason only: to have fun.  
  No fake promises, no shady plays — just pure meme energy.  
  This isn’t about changing the world, it’s about laughing with it.  
  Backed by transparent presale, locked liquidity, and a community  
  of diamond-handed degenerates who know that sometimes  
  the strongest utility is simply being a legend.  
</p>
        </div>

        {/* Section 3: The Future */}
        <div style={{ marginBottom: 40 }}>
          <img 
            src="/chad_fut.png"
            alt="CHAD Future" 
            style={{
    width: "100%",     // fill container width
    height: "auto",    // keep natural height ratio
    display: "block",  // removes inline spacing
    borderRadius: "12px"
  }}
          />
          <h3 style={{ color: "#fff", marginBottom: 8 }}>The Future</h3>
          <p style={{ lineHeight: 1.8, color: "#ccc" }}>
  The presale is just the beginning.  
  What comes next? Nobody knows — and that’s the fun.  
  <b>CHAD</b> doesn’t promise roadmaps or fake utility.  
  The future will be written by the community,  
  fueled by pure meme power and diamond hands.  
</p>

        </div>

        

        {/* Call to action */}
        <h3 style={{ marginBottom: 16, color: "#fbd13d" }}>
          Be Chad. Stay Chad. Join the Movement.
        </h3>
        <div style={{ marginBottom: 12, marginTop: 50, }}>
          <a href="https://x.com/chadthecoin?s=21&t=U7EIlDaHXQPRYNHY6Q50bw" target="_blank" rel="noopener noreferrer" className="btn" style={{ marginLeft: 12 }}>
            Follow on X
          </a>
	  <a href="https://www.instagram.com/chadthecoin?igsh=a2Q4enp4dmdtOHF1&utm_source=qr" target="_blank" rel="noopener noreferrer" className="btn" style={{ marginLeft: 12 }}>
            Follow on IG
          </a>
        </div>
      </div>


    </div>
  );
}
