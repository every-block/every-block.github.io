import { useGroupStore } from "@/stores/group-store";
import { Toggle } from "@/ui/Toggle";

export function GroupToggle() {
  const enabled = useGroupStore((s) => s.group);
  const toggle = useGroupStore((s) => s.toggle);
  return (
    <Toggle
      active={enabled}
      onChange={() => toggle()}
      label="GROUP"
      tone="blue"
      title="Merge variant blocks (e.g. Stone Slab → Stone) into canonical groups for supported charts (Ungrouped blocks still visible)"
    />
  );
}
