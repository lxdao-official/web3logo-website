'use client'
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Input,
  MenuItem,
  Select,
  Typography,
} from '@mui/material'
import styled from '@emotion/styled'
import { useForm, SubmitHandler, Controller } from 'react-hook-form'
import { Uploader3 } from '@lxdao/uploader3'
import { createConnector } from '@lxdao/uploader3-connector'
import Image from 'next/image'
import { useState } from 'react'
import { logoTypeConfig, connector } from '@/config'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import API from '@/utils/API'
import { toast } from 'react-toastify'
import { useAccount } from 'wagmi'
import { createCanvas } from 'canvas'

const FormInput = styled.input`
  font-size: 16px;
  width: 100%;
  height: 42px;
  border-radius: 100px;
  border: 1px solid #d0d5dd;
  background: #fff;
  padding: 0 14px;
  margin-top: 20px;
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

function Label({
  required,
  value,
  style,
}: {
  required: boolean
  value: string
  style?: any
}) {
  return (
    <Box
      textAlign="left"
      marginTop="24px"
      sx={{
        color: '#101828',
        fontFamily: 'Work Sans',
        fontSize: '16px',
        fontStyle: 'normal',
        fontWeight: 500,
        lineHeight: 'normal',
        letterSpacing: '-0.32px',
      }}
      style={style}
    >
      {required && <span style={{ color: '#DC0202' }}>* </span>}
      {value}
    </Box>
  )
}

function Upload() {
  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<uploadInputs>({
    defaultValues: {
      logoName: '',
      logoType: '',
      website: '',
      files: [],
      agree: false,
    },
  })

  const { address } = useAccount()

  const [loading1, setLoading1] = useState(false)
  const [loading2, setLoading2] = useState(false)

  const submitMutation = useMutation({
    mutationKey: ['submitMutation'],
    mutationFn: (info: uploadInputs) =>
      API.post('/logos', { ...info, authorAddress: address }),
    onError: (error) => toast.error(error.message),
    onSuccess: (success) => {
      toast.success('Submit successful')
      reset()
    },
  })

  const onSubmit: SubmitHandler<uploadInputs> = (data) => {
    if (!address) {
      return toast.info('please connect wallet')
    }
    if (data.files[0]) {
      data.files[0].fileName = `${data.logoName}-white`
    }
    if (data.files[1]) {
      data.files[1].fileName = `${data.logoName}-dark`
    }
    submitMutation.mutate(data)
  }

  return (
    <>
      <Box textAlign="center">
        <Typography
          component="h1"
          style={{
            fontSize: '32px',
            fontStyle: 'normal',
            fontWeight: 700,
            lineHeight: '40px',
            letterSpacing: '-0.64px',
            marginBottom: '16px',
          }}
        >
          Easily upload Web3 logo
        </Typography>
        <Typography
          component="p"
          marginX="auto"
          style={{
            width: '800px',
            color: '#5F6D7E',
            textAlign: 'center',
            fontFamily: 'Inter',
            fontSize: '16px',
            fontStyle: 'normal',
            fontWeight: 400,
            lineHeight: '24px',
            letterSpacing: '-0.1px',
          }}
        >
          Please ensure that the uploaded logo is correct and there are no
          copyright disputes. Let us build a better web3logo world together.
        </Typography>
        <Box marginTop="42px" width="600px" marginX="auto">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Label required={true} value="Logo name:" />
            <Controller
              name="logoName"
              control={control}
              rules={{
                required: true,
              }}
              render={({ field }) => <FormInput {...field} />}
            />
            {errors.logoName && (
              <Typography
                component="p"
                textAlign="left"
                color="red"
                fontSize="12px"
              >
                Logo name is required
              </Typography>
            )}

            <Label required={true} value="Logo Type:" />
            <Controller
              name="logoType"
              control={control}
              rules={{
                required: true,
              }}
              render={({ field }) => (
                <Select
                  {...field}
                  style={{
                    width: '100%',
                    height: '42px',
                    borderRadius: '100px',
                    marginTop: '20px',
                    textAlign: 'left',
                  }}
                >
                  {logoTypeConfig.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            {errors.logoType && (
              <Typography
                component="p"
                textAlign="left"
                color="red"
                fontSize="12px"
              >
                Logo type is required
              </Typography>
            )}

            <Label required={false} value="Website link:" />
            <Controller
              name="website"
              control={control}
              render={({ field }) => <FormInput {...field} />}
            />

            <Label required={true} value="Upload logo file（svg/png）:" />
            <Box display="flex">
              <Box marginRight="20px">
                <Label
                  required={true}
                  value="White background"
                  style={{ color: '#666F85', lineHeight: '39px' }}
                />
                <Controller
                  name="files"
                  control={control}
                  rules={{
                    required: true,
                    validate: (value) => {
                      console.log(value)
                      if (value.length === 0 || !value[0]) {
                        return 'Please upload logo file'
                      }
                    },
                  }}
                  render={({ field: { onChange, value } }) => (
                    <Uploader3
                      connector={connector}
                      onUpload={(result) => {
                        value[0] = undefined
                        setLoading1(true)
                      }}
                      onComplete={(result) => {
                        console.log(result)
                        if (result.status === 'done') {
                          // if (result.type.includes('/svg')) {
                          //   const canvas = createCanvas(
                          //     result.crop.width,
                          //     result.crop.height,
                          //     'svg'
                          //   )
                          //   const ctx = canvas.getContext('2d')
                          //   ctx.drawImage(
                          //     result.url,
                          //     0,
                          //     0,
                          //     result.crop.width,
                          //     result.crop.height
                          //   )
                          //   const dataUrl = canvas.toDataURL()
                          //   console.log(dataUrl)
                          // }
                          value[0] = {
                            file: result.url,
                            fileType: result.type.split('/')[1],
                          }
                          onChange(value)
                        }
                        setLoading1(false)
                      }}
                    >
                      {value[0] ? (
                        <Image
                          src={value[0]?.file}
                          alt="logo"
                          width={160}
                          height={160}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            border: '1px solid #d0d5dd',
                          }}
                        />
                      ) : (
                        <ImageBox>
                          {loading1 ? (
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
                  )}
                />
              </Box>
              <Box>
                <Label
                  required={false}
                  value="Dark background"
                  style={{ color: '#666F85', lineHeight: '39px' }}
                />
                <Controller
                  name="files"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <Uploader3
                      connector={connector}
                      onUpload={(result) => {
                        value[1] = undefined
                        setLoading2(true)
                      }}
                      onComplete={(result) => {
                        if (result.status === 'done') {
                          value[1] = {
                            file: result.url,
                            fileType: result.type.split('/')[1],
                          }
                          onChange(value)
                        }
                        setLoading2(false)
                      }}
                    >
                      {value[1] ? (
                        <Image
                          src={value[1]?.file}
                          alt="logo"
                          width={160}
                          height={160}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            border: ' 1px solid #d0d5dd',
                          }}
                        />
                      ) : (
                        <ImageBox style={{ background: '#000', color: '#fff' }}>
                          {loading2 ? (
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
                                  fill="white"
                                />
                              </svg>
                              logo（.svg）
                            </>
                          )}
                        </ImageBox>
                      )}
                    </Uploader3>
                  )}
                />
              </Box>
            </Box>
            {errors.files && (
              <Typography
                component="p"
                textAlign="left"
                color="red"
                fontSize="12px"
              >
                Please upload logo file
              </Typography>
            )}

            <Controller
              name={'agree'}
              control={control}
              rules={{ required: true }}
              render={({ field }) => {
                return (
                  <Box textAlign="left" color="#666F85">
                    <Checkbox {...field} style={{ paddingLeft: 0 }} />I confirm
                    it is a correct logo and there were no copyright issues.
                  </Box>
                )
              }}
            />
            {errors.agree && (
              <Typography
                component="p"
                textAlign="left"
                color="red"
                fontSize="12px"
              >
                Please confirm
              </Typography>
            )}

            <Button
              type="submit"
              style={{
                width: '100%',
                borderRadius: '100px',
                background: '#000',
                color: '#fff',
                padding: '12px 18px',
                fontSize: '15px',
                marginTop: '22px',
              }}
            >
              Upload
            </Button>
          </form>
        </Box>
      </Box>
    </>
  )
}

export default Upload
