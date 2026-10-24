import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/", has: [{ type: "host" as const, value: "admin.mindapp.icu" }], destination: "/admin", permanent: false }];
  },
  async headers() {
    const adminHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "Cache-Control", value: "private, no-store" },
    ];
    return [{ source: "/admin/:path*", headers: adminHeaders }, { source: "/api/admin/:path*", headers: adminHeaders }];
  },
};

export default nextConfig;
