import { Box, Button, Stack, Typography } from '@mui/material'
import Image from 'next/image'
import success from '@/public/images/success.svg'

function Successful() {
  return (
    <>
      <Box textAlign="center" marginTop="124px">
        <Image
          src={success}
          alt="empty"
          style={{ margin: 'auto', width: '60px', height: '60px' }}
        />
        <Typography
          component="h1"
          fontSize="28px"
          fontWeight="600"
          margin="24px auto"
          maxWidth="675px"
          letterSpacing="-0.28px"
        >
          Thank you for your contribution, we will complete the confirmation as
          soon as possible
        </Typography>
        <Box>
          <Button
            variant="contained"
            style={{
              padding: '12px 18px',
              background: '#000',
              borderRadius: 100,
              boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.04)',
              marginRight: '12px',
            }}
            href="/"
          >
            Return to homepage
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
            Continue to upload logo
          </Button>
        </Box>
      </Box>
    </>
  )
}

export default Successful
