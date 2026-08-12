export type ButtonStyleId =
  | "default"
  | "ink-burst"
  | "soft-clay"
  | "liquid-capsule";
export type ButtonLifecycle =
  | "hidden"
  | "entering"
  | "ready"
  | "pressed"
  | "success"
  | "exiting";
export type ButtonLifecycleEvent =
  | "reveal"
  | "entry-complete"
  | "press"
  | "release"
  | "succeed"
  | "success-complete"
  | "preview-reset"
  | "exit-complete";

export const BUTTON_STYLE_IDS: readonly ButtonStyleId[];
export const BUTTON_STYLE_DEFINITIONS: Readonly<
  Record<
    ButtonStyleId,
    Readonly<{
      id: ButtonStyleId;
      name: string;
      world: string;
      tags: readonly string[];
      haptic: readonly number[];
    }>
  >
>;

export function normalizeButtonStyleId(value: unknown): ButtonStyleId | null;
export function shuffleButtonStyles(
  random?: () => number,
): ButtonStyleId[];
export function takeNextButtonStyle(
  queue?: ButtonStyleId[],
  previousStyleId?: ButtonStyleId | null,
  random?: () => number,
): { styleId: ButtonStyleId; queue: ButtonStyleId[] };
export function revealButtonStyle(
  currentStyleId?: ButtonStyleId | null,
  queue?: ButtonStyleId[],
  previousStyleId?: ButtonStyleId | null,
  random?: () => number,
): { styleId: ButtonStyleId; queue: ButtonStyleId[] };
export function reduceButtonLifecycle(
  state: ButtonLifecycle,
  event: ButtonLifecycleEvent,
): ButtonLifecycle;
export function canActivateButton(options?: {
  disabled?: boolean;
  committed?: boolean;
}): boolean;
export function buttonPressesToBreak(styleId?: string | null): number;
export function nextButtonDamage(damage?: number, pressesToBreak?: number): number;
export function isButtonBroken(damage?: number, pressesToBreak?: number): boolean;
export const BUTTON_ROTATION_STYLE_IDS: readonly string[];
