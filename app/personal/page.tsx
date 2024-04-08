'use client'
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Select,
  MenuItem,
} from '@mui/material'
import Grid from '@mui/material/Unstable_Grid2'
import { useAccount } from 'wagmi'
import { formateAddress, getImg3DidStrFromUrl } from '@/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import API from '@/utils/API'
import { toast } from 'react-toastify'
import styled from '@emotion/styled'
import { logoTypeConfig } from '@/config'
import { Img3 } from '@lxdao/img3'
import Image from 'next/image'

const Heart = styled.div`
  width: 46px;
  height: 46px;
  background-image: url(/images/heart.jpg);
  background-size: 1340px 46px;
  background-repeat: no-repeat;
  background-position: -1288px 0;
  position: absolute;
  right: 10px;
  bottom: 10px;
`
const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS
  ? process.env.NEXT_PUBLIC_ADMIN_ADDRESS.split(',')
  : []

const NoDataText = {
  upload: 'No uploaded logo',
  favorite: 'No liked logo',
}

function Personal({ searchParams = { address: '' } }) {
  const { address = '' } = useAccount()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSelf, setIsSelf] = useState(false)
  const [uploading, setUploading] = useState(false)
  const { address: pathAddress } = searchParams
  const [tabKey, setTabKey] = useState('upload')
  const [addressInfo, setAddressInfo] = useState('')
  const [logoList, setLogoList] = useState<(Logo & FavoriteData)[]>([])
  const queryClient = useQueryClient()
  const filesList = useRef<{ name: string; fileType: string; file?: string }[]>(
    []
  )
  const uploadFiles = useRef<uploadInputs[]>([])
  const inputFile = useRef<HTMLInputElement>(null)
  const clickImg = () => {
    inputFile.current?.click()
  }
  const uploadImgFn = async (file: React.ChangeEvent<HTMLInputElement>) => {
    setUploading(true)
    const formData = new FormData()
    if (!file.target.files) {
      toast.error(`Upload error: Please refresh and select the file again`)
      return
    }
    Object.values(file.target.files).map((file) => {
      formData.append('files', file, file.name)
    })

    const result: {
      code: number
      message: string
      data: { name: string; url: string }[]
    } = await API.post('/upload-img', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    if (result?.code == 200) {
      const infos = result.data.map((f: { name: string; url: string }) => {
        const [name, type] = f.name.split('.')
        return {
          logoName: name,
          logoType: '',
          website: '',
          files: [
            {
              file: f.url,
              fileName: name,
              fileType: type,
            },
          ],
          agree: true,
          authorAddress: addressInfo,
        }
      })
      batchUploadFile.mutate(infos)
    } else {
      setUploading(false)
      toast.error(`upload error:${result.message}`)
    }
  }

  const changeTab = (tabKey: string) => {
    setTabKey(tabKey)
  }

  useEffect(() => {
    setIsAdmin(ADMIN_ADDRESS.includes(address))
    setIsSelf(!pathAddress)
    setAddressInfo(pathAddress || (address as string))
  }, [address, pathAddress])

  const { data, isSuccess } = useQuery<PersonalDataType>({
    queryKey: ['queryCheckingLogoList', tabKey, addressInfo],
    queryFn: () =>
      API.get('/logos/getLogoByAddress', {
        params: { address: addressInfo, type: tabKey },
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
    if (!isSelf) return
    removeFavoriteMutation.mutate({ favoriteId })
  }

  const batchUploadFile = useMutation({
    mutationKey: ['batchUploadFile'],
    mutationFn: (info: uploadInputs[]) =>
      API.post('/logos/batchUploadFile', info),
    onError: (error) => {
      filesList.current = []
      uploadFiles.current = []
      toast.error(error.message)
      setUploading(false)
    },
    onSuccess: (success) => {
      setUploading(false)
      filesList.current = []
      uploadFiles.current = []
      toast.success(`upload successful`)
      queryClient.invalidateQueries({
        queryKey: ['queryCheckingLogoList'],
      })
    },
  })

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
            border: '1px solid #DAE0E6',
            boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.04)',
            marginRight: '12px',
          }}
          onClick={() => changeTab('upload')}
        >
          uploaded
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
          liked
        </Button>
        {isAdmin && isSelf && (
          <Button
            variant="contained"
            style={{
              padding: '12px 18px',
              background: tabKey === 'checking' ? '#000' : '#fff',
              color: tabKey === 'checking' ? '#fff' : '#000',
              borderRadius: 100,
              border: '1px solid #DAE0E6',
              boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.04)',
              marginRight: '12px',
            }}
            onClick={() => changeTab('checking')}
          >
            Checking
          </Button>
        )}
        {isAdmin && isSelf && (
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
            disabled={uploading}
            onClick={clickImg}
          >
            Upload{uploading && 'ing...'}
            <input
              type="file"
              name="files"
              multiple={true}
              style={{ display: 'none' }}
              ref={inputFile}
              onChange={uploadImgFn}
            />
          </Button>
        )}
      </Box>
      <Box>
        {tabKey !== 'checking' ? (
          <Grid container spacing={3}>
            {logoList.length > 0 ? (
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
                    <Box
                      component="img"
                      src={tabKey === 'favorite' ? item.logo?.file : item.file}
                      style={{
                        width: '80px',
                        height: '80px',
                        maxWidth: '80px',
                        maxHeight: '80px',
                        objectFit: 'contain',
                      }}
                    />

                    {tabKey === 'favorite' && (
                      <Heart onClick={() => handleCancel(item.id!)} />
                    )}
                  </Box>
                </Grid>
              ))
            ) : (
              <Typography width="100%" textAlign="center" marginTop="30px">
                {NoDataText[tabKey as keyof typeof NoDataText]}
              </Typography>
            )}
          </Grid>
        ) : (
          <BasicTable
            logoList={logoList}
            setLogoList={setLogoList}
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
  setLogoList: Dispatch<SetStateAction<(Logo & FavoriteData)[]>>
  tabKey: string
  address: string
}) {
  const { logoList, setLogoList } = props
  const queryClient = useQueryClient()
  const checkMutation = useMutation({
    mutationKey: ['checkMutation'],
    mutationFn: (info: { id: number; isAgree: boolean; logoType?: string }[]) =>
      API.post('/logos/checkLogo', info),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['queryCheckingLogoList'],
      })
      toast.success(`Operate successfully`)
    },
    onError: (error) => toast.error(error.message),
  })
  const handleAgree = (logo: Logo) => {
    if (!logo.logoName?.logoType) {
      toast.info('please choose logoType')
      return
    }
    checkMutation.mutate([
      { id: logo.id, isAgree: true, logoType: logo.logoName?.logoType },
    ])
  }
  const handleReject = (id: number) => {
    checkMutation.mutate([{ id, isAgree: false }])
  }

  const changeFileLogoType = (type: string, index: number) => {
    logoList[index].logoName!.logoType = type
    setLogoList([...logoList] as (Logo & FavoriteData)[])
  }

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>fileName</TableCell>
            <TableCell align="center">logoName</TableCell>
            <TableCell align="center">logoType</TableCell>
            <TableCell align="center">fileType</TableCell>
            <TableCell align="center">file</TableCell>
            <TableCell align="center">website</TableCell>
            <TableCell align="center">checking</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logoList.map((logo, index) => (
            <TableRow
              key={logo.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {logo.fileName}
              </TableCell>
              <TableCell align="center">{logo.logoName?.logoName}</TableCell>
              <TableCell align="center">
                <FormControl fullWidth>
                  <InputLabel id="demo-simple-select-label">
                    logoType
                  </InputLabel>
                  <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    label="logoType"
                    value={logo.logoName ? logo.logoName!.logoType : ''}
                    onChange={(e) =>
                      changeFileLogoType(e.target.value as string, index)
                    }
                  >
                    {logoTypeConfig.map((type) => (
                      <MenuItem value={type} key={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </TableCell>
              <TableCell align="center">{logo.fileType}</TableCell>
              <TableCell align="center">
                <Box
                  component="img"
                  src={logo.file}
                  style={{
                    width: '100px',
                    height: '100px',
                    objectFit: 'contain',
                  }}
                />
              </TableCell>
              <TableCell align="center">{logo?.logoName?.website}</TableCell>
              <TableCell align="center">
                <Button
                  onClick={() => handleAgree(logo)}
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
