export function pageTextLayout(input: {
  baseBodyHeight: number;
  lineHeight: number;
  mainHeight: number;
  opticalShift?: number;
}): {
  bodyMinHeight: number;
  mainTop: number;
};
