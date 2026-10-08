import type { NextConfig } from "next";

// Publicado como site estático no GitHub Pages (https://<usuario>.github.io/<repositorio>/).
// O workflow de deploy define BASE_PATH="/<repositorio>"; localmente fica vazio.
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
