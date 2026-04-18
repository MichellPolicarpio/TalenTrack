import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["msnodesqlv8", "@react-pdf/renderer"],
};

export default nextConfig;
