/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["placehold.co"],
    unoptimized: false,
    remotePatterns: [],
  },
  compiler: {
    styledComponents: true,
  },
};

module.exports = nextConfig;
