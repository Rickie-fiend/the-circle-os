export function pageTextLayout({
  baseBodyHeight,
  lineHeight,
  mainHeight,
}) {
  const threeLines = lineHeight * 3;

  return {
    bodyMinHeight: baseBodyHeight + Math.max(0, mainHeight - threeLines),
  };
}
