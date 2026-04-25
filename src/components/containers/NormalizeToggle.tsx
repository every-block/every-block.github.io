import { useNormalizeStore } from "@/stores/normalize-store";
import { Toggle } from "@/ui/Toggle";

export function NormalizeToggle() {
  const enabled = useNormalizeStore((s) => s.normalize);
  const toggle = useNormalizeStore((s) => s.toggle);
  return (
    <Toggle
      data-umami-event="view_normalize"
      active={enabled}
      onChange={() => toggle()}
      label="NORMALIZE"
      tone="green"
      title="Normalize supported charts against their baseline distribution"
    />
  );
}
