// Synthetic visual controls only; these are not activity weights or day rules.
export const COLOR_GROUPS = Object.freeze(["starting", "notes", "thoughts", "routine", "log-week", "protocol"]);
const centers = [.04, .205, .365, .535, .705, .865];
const widths = [.105, .125, .095, .115, .13, .10];
const wrap = value => value - Math.round(value);
const smooth = value => { const q = Math.max(0, Math.min(1, value)); return q*q*q*(q*(q*6-15)+10); };
export function colorAreaWeight(group, t, u) {
  const index = COLOR_GROUPS.indexOf(group);
  if (index < 0 || !Number.isFinite(t) || !Number.isFinite(u)) throw new Error("Invalid bundle color coordinates.");
  const phase = index * 1.73;
  const center = centers[index] + .028*Math.sin(2*Math.PI*u+phase) + .013*Math.sin(6*Math.PI*u-.4+phase);
  const width = widths[index]*(.84+.13*Math.sin(4*Math.PI*u+phase)+.08*Math.cos(6*Math.PI*u-phase));
  const along = smooth(1-Math.abs(wrap(t-center))/width);
  const acrossCenter = .38+.14*Math.sin(2*Math.PI*t+phase)+.08*Math.cos(6*Math.PI*t-phase);
  const acrossWidth = .4+.06*Math.sin(4*Math.PI*t+phase);
  return along*smooth(1-Math.abs(wrap(u-acrossCenter))/acrossWidth);
}
export const COLOR_PRESETS = Object.freeze({
  bone: {}, input: { notes: .35 }, completion: { notes: .95 },
  mixed: { starting: .6, notes: .8, routine: .95, "log-week": .55, protocol: .7 },
  older: { starting: .16, notes: .22, routine: .26, "log-week": .15, protocol: .19 },
  busy: Object.fromEntries(COLOR_GROUPS.map(group => [group, .95])),
});
export function validateColorState(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) throw new Error("Color settings are unavailable.");
  for (const [key, value] of Object.entries(state)) if (!COLOR_GROUPS.includes(key) || !Number.isFinite(value) || value < 0 || value > 1) throw new Error("Color settings are invalid.");
  return state;
}
export function bundleColorAmount(state, t, u) {
  let value = 0;
  for (const [group, strength] of Object.entries(state)) value = Math.max(value, strength*colorAreaWeight(group,t,u));
  return value;
}
