/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@discord-dashboard/ui",
    "@discord-dashboard/schema",
    "@discord-dashboard/builder",
  ],
  webpack: (config) => {
    // Resolve ESM style .js imports to their .ts source in transpiled packages.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".jsx": [".tsx", ".jsx"],
    }
    return config
  },
}

export default nextConfig
