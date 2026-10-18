import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/", destination: "/explore", permanent: false }];
  },
};

export default nextConfig;
