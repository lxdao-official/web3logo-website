export const formatNumWithK = (num: number): string => {
  return num > 1000 ? (num / 1000).toFixed(1) + 'K' : `${num}`
}

export const formateAddress = (address: string): string => {
  if (!address) return ''
  return address.substring(0, 6) + '...' + address.substring(address.length - 4)
}
