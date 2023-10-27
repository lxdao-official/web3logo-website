'use client'
import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Unstable_Grid2'
import Image from 'next/image'
import { useAccount } from 'wagmi'
import { formateAddress } from '@/utils'
import { useMutation, useQuery } from '@tanstack/react-query'
import API from '@/utils/API'
import { useRouter } from 'next/navigation'

function Personal() {
  const { address = '' } = useAccount()
  const router = useRouter()
  const [tabKey, setTabKey] = useState('upload')
  const [logoList, setLogoList] = useState<(Logo & FavoriteData)[]>([])

  const changeTab = (tabKey: string) => {
    setTabKey(tabKey)
  }

  useEffect(() => {
    if (!address) {
      router.push('/')
    }
  }, [address])

  const { data, isSuccess } = useQuery<PersonalDataType>({
    queryKey: ['queryLogoList', tabKey, address],
    queryFn: () =>
      API.get('/logos/getLogoByAddress', {
        params: { address, type: tabKey },
      }),
  })

  useEffect(() => {
    if (data?.data && data?.data.length > 0) {
      setLogoList(data.data)
    }
  }, [data])

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
      {address && (
        <Typography
          component="span"
          style={{
            color: '#5F6D7E',
            fontSize: '14px',
            lineHeight: '20px',
            letterSpacing: '-0.1px',
          }}
        >
          {formateAddress(address as string)}
        </Typography>
      )}
      <Box style={{ padding: '36px 0' }}>
        <Button
          variant="contained"
          style={{
            padding: '12px 18px',
            background: tabKey === 'upload' ? '#000' : '#fff',
            color: tabKey === 'upload' ? '#fff' : '#000',
            borderRadius: 100,
            boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.04)',
            marginRight: '12px',
          }}
          onClick={() => changeTab('upload')}
        >
          I uploaded
        </Button>
        <Button
          variant="contained"
          style={{
            padding: '12px 18px',
            background: tabKey === 'favorite' ? '#000' : '#fff',
            color: tabKey === 'favorite' ? '#fff' : '#000',
            borderRadius: 100,
            border: '1px solid #DAE0E6',
            boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.04)',
            marginRight: '12px',
          }}
          onClick={() => changeTab('favorite')}
        >
          I liked
        </Button>
        <Button
          variant="contained"
          style={{
            padding: '12px 18px',
            background: tabKey === 'checking' ? '#000' : '#fff',
            color: tabKey === 'checking' ? '#fff' : '#000',
            borderRadius: 100,
            border: '1px solid #DAE0E6',
            boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.04)',
          }}
          onClick={() => changeTab('checking')}
        >
          Checking
        </Button>
      </Box>
      <Box>
        {tabKey !== 'checking' ? (
          <Grid container spacing={3}>
            {logoList.length > 0 &&
              logoList.map((item) => (
                <Grid lg={3} md={4} sm={6} xs={6} key={item.id}>
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
                      color="#000"
                    >
                      {tabKey === 'favorite'
                        ? item.logo?.fileName
                        : item.fileName}
                    </Box>
                    <Image
                      width={80}
                      height={80}
                      src={tabKey === 'favorite' ? item.logo?.file : item.file}
                      style={{ maxWidth: '80px', maxHeight: '80px' }}
                      alt="logo"
                    />
                  </Box>
                </Grid>
              ))}
          </Grid>
        ) : (
          <BasicTable logoList={logoList} />
        )}
      </Box>
    </Box>
  )
}

function BasicTable(props: { logoList: Logo[] }) {
  const { logoList } = props
  const checkMutation = useMutation({
    mutationKey: ['checkMutation'],
    mutationFn: (id: string) => API.get('', { params: id }),
  })
  const handleChecked = (id) => {
    checkMutation.mutate(id)
  }
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>fileName</TableCell>
            <TableCell align="right">file</TableCell>
            <TableCell align="right">fileType</TableCell>
            <TableCell align="right">website</TableCell>
            <TableCell align="right">checking</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logoList.map((logo) => (
            <TableRow
              key={logo.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {logo.fileName}
              </TableCell>
              <TableCell align="right">{logo.file}</TableCell>
              <TableCell align="right">{logo.fileType}</TableCell>
              <TableCell align="right">{logo?.logoName?.website}</TableCell>
              <TableCell align="right">
                <Button onClick={() => handleChecked(logo.id)}>Checked</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default Personal
