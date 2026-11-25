export function isLogSyncPilot(host: string) {
  if (!["localhost", "127.0.0.1"].includes(host)) return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  switch (process.env.NEXT_PUBLIC_CIRCLE_LOG_SYNC) {
    case "pilot":
      return /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::[0-9]+)?$/.test(url);
    case "hosted-test":
      return /^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(url);
    default:
      return false;
  }
}
