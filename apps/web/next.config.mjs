const API = process.env.NEXT_PUBLIC_API ?? "http://localhost:3001"

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Everything the API serves lives under /api, so this origin can hand that
  // whole prefix to it. The login buttons rely on this for /api/auth/discord.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API}/api/:path*` }]
  },
  transpilePackages: [
    "@asctane-dashboard/ui",
    "@asctane-dashboard/schema",
    "@asctane-dashboard/builder",
    "@asctane-dashboard/theme-default",
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
