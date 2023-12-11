'use client'
import {
  Box,
  Button,
  Input,
  InputAdornment,
  Stack,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Unstable_Grid2'
import empty from '@/public/images/empty.svg'
import Link from 'next/link'
import 'css-init'
import API from '@/utils/API'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import InfiniteScroll from 'react-infinite-scroll-component'
import { formatNumWithK, debounce } from '@/utils'
import { logoTypeConfig } from '@/config'

export default function Home() {
  const [inputValue, setInputValue] = useState('')
  const [logoType, setLogoType] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [logoNamesList, setLogoNamesList] = useState<LogoName[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const pageInfo = useRef<{ page: number; size: number }>({ page: 0, size: 20 })
  const { data, isError, isSuccess, isLoading } = useQuery<FindLogoName>({
    queryKey: [
      'FindLogoNameByPage',
      inputValue,
      logoType,
      pageInfo.current.page,
      pageInfo.current.size,
    ],
    queryFn: () =>
      API.get(`/logos/findLogoName`, {
        params: {
          key: inputValue,
          logoType,
          page: pageInfo.current.page,
          size: pageInfo.current.size,
        },
      }),
  })

  useEffect(() => {
    if (isError) {
      setLogoNamesList([])
    }
    if (isSuccess && data.data.length < pageInfo.current.size) {
      setHasMore(false)
    }
    if (pageInfo.current.page === 0) {
      setLogoNamesList(data?.data || [])
    } else {
      setLogoNamesList([...logoNamesList, ...(data?.data || [])])
    }
  }, [data])

  const initSearchParam = () => {
    setHasMore(true)
    setLogoNamesList([])
    pageInfo.current.page = 0
  }

  const handleSearch = () => {
    initSearchParam()
    setInputValue(inputRef.current?.value || '')
  }

  const fetchMoreData = () => {
    if (hasMore && isSuccess) {
      pageInfo.current.page += 1
    }
  }

  const handleSearchType = (type: string) => {
    setLogoNamesList([])
    pageInfo.current.page = 0
    setLogoType(type)
  }

  return (
    <Box>
      <Box
        paddingTop={{ md: '132px', xs: '60px' }}
        display="flex"
        justifyContent="center"
        alignItems="center"
        flexDirection="column"
      >
        <Box
          component="img"
          src="/images/logo.svg"
          width={{ md: '349px', xs: '180px' }}
          marginBottom={{ md: '64px', xs: '32px' }}
          alt="web3logo"
        />
        <Box
          width={{ md: 616, xs: '90%' }}
          height={{ md: 56, xs: 40 }}
          padding={{ md: '8px 16px', xs: '8px 4px' }}
          sx={{
            borderRadius: 100,
            border: '1px solid #DAE0E6',
            boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.04)',
          }}
        >
          <Input
            inputRef={inputRef}
            onChange={(e) =>
              debounce(() => setInputValue(e.target.value), 300)()
            }
            style={{ width: '100%', height: '100%', margin: 'auto' }}
            disableUnderline={true}
            placeholder="Search web3 logo..."
            startAdornment={
              <InputAdornment position="start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="19"
                  height="18"
                  viewBox="0 0 19 18"
                  fill="none"
                >
                  <g clipPath="url(#clip0_341_1263)">
                    <path
                      d="M17.1596 17.8404C17.4857 18.1665 18.0143 18.1665 18.3404 17.8404C18.6665 17.5143 18.6665 16.9857 18.3404 16.6596L17.1596 17.8404ZM14.0032 7.54412C14.0032 10.8352 11.3352 13.5032 8.04412 13.5032V15.1732C12.2576 15.1732 15.6732 11.7576 15.6732 7.54412H14.0032ZM8.04412 13.5032C4.75299 13.5032 2.085 10.8352 2.085 7.54412H0.415C0.415 11.7576 3.83067 15.1732 8.04412 15.1732V13.5032ZM2.085 7.54412C2.085 4.25299 4.75299 1.585 8.04412 1.585V-0.085C3.83067 -0.085 0.415 3.33067 0.415 7.54412H2.085ZM8.04412 1.585C11.3352 1.585 14.0032 4.25299 14.0032 7.54412H15.6732C15.6732 3.33067 12.2576 -0.085 8.04412 -0.085V1.585ZM12.3066 12.9875L17.1596 17.8404L18.3404 16.6596L13.4875 11.8066L12.3066 12.9875Z"
                      fill="#919BA7"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_341_1263">
                      <rect
                        width="18"
                        height="18"
                        fill="white"
                        transform="translate(0.5)"
                      />
                    </clipPath>
                  </defs>
                </svg>
              </InputAdornment>
            }
            endAdornment={
              <Button
                variant="contained"
                style={{
                  background: '#000',
                  borderRadius: 100,
                  boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.04)',
                }}
                onClick={handleSearch}
              >
                Search
              </Button>
            }
          />
        </Box>
      </Box>
      <Box
        marginTop={{ md: '95px', xs: '60px' }}
        marginBottom={{ md: '48px', xs: '22px' }}
        sx={{ '&>button': { marginBottom: '5px' } }}
      >
        <Button
          variant="outlined"
          style={{
            borderRadius: 100,
            marginRight: 8,
            borderColor: '#D0D5DD',
            background: !logoType ? '#000' : '#fff',
            color: !logoType ? '#fff' : '#000',
          }}
          onClick={() => handleSearchType('')}
        >
          All
        </Button>
        {logoTypeConfig.map((type) => (
          <Button
            key={type}
            variant="outlined"
            style={{
              borderRadius: 100,
              marginRight: 8,
              borderColor: '#D0D5DD',
              background: logoType === type ? '#000' : '#fff',
              color: logoType === type ? '#fff' : '#000',
            }}
            onClick={() => handleSearchType(type)}
          >
            {type}
          </Button>
        ))}
      </Box>

      <InfiniteScroll
        dataLength={logoNamesList.length}
        next={fetchMoreData}
        hasMore={hasMore}
        loader={
          <Typography
            component="p"
            textAlign="center"
            display={isLoading ? 'block' : 'none'}
          >
            Loading...
          </Typography>
        }
      >
        <Box margin="0">
          <Grid container spacing={3} margin="0">
            {logoNamesList &&
              logoNamesList.map((item, index) => (
                <Grid lg={3} md={4} sm={6} xs={6} key={index}>
                  <Link href={`/detail/${item.id}`}>
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
                        {item.logoName}
                      </Box>
                      {item.logo[0] && (
                        <>
                          <Box
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
                              {item.logo[0].fileType.includes('svg')
                                ? 'svg'
                                : item.logo[0].fileType}
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
      </InfiniteScroll>

      {/* ====== empty */}
      {isError || logoNamesList.length == 0 ? (
        <Box textAlign="center" marginTop="124px">
          <Image
            src={empty}
            alt="empty"
            style={{ margin: 'auto', width: '60px', height: '60px' }}
          />
          <Typography
            component="h1"
            fontSize="28px"
            fontWeight="600"
            marginTop="24px"
          >
            No logos related to &quot;
            <Typography
              component="span"
              color="#0D5FFF"
              fontSize="28px"
              fontWeight="600"
            >
              {inputValue}
            </Typography>
            &quot; were found
          </Typography>
          <Typography
            component="p"
            fontSize="16px"
            fontWeight={500}
            color="#5F6D7E"
            marginBottom="24px"
          >
            Upload a Web3logo, Earn LXDAO Points
          </Typography>
          <Button
            variant="contained"
            style={{
              padding: '12px 18px',
              background: '#000',
              borderRadius: 100,
              boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.04)',
            }}
          >
            Upload Web3 logo
          </Button>
        </Box>
      ) : null}
    </Box>
  )
}
