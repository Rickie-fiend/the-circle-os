import { logEntryWords } from "../log-history.js";

export type LogImprintTiming = { endAt: string; timeZone: string };
type LogBlock = Parameters<typeof logEntryWords>[0] & { imprintLog?: LogImprintTiming };
type LogDay = {
  timeBlocks: LogBlock[];
  logCorrections?: Record<string, { correctedAt: string; before: LogBlock; after: LogBlock }>;
};

export function captureLogImprint(day: string, start: string, end: string): LogImprintTiming | undefined {
  if (![start, end].every(time => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) || start === end) return;
  const target = new Date(`${day}T${end}:00Z`);
  if (!Number.isFinite(target.getTime())) return;
  if (start < "06:00") target.setUTCDate(target.getUTCDate() + 1);
  if (end < start) target.setUTCDate(target.getUTCDate() + 1);
  const wall = target.getTime();
  const local = new Date(target.toISOString().slice(0, -1));
  const offsets = new Set([-86_400_000, 0, 86_400_000].map(delta =>
    new Date(local.getTime() + delta).getTimezoneOffset()));
  const matches = [...offsets].map(offset => new Date(wall + offset * 60_000)).filter(candidate =>
    candidate.getTime() - candidate.getTimezoneOffset() * 60_000 === wall);
  if (matches.length !== 1) return;
  return { endAt: matches[0].toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
}

const hasWords = (block: LogBlock) => {
  const { title, moments } = logEntryWords(block);
  return Boolean(title || moments.length);
};

export function logImprintSources(days: Record<string, LogDay>) {
  const sources = [];
  for (const [day, record] of Object.entries(days)) {
    const read = (block: LogBlock, clearedAt?: string) => {
      if (!block.imprintLog || !block.createdAt || !hasWords(block)) return;
      const { endAt, timeZone } = block.imprintLog;
      const eligibleAt = Math.max(Date.parse(endAt), Date.parse(block.createdAt));
      if (!Number.isFinite(eligibleAt) || (clearedAt && Date.parse(clearedAt) < eligibleAt)) return;
      return { day, at: endAt, timeZone, eligibleAt, source: `log:${day}:${block.id}`, active: !clearedAt };
    };
    for (const block of record.timeBlocks) {
      const source = read(block);
      if (source) sources.push(source);
    }
    for (const receipt of Object.values(record.logCorrections ?? {})) {
      if (hasWords(receipt.after)) continue;
      const source = read(receipt.before, receipt.correctedAt);
      if (source) sources.push(source);
    }
  }
  return sources;
}
