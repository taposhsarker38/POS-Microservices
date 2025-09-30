// next.config.mjs (ES Modules version)
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
      {
        source: '/auth/:path*',
        destination: `${process.env.NEXT_PUBLIC_AUTH_URL}/api/v1/:path*`,
      },
    ];
  },
}

export default nextConfig;