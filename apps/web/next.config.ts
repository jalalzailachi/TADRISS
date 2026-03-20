import type { NextConfig } from "next";

import path from "path";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Automatically prevents the stray Macbook package-lock.json from poisoning the Linux path!
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
