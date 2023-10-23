import {
  Box,
  Breadcrumbs,
  Typography,
  Link,
  Button,
  Stack,
} from '@mui/material'
import Grid from '@mui/material/Unstable_Grid2'
import Image from 'next/image'
import logos_bitcoin from '@/public/images/logos_bitcoin.svg'
import heart from '@/public/images/heart.svg'
import heart_grey from '@/public/images/heart_grey.svg'
import download from '@/public/images/download.svg'
import download_grey from '@/public/images/download_grey.svg'
import upload from '@/public/images/upload.png'

function DetailPage(props: { params: { type: string } }) {
  const {
    params: { type },
  } = props
  return (
    <Box>
      <Box sx={{ marginTop: '51px', lineHeight: '48px' }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link underline="none" color="#272D37" fontWeight="600" href="/">
            Home
          </Link>
          <Typography color="#437EF7">{type}</Typography>
        </Breadcrumbs>
      </Box>
      <Typography
        component="h1"
        sx={{
          fontWeight: '600',
          fontSize: '32px',
          lineHeight: '48px',
          marginTop: '22px',
        }}
      >
        {type}
      </Typography>
      <Box>
        <Grid container spacing={3}>
          <Grid lg={3} md={4} sm={6} xs={6}>
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
              <Stack
                position="absolute"
                bottom="16px"
                left="16px"
                spacing={1}
                direction="row"
                display="none"
                zIndex={1000}
              >
                <Button
                  variant="outlined"
                  size="small"
                  style={{ minWidth: '40px' }}
                >
                  SVG
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  style={{ minWidth: '40px' }}
                >
                  3.5K
                </Button>
              </Stack>
              <Stack
                position="absolute"
                bottom="16px"
                right="16px"
                spacing={1}
                direction="row"
                display="none"
                zIndex={1000}
              >
                <Image
                  src={heart}
                  alt="love"
                  style={{
                    backgroundColor: 'rgba(65, 106, 252, 0.05)',
                    width: '46px',
                    height: '46px',
                    padding: '14px',
                    borderRadius: '50%',
                  }}
                />
                <Image
                  src={download}
                  alt="download"
                  style={{
                    backgroundColor: 'rgba(65, 106, 252, 0.05)',
                    width: '46px',
                    height: '46px',
                    padding: '11px',
                    borderRadius: '50%',
                  }}
                />
              </Stack>
            </Box>
            <Box
              marginTop="12px"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              fontSize="12px"
            >
              <Box display="flex" alignItems="center" color="#0D5FFF">
                <Image
                  src={download}
                  alt="avatar"
                  style={{ width: '28px', height: '28px', marginRight: '12px' }}
                />
                0xaweq...123
              </Box>
              <Box display="flex" justifyContent="flex-end" alignItems="center">
                <Image
                  src={heart_grey}
                  alt="heart"
                  style={{
                    width: '12px',
                    height: '12px',
                    marginLeft: '12px',
                    marginRight: '6px',
                  }}
                />
                100
                <Image
                  src={download_grey}
                  alt="download"
                  style={{
                    width: '12px',
                    height: '12px',
                    marginLeft: '12px',
                    marginRight: '6px',
                  }}
                />
                1k
              </Box>
            </Box>
          </Grid>
          <Grid lg={3} md={4} sm={6} xs={6}>
            <Box
              position="relative"
              display="flex"
              justifyContent="center"
              alignItems="center"
              flexDirection="column"
              height={200}
              border="1px solid #EAEBF0"
              borderRadius="10px"
              boxShadow="0px 1px 2px 0px rgba(16, 24, 40, 0.04)"
              style={{ cursor: 'pointer' }}
              sx={{
                '&:hover': {
                  boxShadow: '0px 4px 30px 0px rgba(16, 24, 40, 0.05)',
                },
              }}
            >
              <Image
                src={upload}
                style={{ width: '32px', height: '32px', marginBottom: '24px' }}
                alt="upload"
              />
              <Typography component="p" color="#101828" fontSize="15px">
                Upload
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
      <Box marginTop="48px" borderTop="1px solid #EAEBF0" paddingTop="12px">
        <Typography
          component="p"
          color="#666F85"
          fontSize="14px"
          marginBottom="48px"
        >
          Downloading the logo is only for communication and learning. If you
          need authorization to use it, please contact the project party. If
          there is an error, please{' '}
          <Link href="#" color="#0D5FFF">
            {' '}
            contact us{' '}
          </Link>{' '}
          .
        </Typography>
        <Typography
          component="h2"
          fontSize="16px"
          lineHeight="30px"
          color="#272D37"
          marginBottom="24px"
        >
          Same type
        </Typography>
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
                  <Box
                    position="absolute"
                    left="20px"
                    top="20px"
                    display="none"
                  >
                    Etherscan
                  </Box>
                  <Image
                    src={logos_bitcoin}
                    style={{ maxWidth: '80px', maxHeight: '80px' }}
                    alt="logo"
                  />
                  <Stack
                    position="absolute"
                    bottom="16px"
                    left="16px"
                    spacing={1}
                    direction="row"
                    display="none"
                    zIndex={1000}
                  >
                    <Button variant="outlined" size="small" style={{}}>
                      SVG
                    </Button>
                    <Button variant="outlined" size="small">
                      3.5K
                    </Button>
                  </Stack>
                </Box>
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  )
}

export default DetailPage
