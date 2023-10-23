interface FindLogoName {
  data: LogoName[]
  page: string
  size: string
  total: number
  code: number
  message: string
}

interface LogoName {
  id: number
  logoName: string
  logoType: string
  website: string
  logo: Logo[]
}

interface Logo {
  id: number
  logoNameId: number
  file: string
  authorAddress: string
  status: string
  downloadNum: number
  favoritesNum: number
}
