// src/App.jsx
import "./wallet.js";
import "./styles.css";
import "./index.css";
import PresalePanel from "./PresalePanel";


import { useChainId } from "wagmi";
import { bsc } from "wagmi/chains";

// If you have a logo file, keep this import.
import logo from "./assets/chad_logo.png";


export default function App() {
  const chainId = useChainId();
  const onBnb = chainId === bsc.id;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          {/* Show logo if the file exists */}
          <img src={logo} alt="CHAD" className="brand-logo" />
          <span className="brand-title">CHADCOIN</span>

          <span className="netpill" style={{ color: onBnb ? "#9fd69f" : "#ffb3b3" }}>
            {onBnb ? "BNB Mainnet" : "Switch to BNB"}
          </span>
        </div>

        {/* Web3Modal’s connect button (registered in wallet.js) */}
        <w3m-button balance="hide"></w3m-button>
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
