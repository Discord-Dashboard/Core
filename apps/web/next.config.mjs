/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@discord-dashboard/ui",
    "@discord-dashboard/schema",
    "@discord-dashboard/builder",
  ],
}

export default nextConfig
