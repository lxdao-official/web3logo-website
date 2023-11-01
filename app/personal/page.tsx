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
// import Image from 'next/image'
import { useAccount } from 'wagmi'
import { formateAddress } from '@/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import API from '@/utils/API'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import Heart from 'react-animated-heart'

function Personal() {
  const { address = '' } = useAccount()
  const router = useRouter()
  const [tabKey, setTabKey] = useState('upload')
  const [addressInfo, setAddressInfo] = useState('')
  const [logoList, setLogoList] = useState<(Logo & FavoriteData)[]>([])
  const queryClient = useQueryClient()

  const changeTab = (tabKey: string) => {
    setTabKey(tabKey)
  }

  useEffect(() => {
    if (!address) {
      router.push('/')
    }
    setAddressInfo(address as string)
  }, [address])

  const { data, isSuccess } = useQuery<PersonalDataType>({
    queryKey: ['queryCheckingLogoList', tabKey, address],
    queryFn: () =>
      API.get('/logos/getLogoByAddress', {
        params: { address, type: tabKey },
      }),
  })

  useEffect(() => {
    if (isSuccess && data && data?.data && Array.isArray(data?.data)) {
      setLogoList(data?.data || [])
    }
  }, [data, isSuccess])

  const removeFavoriteMutation = useMutation({
    mutationFn: ({ favoriteId }: { favoriteId: number }) =>
      API.delete(`/favorites/removeFavorite/${favoriteId}`),
    mutationKey: ['removeFavoriteMutation'],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['queryCheckingLogoList'],
      })
      toast.success('Cancel Successful')
    },
    onError: (error) => {
      toast.error('Error saving favorite: ' + error.message)
    },
  })
  const handleCancel = async (favoriteId: number) => {
    removeFavoriteMutation.mutate({ favoriteId })
  }

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
      <Box
        style={{
          color: '#5F6D7E',
          fontSize: '14px',
          lineHeight: '20px',
          letterSpacing: '-0.1px',
        }}
        component="p"
      >
        {addressInfo ? formateAddress(addressInfo as string) : ''}
      </Box>
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
                    <Typography
                      component="img"
                      src={tabKey === 'favorite' ? item.logo?.file : item.file}
                      style={{ maxWidth: '80px', maxHeight: '80px' }}
                      alt="logo"
                    />
                    {tabKey === 'favorite' && (
                      <Heart
                        styles={{
                          position: 'absolute',
                          right: '10px',
                          bottom: '10px',
                          width: '80px',
                          height: '80px',
                          backgroundPosition: true ? '-2800px 0' : '',
                        }}
                        isClick={true}
                        onClick={() => handleCancel(item.id!)}
                      />
                    )}
                  </Box>
                </Grid>
              ))}
          </Grid>
        ) : (
          <BasicTable
            logoList={logoList}
            tabKey={tabKey}
            address={addressInfo}
          />
        )}
      </Box>
    </Box>
  )
}

function BasicTable(props: {
  logoList: Logo[]
  tabKey: string
  address: string
}) {
  const { logoList } = props
  const queryClient = useQueryClient()
  const checkMutation = useMutation({
    mutationKey: ['checkMutation'],
    mutationFn: (info: { id: number; isAgree: boolean }[]) =>
      API.post('/logos/checkLogo', info),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['queryCheckingLogoList'],
      })
      toast.success(`Operate successfully`)
    },
    onError: (error) => toast.error(error.message),
  })
  const handleAgree = (id: number) => {
    checkMutation.mutate([{ id, isAgree: true }])
  }
  const handleReject = (id: number) => {
    checkMutation.mutate([{ id, isAgree: false }])
  }
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>fileName</TableCell>
            <TableCell align="center">fileType</TableCell>
            <TableCell align="center">file</TableCell>
            <TableCell align="center">website</TableCell>
            <TableCell align="center">checking</TableCell>
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
              <TableCell align="center">{logo.fileType}</TableCell>
              <TableCell align="center">
                <Typography component="img" src="logo.file" />
              </TableCell>
              <TableCell align="center">{logo?.logoName?.website}</TableCell>
              <TableCell align="center">
                <Button
                  onClick={() => handleAgree(logo.id)}
                  style={{ marginRight: '12px' }}
                >
                  agree
                </Button>
                <Button onClick={() => handleReject(logo.id)}>reject</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default Personal
