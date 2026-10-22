import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js"

const API = process.env.API_URL ?? "http://localhost:3001"

const transpilePackages = [
  "@asctane-dashboard/ui",
  "@asctane-dashboard/schema",
  "@asctane-dashboard/builder",
  "@asctane-dashboard/theme-default",
  "@asctane-dashboard/platform-discord",
]

// Resolve ESM style .js imports to their .ts source in transpiled packages.
const webpack = (config) => {
  config.resolve.extensionAlias = {
    ".js": [".ts", ".tsx", ".js"],
    ".jsx": [".tsx", ".jsx"],
  }
  return config
}

/** @type {(phase: string) => import('next').NextConfig} */
export default function nextConfig(phase) {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      reactStrictMode: true,
      // In development the API runs on its own port. Everything it serves lives
      // under /api, so this origin hands that whole prefix to it and the pages
      // can call /api on their own origin, as they do in the prebuilt app.
      async rewrites() {
        return [{ source: "/api/:path*", destination: `${API}/api/:path*` }]
      },
      transpilePackages,
      webpack,
    }
  }
  // The build is a static export: plain files in out/ that the API server
  // serves on its own port (see createDashboard), so a bot needs no Next.js
  // server and the browser never makes a cross origin call. Each route is a
  // folder with an index.html, next to the route's prefetch data.
  return {
    reactStrictMode: true,
    output: "export",
    trailingSlash: true,
    images: { unoptimized: true },
    transpilePackages,
    webpack,
  }
}
