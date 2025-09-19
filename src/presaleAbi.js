// src/presaleAbi.js
export const PRESALE_ABI = [
  {
    type: "function",
    name: "P",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "start",            type: "uint64"  },
      { name: "end",              type: "uint64"  },
      { name: "softCap",          type: "uint128" },
      { name: "hardCap",          type: "uint128" },
      { name: "minBuy",           type: "uint128" },
      { name: "maxBuy",           type: "uint128" },
      { name: "liquidityPercent", type: "uint32"  },
      { name: "lpLockSeconds",    type: "uint64"  },
      // NOTE: there's NO presaleRate in the struct
      { name: "listingRate",      type: "uint128" },
      { name: "whitelistEnabled", type: "bool"    }
    ]
  },

  // State
  { type: "function", name: "totalRaised", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "contributed", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "purchased",   stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "finalized",   stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { type: "function", name: "canceled",    stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },

  // 🔥 Add the dynamic views your UI needs
  { type: "function", name: "currentRate",     stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] }, // CHAD per 1 BNB (1e18)
  { type: "function", name: "currentUsdPerCHAD", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] }, // USD/CHAD (1e18)
  { type: "function", name: "usdRaised",       stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] }, // USD raised (1e18)

  // Writes
  { type: "function", name: "buy",             stateMutability: "payable",    inputs: [], outputs: [] },
  { type: "function", name: "claim",           stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "finalize",        stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "cancelPresale",   stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "setWhitelistEnabled", stateMutability: "nonpayable", inputs: [{ name: "on", type: "bool" }], outputs: [] }
];