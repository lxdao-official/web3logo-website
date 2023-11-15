'use client'
import { Avatar, Box, Button } from '@mui/material'
import Image from 'next/image'
import logo from '@/public/images/logo.svg'
import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

function Header() {
  const { address } = useAccount()
  const pathName = usePathname()
  const router = useRouter()
  const [uploadBtnShow, setUploadBtnShow] = useState(false)
  const [hasAvatar, setHasAvatar] = useState(false)

  useEffect(() => {
    const isNotShow = address && pathName === '/upload'
    setUploadBtnShow(!isNotShow)
    setHasAvatar(!!address)
  }, [pathName, address])

  return (
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
      <Box display="flex">
        {uploadBtnShow && (
          <Button
            disableFocusRipple={true}
            disableRipple={true}
            sx={{
              borderRadius: '100px',
              boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.04)',
              background: '#000',
              marginRight: '12px',
            }}
            variant="contained"
            onClick={() => router.push('/upload')}
          >
            Upload Web3Logo
          </Button>
        )}
        {hasAvatar && (
          <Avatar
            src="/images/oneself.svg"
            alt="avatar"
            style={{ marginRight: '12px', cursor: 'pointer' }}
            onClick={() => router.push('/personal')}
          />
        )}
        <ConnectButton
          label="Connect Wallet"
          accountStatus="address"
          chainStatus="none"
          showBalance={false}
        />
      </Box>
    </Box>
  )
}

export default Header
