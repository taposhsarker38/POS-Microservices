/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove experimental.appDir as it's now stable in Next.js 15
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
