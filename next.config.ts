import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/meo",
  experimental: {
    serverActions: {
      bodySizeLimit: "80mb"
    }
  },
  transpilePackages: ["next-swagger-doc", "react-swagger-ui", "yaml"],
  output: "standalone",
};

export default nextConfig;
