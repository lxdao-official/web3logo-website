'use client'
import { Inter } from 'next/font/google'
import '@/app/global.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Box, ThemeProvider, createTheme } from '@mui/material'
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

const theme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WagmiConfig config={wagmiConfig}>
          <RainbowKitProvider chains={chains}>
            <QueryClientProvider client={queryClient}>
              <ThemeProvider theme={theme}>
                <Header />
                <Box
                  margin={{ lg: '0 112px', md: '0 65px', xs: '0 20px' }}
                  sx={{
                    minHeight: 'calc(100vh - 86px - 360px - 64px)',
                  }}
                >
                  {children}
                </Box>
                <Footer />
                <ToastContainer />
              </ThemeProvider>
            </QueryClientProvider>
          </RainbowKitProvider>
        </WagmiConfig>
      </body>
    </html>
  )
}
