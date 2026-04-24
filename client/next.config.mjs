/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/guide",
        destination: "/research-guide",
        permanent: true,
      },
      {
        source: "/guide/:path*",
        destination: "/research-guide",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
