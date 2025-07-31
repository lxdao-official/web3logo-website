/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nftstorage.link',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      bufferutil: false,
      'utf-8-validate': false,
    }

    config.externals.push({
      bufferutil: 'bufferutil',
      'utf-8-validate': 'utf-8-validate',
      'pino-pretty': 'pino-pretty',
    })

    return config
  },
  transpilePackages: ['@mui/material', '@mui/system'],
}

module.exports = nextConfig
