'use client'
import {
  Avatar,
  Box,
  Button,
  List,
  ListItem,
  ListItemButton,
  Menu,
  MenuItem,
  SwipeableDrawer,
  Typography,
} from '@mui/material'

import MenuIcon from '@mui/icons-material/Menu'
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

  const HiddenMenu = () => (
    <Box role="presentation" onClick={handleClose} onKeyDown={handleClose}>
      <List>
        {hasAvatar && (
          <ListItem disablePadding>
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
          </ListItem>
        )}
        {uploadBtnShow && (
          <ListItem disablePadding>
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
          </ListItem>
        )}
      </List>
    </Box>
  )

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
      <Box display="flex">
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
          accountStatus="avatar"
          chainStatus="none"
          showBalance={false}
        />
      </Box>

      {/* <Box display={{ md: 'none', xs: 'flex' }}>
        <MenuIcon
          sx={{
            display: { md: 'none', sm: 'block', xs: 'block' },
            cursor: 'pointer',
          }}
          onClick={handleClick}
        />
        <SwipeableDrawer
          anchor="top"
          open={open}
          onClose={handleClose}
          onOpen={handleClick}
        >
          <HiddenMenu />
        </SwipeableDrawer>
      </Box> */}
    </Box>
  )
}

export default Header
