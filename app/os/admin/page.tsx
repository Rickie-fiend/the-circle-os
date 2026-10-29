import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminAccessTokenMatches } from "./admin-access";
import { ChapterEditor } from "./chapter-editor";

export default async function CircleOSAdmin() {
  const cookieStore = await cookies();
  const authorized = adminAccessTokenMatches(
    cookieStore.get(ADMIN_COOKIE)?.value,
  );
  if (!authorized) {
    redirect("/os");
  }
  return <ChapterEditor />;
}
