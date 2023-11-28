import { Box, Button, Typography } from '@mui/material'
import Image from 'next/image'
import success from '@/public/images/success.svg'
import Link from 'next/link'

function UploadSuccess() {
  return (
    <Box component="div" paddingTop="264px" textAlign="center" height="100vh">
      <Image
        src={success}
        alt="success"
        style={{ width: '60px', height: '60px', margin: '0 auto' }}
      />
      <Typography
        paddingY="24px"
        width="663px"
        margin="auto"
        fontSize="28px"
        style={{ lineHeight: '40px', letterSpacing: '-0.28px' }}
      >
        Thank you for your contribution, we will complete the confirmation as
        soon as possible
      </Typography>
      <Box textAlign="center">
        <Link href="/">
          <Button
            style={{
              marginRight: '12px',
              borderRadius: '100px',
              background: '#000',
              fontSize: '15px',
              fontWeight: 600,
              color: '#fff',
              padding: '12px 18px',
            }}
          >
            Return to homepage
          </Button>
        </Link>
        <Link href="/upload">
          <Button
            style={{
              borderRadius: '100px',
              fontSize: '15px',
              fontWeight: 600,
              padding: '12px 18px',
              border: '1px solid #DAE0E6',
              color: '#000',
            }}
          >
            Continue to upload logo
          </Button>
        </Link>
      </Box>
    </Box>
  )
}

export default UploadSuccess
