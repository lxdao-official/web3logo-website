import { Box } from '@mui/material'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import Grid from '@mui/material/Unstable_Grid2/Grid2'
import Image from 'next/image'
import logo from '@/public/images/logo.svg'
import telegram from '@/public/images/telegram.svg'
import discord from '@/public/images/discord.svg'
import twitter from '@/public/images/twitter.svg'

function Footer() {
  return (
    <Box
      padding={{ lg: '62px 112px', md: '30px 65px', xs: '10px 20px' }}
      bgcolor="#F8F9FB"
      height={{ md: '360px', xs: 'auto' }}
      marginTop="64px"
    >
      <Grid container>
        <Grid container xs={12}>
          <Grid xs={12} md={6} marginBottom={{ xs: '10px', md: '0' }}>
            <Image src={logo} alt="webelogo" width={130} />
            <Box
              component="p"
              padding="18px 0 16px 0"
              color="#5F6D7E"
              fontSize={16}
            >
              Get it all here
            </Box>
            <Box display="flex">
              <Link href="https://t.me/LXDAO" target="_blank">
                <Image src={telegram} alt="telegram" />
              </Link>
              <Link
                href="https://discord.com/invite/KwDbCFRnYQ"
                target="_blank"
              >
                <Image
                  style={{ margin: '0 16px' }}
                  src={discord}
                  alt="discord"
                />
              </Link>
              <Link href="https://twitter.com/LXDAO_Official" target="_blank">
                <Image src={twitter} alt="twitter" />
              </Link>
            </Box>
          </Grid>
          <Grid md={3} xs={12} textAlign={{ md: 'right' }}>
            <NavList
              title="Resources"
              items={[
                {
                  name: 'Github',
                  link: 'https://github.com/lxdao-official',
                },
              ]}
            />
          </Grid>
          <Grid md={3} xs={12} textAlign={{ md: 'right' }}>
            <NavList
              title="Supporters"
              items={[
                {
                  name: 'LXDAO',
                  link: 'https://lxdao.io/',
                },
              ]}
            />
          </Grid>
        </Grid>
        <Grid
          xs={12}
          textAlign="center"
          marginTop={{ xs: '32px', md: '64px' }}
          style={{ color: '#5F6D7E', fontSize: 16 }}
        >
          © 2023 Web3logo. All Rights Reserved.
        </Grid>
      </Grid>
    </Box>
  )
}

interface NavProps {
  title: string
  items: {
    name: string
    link: string
  }[]
}
const NavList = ({ title, items }: NavProps) => (
  <Box display="flex" flexDirection="column">
    <Typography
      variant="h6"
      lineHeight="24px"
      fontWeight={600}
      marginBottom="24px"
    >
      {title}
    </Typography>
    {items.map((item, index) => {
      return (
        <Link
          target="_blank"
          href={item.link}
          sx={{ textDecoration: 'none' }}
          key={index}
        >
          <Typography
            color="#5F6D7E"
            variant="body1"
            lineHeight="40px"
            fontWeight={400}
            marginBottom="12px"
          >
            {item.name}
          </Typography>
        </Link>
      )
    })}
  </Box>
)

export default Footer
