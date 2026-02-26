/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/nathan-range-sign-in-prototype-optimal' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/nathan-range-sign-in-prototype-optimal' : '',
}

module.exports = nextConfig
