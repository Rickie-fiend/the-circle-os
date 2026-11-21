import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    CIRCLE_IMPRINT_HOSTED_REVIEW: (
      process.env.VERCEL_ENV === "preview" && process.env.VERCEL_GIT_COMMIT_REF === "paing-branch"
    ) ? "enabled" : "disabled",
  },
  outputFileTracingIncludes: {
    "/os/home/imprint-art/*": ["./docs/design/personal-imprint-color-v1-sori-{bone.png,coordinates.bin}"],
  },
  typescript: {
    tsconfigPath: "tsconfig.vercel.json",
  },
};

export default nextConfig;
