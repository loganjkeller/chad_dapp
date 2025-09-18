// src/PresalePanel.jsx
import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { bsc } from "wagmi/chains";
import { parseEther } from "viem";
import { PRESALE_ABI } from "./presaleAbi";
import { CONTRACTS, USD_GOAL } from "./constants";
import StakingPanel from "./StakingPanel";


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

function Countdown({ label, target }) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  if (!target || now >= target) return (
    <div>{label}: <b>0d 0h 0m 0s</b></div>
  );
  const diff = target - now;
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return <div>{label}: <b>{d}d {h}h {m}m {s}s</b></div>;
}

export default function PresalePanel() {
  const { address } = useAccount();
  const myAddr =
    address ?? "0x0000000000000000000000000000000000000000";

  // -------- On-chain reads --------
  const { data: P } = useReadContract({
    address: CONTRACTS.presale,
    abi: PRESALE_ABI,
    functionName: "P",
    chainId: bsc.id,
    query: { refetchInterval: 15000 },
  });

  const { data: usdNow } = useReadContract({
    address: CONTRACTS.presale,
    abi: PRESALE_ABI,
    functionName: "currentUsdPerCHAD",
    chainId: bsc.id,
    query: { refetchInterval: 15000 },
  });

  const { data: rateNow } = useReadContract({
    address: CONTRACTS.presale,
    abi: PRESALE_ABI,
    functionName: "currentRate",
    chainId: bsc.id,
    query: { refetchInterval: 15000 },
  });

  const { data: usdRaised } = useReadContract({
    address: CONTRACTS.presale,
    abi: PRESALE_ABI,
    functionName: "usdRaised",
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

  // presale state toggles (must exist if you use them in JSX)
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

  // -------- Numbers --------
  // allow 0 values: only guard when P is missing
  const start = P ? Number(P.start) : undefined;
  const end   = P ? Number(P.end)   : undefined;

  const priceUsd   = usdNow    != null ? Number(usdNow) / 1e18 : null;  // $ / CHAD
  const chadPerBNB = rateNow   != null ? Number(rateNow) / 1e18 : null; // CHAD per 1 BNB
  const raisedUSD  = usdRaised != null ? Number(usdRaised) / 1e18 : null;

  const minBuy  = P ? Number(P.minBuy)  / 1e18 : 0;
  const maxBuy  = P ? Number(P.maxBuy)  / 1e18 : 0;

  const myContrib   = myContribRaw   ? Number(myContribRaw)   / 1e18 : 0;
  const myPurchased = myPurchasedRaw ? Number(myPurchasedRaw) / 1e18 : 0;

  const now = Math.floor(Date.now() / 1000);
  const hasStarted = start ? now >= start : false;
  const hasEnded   = end   ? now > end   : false;
  const goalHit    = raisedUSD !== null ? raisedUSD >= USD_GOAL : false;
  const claimsOpen = hasEnded || goalHit;

  // next 24h bump boundary from `start`
  const nextBumpAt = start
    ? start + (Math.floor(Math.max(0, now - start) / 86400) + 1) * 86400
    : undefined;

  // -------- Write actions --------
  const [bnbInput, setBnbInput] = useState("");
  const [uiError, setUiError]   = useState("");

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: txLoading, isSuccess: txSuccess } =
    useWaitForTransactionReceipt({ hash: txHash });

  const buyDisabledReason = useMemo(() => {
    if (!bnbInput) return "Enter BNB amount";
    if (!hasStarted) return "Presale not started";
    if (goalHit) return "Goal reached";
    if (hasEnded) return "Presale ended";
    if (minBuy && Number(bnbInput) < minBuy) return `Min buy ${fmt(minBuy)} BNB`;
    if (maxBuy && myContrib + Number(bnbInput) > maxBuy)
      return `Max per wallet ${fmt(maxBuy)} BNB`;
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

  // show Claim only when finalized and wallet has something to claim
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

  // -------- UI --------
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="row" style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>CHAD Presale</h2>

        {/* Status / timers */}
        {isCanceled ? (
          <div style={{ color: "salmon" }}>Presale canceled</div>
        ) : isFinalized ? (
          <div style={{ color: "#8bfa97" }}>Finalized — claims open</div>
        ) : start && end ? (
          !hasStarted ? (
            <Countdown label="Starts in" target={start} />
          ) : !hasEnded && !goalHit ? (
            <Countdown label="Next price bump" target={nextBumpAt} />
          ) : (
            <div style={{ color: "#8bfa97" }}>
              {goalHit ? "Goal reached — claims open after finalize" : "Presale ended — claims open after finalize"}
            </div>
          )
        ) : (
          <div className="muted" style={{ fontSize: 12 }}>Loading sale window…</div>
        )}
      </div>

      {/* Top stats */}
      <div className="grid" style={{ marginBottom: 12 }}>
        <div className="card">
          <div className="muted" style={{ fontSize: 13 }}>
            Current Price (on-chain)
          </div>
          <div style={{ fontSize: 18 }}>
            {priceUsd !== null ? `$${fmt(priceUsd, 6)} / CHAD` : "—"}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
            Increases +$0.0005 every 24h since start
          </div>
        </div>

        <div className="card">
          <div className="muted" style={{ fontSize: 13 }}>On-chain Rate</div>
          <div style={{ fontSize: 18 }}>
            {chadPerBNB !== null ? `${fmt(chadPerBNB, 0)} CHAD / 1 BNB` : "—"}
          </div>
        </div>

        <div className="card">
          <div className="muted" style={{ fontSize: 13 }}>Your Contribution</div>
          <div style={{ fontSize: 18 }}>{fmt(myContrib)} BNB</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>Your Allocation</div>
          <div style={{ fontSize: 18 }}>{fmt(myPurchased, 0)} CHAD</div>
        </div>
      </div>

      {/* Goal progress */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="row">
          <div>
            <div className="muted" style={{ fontSize: 13 }}>Raised</div>
            <div style={{ fontSize: 18 }}>
              {raisedUSD !== null ? `$${fmt(raisedUSD, 0)}` : "—"}
            </div>
          </div>
          <div className="muted" style={{ fontSize: 13 }}>
            Launch goal: ${USD_GOAL.toLocaleString()}
          </div>
        </div>
        <div className="progress" style={{ marginTop: 8 }}>
          <span
            style={{
              width: `${
                raisedUSD !== null ? Math.min(100, (raisedUSD / USD_GOAL) * 100) : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* Buy / Claim actions */}
<div className="card" style={{ marginTop: 12 }}>
  {!address ? (
    // Show connect button if not connected
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {/* If using Web3Modal */}
      <w3m-button balance="hide"></w3m-button>

      {/* Fallback MetaMask connect */}
      <button onClick={openWallet} className="btn">
        Connect Wallet
      </button>
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
    <div style={{ color: "salmon", marginTop: 8, fontSize: 12 }}>
      {buyDisabledReason}
    </div>
  )}
  {uiError && (
    <div style={{ color: "salmon", marginTop: 8, fontSize: 12 }}>
      {uiError}
    </div>
  )}
  {txSuccess && (
    <div style={{ color: "#8bfa97", marginTop: 8, fontSize: 12 }}>
      Success! Confirmed.
    </div>
  )}
</div>

{/* Staking section */}
<div style={{ marginTop: 24 }}>
  { /*<StakingPanel /> */}
</div>

                 {/* CHAD Story / Branding */}
{/* Quick Facts */}
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
            src="/chad_legend.png" 
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
          <a href="https://t.me/chadcoin" target="_blank" rel="noopener noreferrer" className="btn secondary">
            Join Telegram
          </a>
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
