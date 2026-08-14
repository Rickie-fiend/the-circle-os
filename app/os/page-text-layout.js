export function pageTextLayout({
  baseBodyHeight,
  lineHeight,
  mainHeight,
  opticalShift = 0,
}) {
  const threeLines = lineHeight * 3;
  const centredHeight = Math.min(mainHeight, threeLines);

  return {
    bodyMinHeight: baseBodyHeight + Math.max(0, mainHeight - threeLines),
    mainTop: (baseBodyHeight - centredHeight) / 2 + opticalShift,
  };
}
