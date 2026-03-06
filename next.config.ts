import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/meo",
  allowedDevOrigins: ["dev1.cdxsistemas.com.br"],
  images: {
    loaderFile: "./src/lib/image-loader.ts"
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "80mb"
    }
  },
  transpilePackages: ["next-swagger-doc", "react-swagger-ui", "yaml"],
  output: "standalone",
  reactStrictMode: false,
};

export default nextConfig;
