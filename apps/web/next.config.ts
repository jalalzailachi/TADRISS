import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

import { withSentryConfig } from "@sentry/nextjs";

// Host of the deployed app, derived from NEXT_PUBLIC_APP_URL when set (e.g. the
// Firebase App Hosting domain). Added to Server Action allowed origins so
// cross-origin POSTs from the production domain are accepted.
const appHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL).host
      : undefined;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  output: 'standalone',
  // Ensure the messages folder is traced into the standalone build
  outputFileTracingIncludes: {
    '/**': ['./messages/**/*'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      // Oracle IP kept until DNS cutover; the production domain is added
      // automatically from NEXT_PUBLIC_APP_URL (see apphosting.yaml).
      allowedOrigins: [
        '84.8.223.50:3000',
        'localhost:3000',
        ...(appHost ? [appHost] : []),
      ],
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
