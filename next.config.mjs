/**
 * PersonaGrid Next.js 15 App Router Configuration
 * Architecture Philosophy: "Antigravity"
 *  - Enforces React Server Components (RSC) by default for zero-bundle-cost data fetching.
 *  - Prevents client-side PII token leakage via strict security headers.
 *  - Zero-latency API reverse proxying to FastAPI backend.
 *  - Uses native ESM (.mjs) to bypass experimental SWC config transpilation that triggers stale chunk loading errors.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,

  // Server Actions & RSC optimization in Next.js 15
  experimental: {
    // Optimizes package imports to eliminate dead barrel file bundling
    optimizePackageImports: ["lucide-react", "class-variance-authority", "clsx", "tailwind-merge"],
  },

  // Direct routes for Business Command Center access
  async redirects() {
    return [
      {
        source: "/business-center",
        destination: "/business",
        permanent: false,
      },
      {
        source: "/command-center",
        destination: "/business",
        permanent: false,
      },
      {
        source: "/command",
        destination: "/business",
        permanent: false,
      },
    ];
  },

  // Direct backend reverse proxying for seamless local dev and SSE streaming
  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: "/api/backend/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },

  // Strict Privacy & Security Headers to prevent token/PII leakage
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://grainy-gradients.vercel.app https://d8j0ntlcm91z4.cloudfront.net https://images.unsplash.com",
              "media-src 'self' data: blob: https://d8j0ntlcm91z4.cloudfront.net",
              "font-src 'self' data: https://fonts.gstatic.com",
              // Allow SSE and fetch connections to backend
              "connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 ws: wss:",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
