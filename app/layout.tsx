'use client'
import { Inter } from 'next/font/google'
import '@/app/global.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Box } from '@mui/material'
import '@rainbow-me/rainbowkit/styles.css'
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { configureChains, createConfig, WagmiConfig } from 'wagmi'
import { mainnet, polygon, optimism, arbitrum, base, zora } from 'wagmi/chains'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const queryClient = new QueryClient()

const inter = Inter({ subsets: ['latin'] })
const { chains, publicClient } = configureChains(
  [mainnet, polygon, optimism, arbitrum, base, zora],
  [
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_ID || '' }),
    publicProvider(),
  ]
)

const { connectors } = getDefaultWallets({
  appName: 'Web3logo',
  projectId: process.env.NEXT_PUBLIC_WALLET_PROJECT_ID || '',
  chains,
})

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <WagmiConfig config={wagmiConfig}>
            <RainbowKitProvider chains={chains}>
              <Header />
              <Box
                sx={{
                  minHeight: 'calc(100vh - 86px - 360px - 64px)',
                  margin: '0 112px',
                }}
              >
                {children}
              </Box>
              <Footer />
            </RainbowKitProvider>
          </WagmiConfig>
        </QueryClientProvider>
        <ToastContainer />
      </body>
    </html>
  )
}
