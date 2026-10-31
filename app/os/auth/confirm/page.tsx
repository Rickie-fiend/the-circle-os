// The enclosing auth boundary consumes the one-use email link before mounting
// any personal state. A completed flow returns to the existing Today screen.
import { TodayExperience } from "../../circle-os-shell";

export default function ConfirmAccount() {
  return <TodayExperience />;
}
