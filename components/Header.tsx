'use client'
import { Avatar, Box, Button, Menu, MenuItem } from '@mui/material'
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
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const isShow = pathName === '/upload' ? false : !!address
    setUploadBtnShow(isShow)
    setHasAvatar(!!address)
  }, [pathName, address])

  const handleClick = () => {
    setOpen(true)
  }
  const handleClose = () => {
    setOpen(false)
  }

  return (
    <Box
      padding={{ lg: '0 112px', md: '0 65px', xs: '0 20px' }}
      sx={{
        width: '100%',
        height: 86,
      }}
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      position="relative"
    >
      <Link href="/">
        <Image src={logo} style={{ width: 130 }} alt="web3logo" />
      </Link>
      <Box display={{ md: 'flex', xs: 'none' }}>
        {uploadBtnShow && (
          <Button
            disableFocusRipple={true}
            disableRipple={true}
            sx={{
              borderRadius: '100px',
              background: '#000',
              marginRight: '12px',
              '&:hover': {
                backgroundColor: 'rgb(14,118,253)',
              },
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
          label="Connect Wallet "
          accountStatus="address"
          chainStatus="none"
          showBalance={false}
        />
      </Box>

      <Box display={{ md: 'none', xs: 'flex' }}>
        <Button
          id="basic-button"
          aria-controls={open ? 'basic-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
        >
          MENU
        </Button>
        <Menu id="basic-menu" open={open} onClose={handleClose}>
          {hasAvatar && (
            <MenuItem onClick={handleClose}>
              <Link
                href="/personal"
                style={{
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  color: '#2E2E2E',
                  textDecoration: 'none',
                }}
              >
                Personal
              </Link>
            </MenuItem>
          )}
          {uploadBtnShow && (
            <MenuItem onClick={handleClose}>
              <Link
                href="/upload"
                style={{
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  color: '#2E2E2E',
                  textDecoration: 'none',
                }}
              >
                upload
              </Link>
            </MenuItem>
          )}
        </Menu>
        <ConnectButton
          label="Connect Wallet "
          accountStatus="avatar"
          chainStatus="none"
          showBalance={false}
        />
      </Box>
    </Box>
  )
}

export default Header
