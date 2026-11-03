/** @type {import('next').NextConfig} */
const apiTarget = process.env.API_PROXY_TARGET?.replace(/\/+$/, '');

const nextConfig = {
  reactStrictMode: true,
  // API_PROXY_TARGET(예: https://allgym-api.onrender.com)이 있으면 /v1/* 요청을 백엔드로 전달
  async rewrites() {
    return apiTarget ? [{ source: '/v1/:path*', destination: `${apiTarget}/v1/:path*` }] : [];
  },
};

export default nextConfig;
