export const formatNumWithK = (num: number): string => {
  return num > 1000 ? (num / 1000).toFixed(1) + 'K' : `${num}`
}

export const formateAddress = (address: string): string => {
  if (!address) return ''
  return address.substring(0, 6) + '...' + address.substring(address.length - 4)
}

export function debounce(func: (...args: any[]) => void, delay: number) {
  let timerId: any
  return function (...args: any[]) {
    if (timerId) {
      clearTimeout(timerId)
    }
    timerId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

export function getImg3DidStrFromUrl(url: string) {
  return url
  // if (!url) return url
  // const pattern = new RegExp(`\\b[a-zA-Z0-9]{59}\\b`, 'g')
  // const matches = url.match(pattern)
  // return matches && matches[0] ? `ipfs://${matches[0]}` : url
}
