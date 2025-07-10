/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: [
        '@discord-dashboard/velo-theme',
    ]
};

module.exports = nextConfig;