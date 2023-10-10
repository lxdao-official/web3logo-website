import { Box, Button, Typography } from '@mui/material'
import Grid from '@mui/material/Unstable_Grid2'
import Image from 'next/image'
import Link from 'next/link'

import logos_bitcoin from '@/public/images/logos_bitcoin.svg'

function Personal() {
  return (
    <Box paddingTop="80px">
      <Typography
        component="p"
        style={{
          color: '#272D37',
          fontFamily: 'Inter',
          fontSize: '28px',
          fontStyle: 'normal',
          fontWeight: 600,
          lineHeight: '28px',
          letterSpacing: '-0.1px',
        }}
      >
        Welcome to join and contribute.
      </Typography>
      <Typography
        component="p"
        style={{
          color: '#5F6D7E',
          fontSize: '14px',
          lineHeight: '20px',
          letterSpacing: '-0.1px',
        }}
      >
        0x387...4ead
      </Typography>
      <Box style={{ padding: '36px 0' }}>
        <Button
          variant="contained"
          style={{
            padding: '12px 18px',
            background: '#000',
            borderRadius: 100,
            boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.04)',
            marginRight: '12px',
          }}
        >
          I uploaded
        </Button>
        <Button
          variant="contained"
          style={{
            padding: '12px 18px',
            background: '#fff',
            borderRadius: 100,
            border: '1px solid #DAE0E6',
            boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.04)',
            color: '#000',
          }}
        >
          I liked
        </Button>
      </Box>
      <Box>
        <Grid container spacing={3}>
          <Grid lg={3} md={4} sm={6} xs={6}>
            <Link href="/detail/etherscan">
              <Box
                position="relative"
                display="flex"
                justifyContent="center"
                alignItems="center"
                height={200}
                border="1px solid #EAEBF0"
                borderRadius="10px"
                boxShadow="0px 1px 2px 0px rgba(16, 24, 40, 0.04)"
                style={{ cursor: 'pointer' }}
                sx={{
                  '&:hover': {
                    boxShadow: '0px 4px 30px 0px rgba(16, 24, 40, 0.05)',
                    '& div': {
                      display: 'block',
                    },
                    '& button': {
                      padding: '0 8px',
                      color: '#A5B1C2',
                      borderRadius: '2px',
                      border: '1px solid #F5F5F5',
                    },
                  },
                }}
              >
                <Box position="absolute" left="20px" top="20px" display="none">
                  Etherscan
                </Box>
                <Image
                  src={logos_bitcoin}
                  style={{ maxWidth: '80px', maxHeight: '80px' }}
                  alt="logo"
                />
              </Box>
            </Link>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

export default Personal
