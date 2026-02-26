/** @type {import('next').NextConfig} */
const basePath = process.env.NODE_ENV === 'production' ? '/nathan-range-sign-in-prototype-optimal' : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: basePath,
  assetPrefix: basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
}

module.exports = nextConfig
