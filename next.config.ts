import type { NextConfig } from "next";

const deployment = process.env.VERCEL_ENV;
const branch = process.env.VERCEL_GIT_COMMIT_REF;
const hostedImprintReview = (deployment === "production" && branch === "main") ||
  (deployment === "preview" && branch === "paing-branch");

const nextConfig: NextConfig = {
  env: {
    CIRCLE_IMPRINT_HOSTED_REVIEW: hostedImprintReview ? "enabled" : "disabled",
  },
  outputFileTracingIncludes: {
    "/os/home/imprint-art/*": ["./docs/design/personal-imprint-color-v1-sori-{bone.png,coordinates.bin}"],
  },
  typescript: {
    tsconfigPath: "tsconfig.vercel.json",
  },
};

export default nextConfig;
