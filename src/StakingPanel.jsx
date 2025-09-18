// src/StakingPanel.jsx
import { useMemo, useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { bsc } from "wagmi/chains";
import { parseEther, formatUnits } from "viem";
import { STAKING_ABI, ERC20_ABI } from "./abis/StakingAbi";
import { PRESALE_ABI } from "./presaleAbi";
import { CONTRACTS } from "./constants";

function fmt(n, d=2) {
  if (n === null || n === undefined || Number.isNaN(n) || !isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: d });
}

export default function StakingPanel() {
  const { address } = useAccount();
  const acct = address ?? "0x0000000000000000000000000000000000000000";

  // ---- reads: presale finalized? ----
  const { data: finalized } = useReadContract({
    address: CONTRACTS.presale, abi: PRESALE_ABI, functionName: "finalized", chainId: bsc.id,
    query: { refetchInterval: 15000 },
  });

  // ---- reads: staking core ----
  const { data: tokenAddr } = useReadContract({
    address: CONTRACTS.Staking, abi: STAKING_ABI, functionName: "stakingToken", chainId: bsc.id
  });
  const { data: totalStakedRaw } = useReadContract({
    address: CONTRACTS.Staking, abi: STAKING_ABI, functionName: "totalSupply", chainId: bsc.id,
    query: { refetchInterval: 15000 },
  });
  const { data: rewardRateRaw } = useReadContract({
    address: CONTRACTS.Staking, abi: STAKING_ABI, functionName: "rewardRate", chainId: bsc.id,
    query: { refetchInterval: 15000 },
  });
  const { data: periodFinish } = useReadContract({
    address: CONTRACTS.Staking, abi: STAKING_ABI, functionName: "periodFinish", chainId: bsc.id,
    query: { refetchInterval: 15000 },
  });
  const { data: myStakedRaw } = useReadContract({
    address: CONTRACTS.Staking, abi: STAKING_ABI, functionName: "balanceOf", args:[acct], chainId: bsc.id,
    query: { refetchInterval: 15000 },
  });
  const { data: myEarnedRaw } = useReadContract({
    address: CONTRACTS.Staking, abi: STAKING_ABI, functionName: "earned", args:[acct], chainId: bsc.id,
    query: { refetchInterval: 15000 },
  });

  // ---- token meta & allowance ----
  const { data: decimals = 18 } = useReadContract({
    address: tokenAddr, abi: ERC20_ABI, functionName: "decimals", chainId: bsc.id,
  });
  const { data: symbol = "CHAD" } = useReadContract({
    address: tokenAddr, abi: ERC20_ABI, functionName: "symbol", chainId: bsc.id,
  });
  const { data: allowanceRaw } = useReadContract({
    address: tokenAddr, abi: ERC20_ABI, functionName: "allowance", chainId: bsc.id,
    args: [acct, CONTRACTS.Staking],
    query: { refetchInterval: 15000 },
  });

  const totalStaked = totalStakedRaw ? Number(formatUnits(totalStakedRaw, decimals)) : 0;
  const rewardRate  = rewardRateRaw  ? Number(formatUnits(rewardRateRaw,  decimals)) : 0; // token/sec
  const myStaked    = myStakedRaw    ? Number(formatUnits(myStakedRaw,    decimals)) : 0;
  const myEarned    = myEarnedRaw    ? Number(formatUnits(myEarnedRaw,    decimals)) : 0;
  const allowance   = allowanceRaw   ? Number(formatUnits(allowanceRaw,   decimals)) : 0;

  // APR ≈ (rewardRate * seconds_per_year / totalStaked) * 100
  const secondsPerYear = 365 * 24 * 60 * 60;
  const aprPct = totalStaked > 0 ? (rewardRate * secondsPerYear / totalStaked) * 100 : null;
  const stakingActive = periodFinish ? (Number(periodFinish) * 1000 > Date.now()) : false;

  // ---- writes ----
  const [amount, setAmount] = useState("");
  const [uiError, setUiError] = useState("");

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: txLoading, isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const needsApprove = (() => {
    const a = parseFloat(amount || "0");
    return a > allowance;
  })();

  async function onApprove() {
    setUiError("");
    try {
      // approve max of entered amount (or a large amount; here we use exact)
      const wad = parseEther(amount || "0");
      await writeContract({
        address: tokenAddr,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACTS.Staking, wad],
        chainId: bsc.id,
      });
    } catch (e) {
      setUiError(e?.shortMessage || e?.message || "Approve failed");
    }
  }

  async function onStake() {
    setUiError("");
    try {
      const wad = parseEther(amount || "0");
      await writeContract({
        address: CONTRACTS.Staking,
        abi: STAKING_ABI,
        functionName: "stake",
        args: [wad],
        chainId: bsc.id,
      });
      setAmount("");
    } catch (e) {
      setUiError(e?.shortMessage || e?.message || "Stake failed");
    }
  }

  // UI-only lock: withdraw/exit hidden until presale finalized
  async function onWithdrawAll() {
    setUiError("");
    try {
      const wad = myStakedRaw || 0n;
      await writeContract({
        address: CONTRACTS.Staking,
        abi: STAKING_ABI,
        functionName: "withdraw",
        args: [wad],
        chainId: bsc.id,
      });
    } catch (e) {
      setUiError(e?.shortMessage || e?.message || "Withdraw failed");
    }
  }

  async function onClaim() {
    setUiError("");
    try {
      await writeContract({
        address: CONTRACTS.Staking,
        abi: STAKING_ABI,
        functionName: "getReward",
        chainId: bsc.id,
      });
    } catch (e) {
      setUiError(e?.shortMessage || e?.message || "Claim failed");
    }
  }

  const stakeDisabled = !amount || parseFloat(amount) <= 0 || isPending || txLoading;

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="row" style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>Stake {symbol}</h2>
        <div className="muted" style={{ fontSize: 13 }}>
  APR (floating): <b>{aprPct === null ? "—" : `${fmt(aprPct, 1)}%`}</b>
  {!stakingActive && " (not funded / finished)"}
  {aprPct === null && stakingActive && " — stake to start earning"}
</div>
      </div>

      <div className="grid" style={{ marginBottom: 12 }}>
        <div className="card">
          <div className="muted" style={{ fontSize: 13 }}>Total Staked</div>
          <div style={{ fontSize: 18 }}>{fmt(totalStaked, 0)} {symbol}</div>
        </div>
        <div className="card">
          <div className="muted" style={{ fontSize: 13 }}>Your Staked</div>
          <div style={{ fontSize: 18 }}>{fmt(myStaked, 0)} {symbol}</div>
        </div>
        <div className="card">
          <div className="muted" style={{ fontSize: 13 }}>Your Earned</div>
          <div style={{ fontSize: 18 }}>{fmt(myEarned, 4)} {symbol}</div>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 8 }}>
          <div className="muted" style={{ fontSize: 13 }}>Amount to stake</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <input
            value={amount}
            onChange={(e)=>setAmount(e.target.value)}
            placeholder="0.0"
            inputMode="decimal"
            style={{ background:"#0f0f0f", border:"1px solid #333", color:"#fff", padding:"10px 12px", borderRadius:12, width:180 }}
          />
          {needsApprove ? (
            <button className="btn" onClick={onApprove} disabled={stakeDisabled}>Approve</button>
          ) : (
            <button className="btn" onClick={onStake} disabled={stakeDisabled}>Stake</button>
          )}

          {/* Claim visible only after presale is finalized */}
{finalized && (
  <button className="btn secondary" onClick={onClaim} disabled={isPending || txLoading}>
    Claim
  </button>
)}

          {/* Withdraw/Exit hidden until presale is finalized (UI-only lock) */}
          {!finalized ? (
            <span className="muted" style={{ fontSize: 12 }}>
              Withdrawals unlock after presale is finalized.
            </span>
          ) : (
            <button className="btn secondary" onClick={onWithdrawAll} disabled={isPending || txLoading}>
              Withdraw All
            </button>
          )}
        </div>

        {uiError && <div style={{ color:"salmon", marginTop:8, fontSize:12 }}>{uiError}</div>}
        {txSuccess && <div style={{ color:"#8bfa97", marginTop:8, fontSize:12 }}>Success! Confirmed.</div>}
      </div>
    </div>
  );
}