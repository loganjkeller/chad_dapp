export const PRESALE_ABI = [
  { "inputs": [], "name": "P", "outputs": [
    { "internalType":"uint64","name":"start","type":"uint64" },
    { "internalType":"uint64","name":"end","type":"uint64" },
    { "internalType":"uint128","name":"softCap","type":"uint128" },
    { "internalType":"uint128","name":"hardCap","type":"uint128" },
    { "internalType":"uint128","name":"minBuy","type":"uint128" },
    { "internalType":"uint128","name":"maxBuy","type":"uint128" },
    { "internalType":"uint32","name":"liquidityPercent","type":"uint32" },
    { "internalType":"uint64","name":"lpLockSeconds","type":"uint64" },
    { "internalType":"uint128","name":"listingRate","type":"uint128" },
    { "internalType":"bool","name":"whitelistEnabled","type":"bool" }
  ], "stateMutability":"view", "type":"function" },

  { "inputs": [], "name": "currentUsdPerCHAD", "outputs":[{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view", "type":"function" },
  { "inputs": [], "name": "currentRate",       "outputs":[{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view", "type":"function" },
  { "inputs": [], "name": "usdRaised",         "outputs":[{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view", "type":"function" },

  { "inputs": [], "name": "totalRaised", "outputs":[{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view", "type":"function" },
  { "inputs": [{"internalType":"address","name":"","type":"address"}], "name":"contributed","outputs":[{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view","type":"function" },
  { "inputs": [{"internalType":"address","name":"","type":"address"}], "name":"purchased",  "outputs":[{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view","type":"function" },

  { "inputs": [], "name": "buy",   "outputs": [], "stateMutability":"payable",    "type":"function" },
  { "inputs": [], "name": "claim", "outputs": [], "stateMutability":"nonpayable", "type":"function" },

  { "inputs": [], "name": "finalized", "outputs":[{"internalType":"bool","name":"","type":"bool"}], "stateMutability":"view", "type":"function" },
  { "inputs": [], "name": "canceled",  "outputs":[{"internalType":"bool","name":"","type":"bool"}], "stateMutability":"view", "type":"function" },

  { "inputs": [], "name":"finalize","outputs":[],"stateMutability":"nonpayable","type":"function" },
  { "inputs": [], "name":"cancelPresale","outputs":[],"stateMutability":"nonpayable","type":"function" },
  { "inputs":[{"internalType":"bool","name":"on","type":"bool"}],"name":"setWhitelistEnabled","outputs":[],"stateMutability":"nonpayable","type":"function" }
];