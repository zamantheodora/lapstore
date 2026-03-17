import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: (() => {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
        {
          protocol: "https",
          hostname: "via.placeholder.com",
          pathname: "/**",
        },
        {
          protocol: "https",
          hostname: "source.unsplash.com",
          pathname: "/**",
        },
        {
          protocol: "https",
          hostname: "images.unsplash.com",
          pathname: "/**",
        },
        {
          protocol: "https",
          hostname: "www.notebookcheck.net",
          pathname: "/**",
        },
      ];

      if (!base) return patterns;

      try {
        const url = new URL(base);
        patterns.push({
          protocol: url.protocol.replace(":", "") as "http" | "https",
          hostname: url.hostname,
          port: url.port || undefined,
          pathname: "/**",
        });
        return patterns;
      } catch {
        return patterns;
      }
    })(),
  },
};

export default nextConfig;
