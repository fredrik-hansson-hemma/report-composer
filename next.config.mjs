/** @type {import('next').NextConfig} */
const nextConfig = {
  // BlockNote and Highcharts are ESM-only packages that need transpiling
  transpilePackages: [
    "@blocknote/core",
    "@blocknote/react",
    "@blocknote/mantine",
  ],
  // Disable strict mode to avoid double-invoke issues with BlockNote editor init
  reactStrictMode: false,
};

export default nextConfig;
