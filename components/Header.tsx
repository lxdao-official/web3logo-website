import { Box, Button } from '@mui/material'
import Image from 'next/image'
import logo from '@/public/images/logo.svg'
import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'

function Header() {
  return (
    <>
      <Box
        sx={{
          width: '100%',
          height: 86,
          padding: '0 112px',
        }}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Link href="/">
          <Image src={logo} style={{ width: 130 }} alt="web3logo" />
        </Link>
        <ConnectButton />
      </Box>
    </>
  )
}

export default Header
