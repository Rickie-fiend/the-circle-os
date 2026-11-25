import { readFile } from "node:fs/promises";
import { asAccount, database } from "./writing-cloud.mjs";

export async function chapterSyncDatabase(chapters) {
  const db = await database();
  try {
    await db.exec(`
      create table public.circle_content_items(id text primary key, kind text not null);
      create table public.circle_content_versions(
        id text not null, version integer not null, content jsonb not null, primary key(id, version)
      );
    `);
    for (const chart of chapters) {
      await db.query("insert into public.circle_content_items values ($1,'chapter') on conflict do nothing", [chart.id]);
      await db.query("insert into public.circle_content_versions values ($1,$2,$3)", [chart.id, chart.version, { kind: "chapter", chapter: chart }]);
    }
    await db.exec(await readFile(new URL("../../supabase/migrations/20261123153452_chapter_run_sync.sql", import.meta.url), "utf8"));
    return db;
  } catch (error) {
    await db.close();
    throw error;
  }
}

export function chapterExchange(db, account, owner = account, operation = null, role = "authenticated") {
  return asAccount(db, account, async tx =>
    (await tx.query("select public.circle_chapter_sync($1,$2) as result", [owner, operation])).rows[0].result, role);
}
