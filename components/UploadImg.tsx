import React, { useRef, useState } from 'react'
import { Box, Avatar, CircularProgress } from '@mui/material'
import API from '@/utils/API'
import { toast } from 'react-toastify'
function UploadImg(props: {
  avatarValue: {
    file: string
    fileName: string
    fileType: string
  }[]
  onChange: (T: any) => void
}) {
  const { avatarValue, onChange } = props
  const [loading, setLoading] = useState(false)
  const inputFile = useRef<HTMLInputElement>(null)
  const clickImg = () => {
    inputFile.current?.click()
  }
  const uploadImgFn = async (file: React.ChangeEvent<HTMLInputElement>) => {
    setLoading(true)
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
    setLoading(false)
    if (result?.code == 200) {
      const fileArray = result.data.map((f: { name: string; url: string }) => {
        const [name, type] = f.name.split('.')
        return {
          file: f.url,
          fileName: name,
          fileType: type,
        }
      })
      onChange(fileArray)
    } else {
      toast.error(`upload error:${result.message}`)
    }
  }
  return (
    <Box display="flex" gap="10px" flexWrap="wrap">
      <Avatar
        alt="avatar"
        onClick={clickImg}
        style={{
          cursor: 'pointer',
          width: '160px',
          height: '160px',
          border: '2px solid #ccc',
          borderRadius: '0',
        }}
      >
        {loading ? <CircularProgress color="inherit" /> : 'Upload'}
      </Avatar>
      {avatarValue.map((img) => (
        <Box
          component="img"
          key={img.file}
          src={img.file}
          style={{
            width: '160px',
            height: '160px',
            maxWidth: '100%',
            maxHeight: '100%',
            border: '1px solid #d0d5dd',
          }}
        />
      ))}
      <input
        type="file"
        name="files"
        multiple={true}
        style={{ display: 'none' }}
        ref={inputFile}
        onChange={uploadImgFn}
      />
    </Box>
  )
}

export default UploadImg
