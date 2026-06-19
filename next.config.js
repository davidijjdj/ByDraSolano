/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Suppress hydration warnings caused by browser extensions
  // This is a common issue with extensions like Bitdefender, antivirus, etc.
  // that inject attributes into the DOM
};

module.exports = nextConfig;
