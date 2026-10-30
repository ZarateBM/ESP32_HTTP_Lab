import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Deshabilitamos telemetría para entornos Docker / Dokploy
  poweredByHeader: false,
};

export default nextConfig;
