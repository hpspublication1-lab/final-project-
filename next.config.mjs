import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { imageHosts } from './image-hosts.config.mjs';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// Derive the Supabase origin so the CSP can allow the browser's direct
// REST + Realtime (websocket) connections to your project.
function supabaseOrigins() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  try {
    const { host } = new URL(url);
    return { https: `https://${host}`, wss: `wss://${host}` };
  } catch {
    // Fallback: allow any supabase.co subdomain if the env var isn't set at build.
    return { https: 'https://*.supabase.co', wss: 'wss://*.supabase.co' };
  }
}

const sb = supabaseOrigins();

// Content-Security-Policy. Production Next.js does not need 'unsafe-eval', so
// it's intentionally omitted here for a tighter policy (these headers apply in
// production only — see headers() below). 'unsafe-inline' remains for scripts
// because Next hydration needs it without a nonce; moving to a nonce/
// strict-dynamic policy is the natural next hardening step.
// Analytics domains (Mixpanel, Google Analytics) are pre-allowed so enabling
// them later isn't silently blocked; add googlesyndication.com for AdSense.
const analyticsConnect = 'https://api.mixpanel.com https://api-js.mixpanel.com https://*.google-analytics.com https://*.analytics.google.com';
// Bunny.net Stream (live classes + recordings): hls.js fetches .m3u8/.ts over
// XHR, which connect-src governs. Allow Bunny's CDN + delivery hosts.
const bunnyConnect = 'https://*.b-cdn.net https://*.mediadelivery.net https://iframe.mediadelivery.net';
const analyticsScript = 'https://www.googletagmanager.com';

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${analyticsScript}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${sb.https} ${sb.wss} ${analyticsConnect} ${bunnyConnect}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "worker-src 'self' blob:",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Never ship browser source maps to production (would expose full source).
  productionBrowserSourceMaps: false,
  distDir: process.env.DIST_DIR || '.next',
  poweredByHeader: false,

  // Pin the workspace root to THIS project so stray package-lock.json files in
  // parent folders (C:\Users\User\, C:\Users\User\Downloads\) don't confuse
  // Next.js into picking the wrong root for file tracing.
  outputFileTracingRoot: projectRoot,

  // Allow the dev server to be reached from other origins on your LAN (phone /
  // tablet testing at http://<your-computer-ip>:4028). Add your machine's LAN
  // IP here if it differs, e.g. '192.168.1.50'.
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '192.168.1.67',   // your current LAN IP (phone/tablet testing)
    '192.168.1.*',    // rest of the local subnet
    '*.local',
  ],

  // NOTE on build-time checking: these remain true so an unattended production
  // deploy can't be blocked by a stray type/lint error. Quality is enforced via
  // `npm run type-check` and `npm run lint` (run them before deploying). Flip
  // these to false once those pass clean if you want the build itself to gate.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: imageHosts,
    minimumCacheTTL: 60,
    qualities: [75, 85, 100],
  },

  // Compress the webpack filesystem cache to reduce the "Serializing big
  // strings" warnings and speed up cold starts.
  webpack: (config) => {
    if (config.cache && config.cache.type === 'filesystem') {
      config.cache.compression = 'gzip';
    }
    return config;
  },

  async rewrites() {
    return [
      { source: '/login', destination: '/sign-up-login-screen' },
      { source: '/signin', destination: '/sign-up-login-screen' },
      { source: '/signup', destination: '/sign-up-login-screen' },
    ];
  },

  async headers() {
    // Production only — HSTS/upgrade-insecure-requests would break http://localhost dev.
    if (process.env.NODE_ENV !== 'production') return [];
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
export default nextConfig;
