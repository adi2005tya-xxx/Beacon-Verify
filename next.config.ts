import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse/mammoth touch the filesystem — keep them out of the client bundle
  serverExternalPackages: ["pdf-parse", "mammoth"],
};

export default nextConfig;
