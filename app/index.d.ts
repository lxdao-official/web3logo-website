type uploadInputs = {
  logoName: string
  logoType: string
  website: string
  files: (FileObject | undefined)[]
  agree: boolean
}

interface FileObject {
  file: string
  fileName?: string
  fileType: string
}

interface FindLogoName {
  data: LogoName[]
  page: string
  size: string
  total: number
  code: number
  message: string
}

interface LogoNameDetail {
  id: number
  logoName: string
  logoType: string
  website: string
  logo: Logo[]
  code: number
  message: string
}

interface LogoName {
  id: number
  logoName: string
  logoType: string
  website: string
  downloadTotalNum: number
  logo: Logo[]
}

interface Logo {
  id: number
  logoNameId: number
  file: string
  fileName: string
  fileType: string
  authorAddress: string
  status: string
  downloadNum: number
  favoritesNum: number
  isFavorite?: boolean
  favoriteId?: number
}
