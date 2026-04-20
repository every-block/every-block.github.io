import { useNormalizeStore } from "../../state/normalizeStore";
import { Toggle } from "../ui/Toggle";

export function NormalizeToggle() {
  const enabled = useNormalizeStore((s) => s.normalize);
  const toggle = useNormalizeStore((s) => s.toggle);
  return (
    <Toggle
      active={enabled}
      onChange={() => toggle()}
      label="NORMALIZE"
      tone="green"
      title="Normalize supported charts against their baseline distribution"
    />
  );
}
