import type { NextConfig } from "next";

// PROD (Vercel) roda na raiz, DEV roda com basePath /meo
const isProd = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  basePath: isProd ? "" : "/meo",
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
