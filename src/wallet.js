import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi'
import { http } from 'wagmi'
import { bsc } from 'wagmi/chains'

export const projectId = import.meta.env.VITE_WC_PROJECT_ID || ''

export const wagmiConfig = defaultWagmiConfig({
  projectId,                // still pass (Web3Modal init is guarded below)
  chains: [bsc],
  transports: { [bsc.id]: http('https://bsc-dataseed.binance.org') },
  metadata: {
    name: 'CHAD Presale',
    description: 'Buy CHAD on BNB',
    url: window.location.origin,
    icons: []
  }
})

// Initialize the modal only if we actually have a projectId
if (typeof window !== 'undefined') {
  if (projectId) {
    createWeb3Modal({
      wagmiConfig,
      projectId,
      chains: [bsc],
      themeMode: 'dark',
      themeVariables: { '--w3m-accent': '#fbd13d' }
    })
  } else {
    console.warn('⚠️ Web3Modal not initialized — missing VITE_WC_PROJECT_ID in .env')
  }
}