import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Ensure the messages folder is traced into the standalone build
  outputFileTracingIncludes: {
    '/**': ['./messages/**/*'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      // TODO: replace '84.8.223.50:3000' with the real production domain once DNS is configured
      allowedOrigins: ['84.8.223.50:3000', 'localhost:3000']
    },
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  silent: true,
  org: "tadriss",
  project: "tadriss-web",
  tunnelRoute: "/monitoring",
  disableLogger: true,
});
