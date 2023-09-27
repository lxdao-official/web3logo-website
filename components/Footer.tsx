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
    <Box bgcolor="#F8F9FB" height="360px" padding="62px 112px" marginTop="64px">
      <Grid container>
        <Grid container item="true" xs={12}>
          <Grid item="true" xs={6}>
            <Image src={logo} alt="webelogo" width={130} />
            <Box
              component="p"
              padding="18px 0 16px 0"
              color={'#5F6D7E'}
              fontSize={16}
            >
              Get it all here
            </Box>
            <Box display="flex" xs={{ '& image': { marginRight: 14 } }}>
              <Image src={telegram} alt="telegram" />
              <Image src={discord} alt="discord" />
              <Image src={twitter} alt="twitter" />
            </Box>
          </Grid>
          <Grid item="true" xs={3} textAlign="right">
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
          <Grid item="true" xs={3} textAlign="right">
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
        <Grid xs={12} textAlign="center">
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
    <Typography variant="h6" lineHeight="24px" fontWeight={600}>
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
            color="#646F7C"
            variant="body1"
            lineHeight="40px"
            fontWeight={400}
          >
            {item.name}
          </Typography>
        </Link>
      )
    })}
  </Box>
)

export default Footer
