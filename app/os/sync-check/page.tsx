import { notFound } from "next/navigation";
import { SyncCheckClient } from "./sync-check-client";

export default function SyncCheckPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <SyncCheckClient />;
}
