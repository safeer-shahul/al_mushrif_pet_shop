import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // THIS IS THE KEY LINE - enables static export
  output: 'export',

  // API endpoint for your Laravel backend
  env: {
    NEXT_PUBLIC_API_URL: 'https://almushrifaquarium.com/api',
  },

  // Disable image optimization (required for static export)
  images: {
    unoptimized: true,
  },

  // Optional: adds .html to URLs
  trailingSlash: true,

  // Disable ESLint warnings during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Note: rewrites() doesn't work with output: 'export'
  // Static exports can't use rewrites, redirects, or headers
  // Remove or comment out if causing warnings
  // async rewrites() {
  //   return [
  //     {
  //       source: '/',
  //       destination: '/home',
  //     },
  //   ];
  // },
};

export default nextConfig;