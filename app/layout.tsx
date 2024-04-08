import { Metadata } from 'next/types'
import RootConfigLayout from '@/components/RootConfigLayout'

const title = 'Web3Logo'
const description =
  'The Web3Logo website is just like its name suggests. We will gather the source files (primarily in SVG format) of all Web3-related logos, making it convenient for designers, operations personnel, and all other relevant users to download and use them.'

export const metadata: Metadata = {
  title,
  description,
  generator: 'Web3Logo',
  applicationName: 'Web3Logo',
  referrer: 'origin-when-cross-origin',
  keywords: ['Web3Logo', 'logo', 'web3', 'lxdao'],
  authors: [{ name: 'Web3Logo' }],
  creator: title,
  publisher: title,

  icons: {
    icon: '/images/logo.png',
    shortcut: '/images/logo.png',
    apple: '/images/logo.png',
  },

  openGraph: {
    title,
    description,
    url: 'https://web3logo.info',
    siteName: 'web3logo',
    images: [
      {
        url: 'https://web3logo.info/images/logo.png',
        width: 800,
        height: 600,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <RootConfigLayout>{children}</RootConfigLayout>
      </body>
    </html>
  )
}
