// src/App.jsx
import "./wallet.js";
import "./styles.css";
import "./index.css";
import PresalePanel from "./PresalePanel";

import { useEffect } from "react";
import { useChainId, useAccount, useDisconnect, useReconnect } from "wagmi";
import { bsc } from "wagmi/chains";
import logo from "./assets/chad_logo.png";

export default function App() {
  const chainId = useChainId();
  const onBnb = chainId === bsc.id;

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { reconnect } = useReconnect();

  // 🔁 Rehydrate any saved wallet session on first load / tab focus
  useEffect(() => { reconnect(); }, [reconnect]);
  useEffect(() => {
    const onFocus = () => { if (!isConnected) reconnect(); };
    window.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [isConnected, reconnect]);

  const openModal = () => {
    const el = document.querySelector("w3m-button");
    if (el) { try { el.click(); return; } catch {} }
    if (window?.ethereum?.request) {
      window.ethereum.request({ method: "eth_requestAccounts" }).catch(() => {});
    }
  };

  const hardDisconnect = () => {
    try {
      disconnect?.();
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("wagmi") || k.startsWith("wc:") || k.startsWith("walletconnect")) {
          localStorage.removeItem(k);
        }
      });
    } catch {}
  };

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <img src={logo} alt="CHAD" className="brand-logo" />
          <span className="brand-title">CHADCOIN</span>
          <span className="netpill" style={{ color: onBnb ? "#9fd69f" : "#ffb3b3" }}>
            {onBnb ? "BNB Mainnet" : "Switch to BNB"}
          </span>
        </div>

        {/* one authoritative Web3Modal button (you can hide it if you prefer) */}
        <w3m-button balance="hide" size="sm"></w3m-button>

        {/* Optional custom pill — if you prefer this, keep it and hide w3m-button with display:none */}
        {/* <div className="wallet-wrap">
          {isConnected ? (
            <button className="addr-pill" onClick={openModal} title="Manage wallet" type="button">
              <span className="dot" />
              <span className="addr-text">{address.slice(0,6)}…{address.slice(-4)}</span>
              <span className="addr-x" onClick={(e)=>{e.stopPropagation(); hardDisconnect();}} title="Disconnect">×</span>
            </button>
          ) : (
            <button className="btn connect" onClick={openModal} type="button">Connect Wallet</button>
          )}
        </div> */}
      </header>

      <main className="main">
        <PresalePanel />
      </main>

      <footer className="foot">
        <span>© {new Date().getFullYear()} CHADCOIN</span>
      </footer>
    </div>
  );
}
