import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminAccessToken } from "./admin-access";
import { ChapterEditor } from "./chapter-editor";

export default async function CircleOSAdmin() {
  const cookieStore = await cookies();
  const expected = adminAccessToken();
  const authorized = expected && cookieStore.get(ADMIN_COOKIE)?.value === expected;
  if (!authorized) {
    redirect("/os");
  }
  return <ChapterEditor />;
}
