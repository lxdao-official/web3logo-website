'use client'
import {
  Box,
  Breadcrumbs,
  Typography,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from '@mui/material'
import Grid from '@mui/material/Unstable_Grid2'
import Image from 'next/image'
import heart_grey from '@/public/images/heart_grey.svg'
import download from '@/public/images/download.svg'
import download_grey from '@/public/images/download_grey.svg'
import upload from '@/public/images/upload.png'
import API from '@/utils/API'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { formatNumWithK, formateAddress } from '@/utils'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { toast } from 'react-toastify'
import { Uploader3 } from '@lxdao/uploader3'
import { createConnector } from '@lxdao/uploader3-connector'
import styled from '@emotion/styled'
import './index.css'
import { useRouter } from 'next/navigation'
import { Img3 } from '@lxdao/img3'

const Heart = styled.div`
  width: 46px;
  height: 46px;
  background-image: url(/images/heart.jpg);
  background-size: 1340px 46px;
  background-repeat: no-repeat;
`

const ImageBox = styled.div`
  position: relative;
  border: 1px solid #d0d5dd;
  width: 160px;
  height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`

function DetailPage(props: { params: { id: string } }) {
  const {
    params: { id },
  } = props

  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [hasAddress, setHasAddress] = useState(false)
  const { address } = useAccount()
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileInfo, setFileInfo] = useState<FileObject | false>(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const connector = createConnector('NFT.storage', {
    token: process.env.NEXT_PUBLIC_NFT_STORAGE_KEY || '',
  })

  const { data, isError } = useQuery<LogoNameDetail>({
    queryKey: ['queryDetail', id, address],
    queryFn: () =>
      API.get(`/logos/findLogoName/${id}`, { params: { address } }),
  })
  const { data: otherData, isSuccess } = useQuery<FindLogoName>({
    queryKey: ['FindLogoNameByPage', data?.logoType],
    queryFn: () =>
      API.get(`/logos/findLogoName`, {
        params: {
          logoType: data?.logoType,
          page: 0,
          size: 100,
        },
      }),
    select: (otherData) => {
      const newData = otherData.data.filter((item) => item.id !== data?.id)
      return { ...otherData, data: newData }
    },
  })

  useEffect(() => {
    setHasAddress(!!address)
  }, [address])

  const downloadImg = async ({ id, name }: { id: number; name: string }) => {
    const response = await API.get(`/logos/downloadLogo/${id}`, {
      responseType: 'blob',
    })
    const contentType = response.headers['content-type'] || ''
    let imgType = (contentType as string).split('/')[1]
    if (imgType.indexOf('svg') !== -1) {
      imgType = 'svg'
    }
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${name}.${imgType}`) // 或其他文件格式
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const saveFavoriteMutation = useMutation({
    mutationFn: ({ id, address }: { id: number; address: string }) =>
      API.get(`/favorites/saveFavorite`, { params: { logoId: id, address } }),
    mutationKey: ['saveFavoriteMutation'],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['queryDetail'],
      })
      toast.success('Successful collection')
    },
    onError: (error) => {
      toast.error('Error saving favorite: ' + error.message)
    },
  })

  const removeFavoriteMutation = useMutation({
    mutationFn: ({ favoriteId }: { favoriteId: number }) =>
      API.delete(`/favorites/removeFavorite/${favoriteId}`),
    mutationKey: ['removeFavoriteMutation'],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['queryDetail'],
      })
      toast.success('Cancel Successful')
    },
    onError: (error) => {
      toast.error('Error saving favorite: ' + error.message)
    },
  })

  const submitMutation = useMutation({
    mutationKey: ['submitMutation'],
    mutationFn: (
      info: FileObject & { authorAddress: string; logoNameId: number }
    ) => API.post('/logos/onlyUploadFile', { ...info, authorAddress: address }),
    onError: (error) => toast.error(error.message),
    onSuccess: (success) => {
      toast.success('Submit successful')
      handleClose()
    },
  })

  const handleFavorite = async (
    id: number,
    isFavorite: boolean | undefined,
    favoriteId: number | undefined
  ) => {
    if (!address) {
      toast.info('please connect wallet')
      return
    }
    if (isFavorite && favoriteId) {
      removeFavoriteMutation.mutate({ favoriteId })
    } else {
      saveFavoriteMutation.mutate({ id, address })
    }
  }

  const handleClose = () => {
    setOpen(false)
    inputRef.current!.value = ''
    setFileInfo(false)
  }

  const handleSubmit = () => {
    if (loading) return
    if (!inputRef.current?.value) return toast.info('please input file name')
    if (!fileInfo) return toast.info('please upload logo')
    const info: FileObject & { authorAddress: string; logoNameId: number } = {
      ...fileInfo,
      fileName: inputRef.current!.value,
      authorAddress: address || '',
      logoNameId: data?.id as number,
    }
    submitMutation.mutate(info)
  }

  const toPersonal = (address: string) => {
    router.push(`/personal?address=${address}`)
  }

  return (
    <Box>
      <Box sx={{ marginTop: '51px', lineHeight: '48px' }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            style={{
              textDecoration: 'none',
              color: '#272D37',
              fontWeight: '600',
            }}
            href="/"
          >
            Home
          </Link>
          <Typography color="#437EF7">{data?.logoName}</Typography>
        </Breadcrumbs>
      </Box>
      <Typography
        component="h1"
        sx={{
          fontWeight: '600',
          fontSize: '32px',
          lineHeight: '48px',
          marginTop: '24px',
          marginBottom: '24px',
        }}
      >
        {data?.logoName}
      </Typography>
      <Box>
        <Grid container spacing={3}>
          {data?.logo.length &&
            data?.logo.map((logo) => (
              <Grid lg={3} md={4} sm={6} xs={6} key={logo.id}>
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
                        display: 'flex',
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
                    {logo.fileName}
                  </Box>
                  <Typography
                    component="img"
                    src={logo.file}
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
                      {logo.fileType}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      style={{ minWidth: '40px' }}
                    >
                      {formatNumWithK(logo.downloadNum)}
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
                    <Heart
                      className={logo.isFavorite ? 'heart-active' : ''}
                      onClick={() =>
                        handleFavorite(
                          logo.id,
                          logo.isFavorite,
                          logo.favoriteId
                        )
                      }
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
                      onClick={() =>
                        downloadImg({ id: logo.id, name: data.logoName })
                      }
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
                  <Box
                    display="flex"
                    alignItems="center"
                    color="#0D5FFF"
                    style={{
                      cursor: 'pointer',
                    }}
                    onClick={() => toPersonal(logo.authorAddress)}
                  >
                    <svg
                      style={{ marginRight: '12px' }}
                      xmlns="http://www.w3.org/2000/svg"
                      width="29"
                      height="28"
                      viewBox="0 0 29 28"
                      fill="none"
                    >
                      <circle cx="14.5" cy="14" r="14" fill="#F0F0F0" />
                    </svg>
                    {formateAddress(logo.authorAddress)}
                  </Box>
                  <Box
                    display="flex"
                    justifyContent="flex-end"
                    alignItems="center"
                  >
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
                    {formatNumWithK(logo.favoritesNum)}
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
                    {formatNumWithK(logo.downloadNum)}
                  </Box>
                </Box>
              </Grid>
            ))}

          {hasAddress && (
            <Grid lg={3} md={4} sm={6} xs={6}>
              <Box
                onClick={() => setOpen(true)}
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
                  style={{
                    width: '32px',
                    height: '32px',
                    marginBottom: '24px',
                  }}
                  alt="upload"
                />
                <Typography component="p" color="#101828" fontSize="15px">
                  Upload
                </Typography>
              </Box>
            </Grid>
          )}
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
        {otherData?.data && otherData?.data.length > 0 ? (
          <Box>
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
                {otherData?.data.map((item) => (
                  <Grid lg={3} md={4} sm={6} xs={6} key={item.id}>
                    <Link
                      href={`/detail/${item.id}`}
                      style={{ textDecoration: 'none', color: '#000' }}
                    >
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
                            boxShadow:
                              '0px 4px 30px 0px rgba(16, 24, 40, 0.05)',
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
                          {item.logoName}
                        </Box>
                        {item.logo[0] && (
                          <>
                            <Typography
                              component="img"
                              src={item.logo[0].file}
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
                              <Button variant="outlined" size="small">
                                {item.logo[0].fileType}
                              </Button>
                              <Button variant="outlined" size="small">
                                {formatNumWithK(item.logo[0].downloadNum)}
                              </Button>
                            </Stack>
                          </>
                        )}
                      </Box>
                    </Link>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        ) : null}
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Upload</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter the name of the logo
          </DialogContentText>
          <TextField
            inputRef={inputRef}
            autoFocus
            margin="dense"
            id="name"
            label="logo name"
            fullWidth
            variant="standard"
            sx={{ marginBottom: '24px' }}
          />

          <Uploader3
            connector={connector}
            accept={['.svg']}
            crop={false}
            onUpload={(result) => {
              setLoading(true)
              setFileInfo(false)
            }}
            onComplete={(result) => {
              if (result.status === 'done') {
                setFileInfo({
                  file: result.url,
                  fileType: result.type.split('/')[1],
                })
              }
              setLoading(false)
            }}
          >
            {fileInfo ? (
              <Img3
                src={fileInfo.file}
                style={{
                  width: '160px',
                  height: '160px',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  border: '1px solid #d0d5dd',
                }}
              />
            ) : (
              <ImageBox>
                {loading ? (
                  <CircularProgress
                    style={{
                      position: 'absolute',
                    }}
                  />
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="36"
                      height="36"
                      viewBox="0 0 36 36"
                      fill="none"
                    >
                      <path
                        d="M16.5 24V11.775L12.6 15.675L10.5 13.5L18 6L25.5 13.5L23.4 15.675L19.5 11.775V24H16.5ZM9 30C8.175 30 7.4685 29.706 6.8805 29.118C6.2925 28.53 5.999 27.824 6 27V22.5H9V27H27V22.5H30V27C30 27.825 29.706 28.5315 29.118 29.1195C28.53 29.7075 27.824 30.001 27 30H9Z"
                        fill="black"
                      />
                    </svg>
                    logo（.svg）
                  </>
                )}
              </ImageBox>
            )}
          </Uploader3>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DetailPage
