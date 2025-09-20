import "./wallet.js";
import "./styles.css";
import "./index.css";
import PresalePanel from "./PresalePanel";

import { useEffect } from "react";
import { useChainId, useAccount, useDisconnect, useReconnect } from "wagmi";
import { bsc } from "wagmi/chains";
import { useWeb3Modal } from "@web3modal/wagmi/react";   // ⟵ add this
import logo from "./assets/chad_logo.png";

export default function App() {
  const chainId = useChainId();
  const onBnb = chainId === bsc.id;

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { reconnect } = useReconnect();
  const { open } = useWeb3Modal();                      // ⟵ get the open() fn

  useEffect(() => { reconnect(); }, [reconnect]);

  async function openModal() {
    try {
      await open({ view: "Connect" });                 // ⟵ open Web3Modal directly
      return;
    } catch {
      // fallback: poke the custom element if available
      const el = document.getElementById("w3m-hidden");
      try { el?.shadowRoot?.querySelector("button")?.click(); } catch {}
      if (el) { el.click(); return; }
      // last-resort: native provider
      if (window?.ethereum?.request) {
        window.ethereum.request({ method: "eth_requestAccounts" }).catch(() => {});
      }
    }
  }

  function hardDisconnect() {
    try {
      disconnect?.();
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("wagmi") || k.startsWith("wc:") || k.startsWith("walletconnect")) {
          localStorage.removeItem(k);
        }
      });
    } catch {}
  }

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

        {/* Keep exactly one hidden Web3Modal element in the app as a backup */}
        <w3m-button id="w3m-hidden" balance="hide" style={{ display: "none" }}></w3m-button>

        <div className="wallet-wrap">
          {isConnected ? (
            <button className="addr-pill" onClick={openModal} title="Manage wallet" type="button">
              <span className="dot" />
              <span className="addr-text">{address.slice(0, 6)}…{address.slice(-4)}</span>
              <span
                className="addr-x"
                onClick={(e) => { e.stopPropagation(); hardDisconnect(); }}
                aria-label="Disconnect"
                title="Disconnect"
              >
                ×
              </span>
            </button>
          ) : (
            <button className="btn connect" onClick={openModal} type="button">
              Connect Wallet
            </button>
          )}
        </div>
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
