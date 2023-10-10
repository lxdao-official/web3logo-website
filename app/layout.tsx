import { Inter } from 'next/font/google'
import '@/app/global.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Box } from '@mui/material'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
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
      </body>
    </html>
  )
}
