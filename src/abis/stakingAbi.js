// src/StakingAbi.js
export const STAKING_ABI = [
  { "inputs": [], "name": "stakingToken", "outputs":[{"internalType":"address","name":"","type":"address"}], "stateMutability":"view", "type":"function" },
  { "inputs": [], "name": "rewardRate",   "outputs":[{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view", "type":"function" },
  { "inputs": [], "name": "periodFinish", "outputs":[{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view", "type":"function" },
  { "inputs": [], "name": "totalSupply",  "outputs":[{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view", "type":"function" },
  { "inputs": [{"internalType":"address","name":"account","type":"address"}], "name":"balanceOf", "outputs":[{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view", "type":"function" },
  { "inputs": [{"internalType":"address","name":"account","type":"address"}], "name":"earned",    "outputs":[{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view", "type":"function" },

  { "inputs": [{"internalType":"uint256","name":"amount","type":"uint256"}], "name":"stake",    "outputs":[], "stateMutability":"nonpayable", "type":"function" },
  { "inputs": [{"internalType":"uint256","name":"amount","type":"uint256"}], "name":"withdraw", "outputs":[], "stateMutability":"nonpayable", "type":"function" },
  { "inputs": [], "name":"getReward", "outputs":[], "stateMutability":"nonpayable", "type":"function" },
  { "inputs": [], "name":"exit",      "outputs":[], "stateMutability":"nonpayable", "type":"function" }
];

// minimal ERC20 for approve/allowance
export const ERC20_ABI = [
  { "inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function" },
  { "inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function" },
  { "inputs": [], "name": "decimals", "outputs":[{"internalType":"uint8","name":"","type":"uint8"}], "stateMutability":"view", "type":"function" },
  { "inputs": [], "name": "symbol",   "outputs":[{"internalType":"string","name":"","type":"string"}], "stateMutability":"view", "type":"function" }
];