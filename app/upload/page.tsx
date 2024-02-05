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
import { useEffect, useState } from 'react'
import { logoTypeConfig, connector } from '@/config'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import API from '@/utils/API'
import { toast } from 'react-toastify'
import { useAccount } from 'wagmi'
import { createCanvas } from 'canvas'
import { useRouter } from 'next/navigation'
import { Img3 } from '@lxdao/img3'
import { getImg3DidStrFromUrl } from '@/utils'
import UploadImg from '@/components/UploadImg'

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

  const [uploadFiles, setUploadFiles] = useState<
    {
      file: string
      fileName: string
      fileType: string
    }[]
  >([])
  const router = useRouter()

  const submitMutation = useMutation({
    mutationKey: ['submitMutation'],
    mutationFn: (info: uploadInputs) =>
      API.post('/logos', { ...info, authorAddress: address }),
    onError: (error) => toast.error(error.message),
    onSuccess: (success) => {
      toast.success('Submit successful')
      router.push('/uploadSuccess')
      setUploadFiles([])
      reset()
    },
  })

  const onSubmit: SubmitHandler<uploadInputs> = (data) => {
    if (!address) {
      return toast.info('please connect wallet')
    }

    data.files = uploadFiles
    submitMutation.mutate(data)
  }

  const uploadCallback = (files: any[]) => {
    setUploadFiles([...uploadFiles, ...files])
  }

  return (
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
        width={{ md: '800px', xs: '95%' }}
        style={{
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
      <Box marginTop="42px" width={{ md: '600px', xs: '95%' }} marginX="auto">
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
          <Box marginTop="10px" display="flex" gap="10px">
            <UploadImg avatarValue={uploadFiles} onChange={uploadCallback} />
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
                  <Checkbox {...field} style={{ paddingLeft: 0 }} />I confirm it
                  is a correct logo and there were no copyright issues.
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
  )
}

export default Upload
