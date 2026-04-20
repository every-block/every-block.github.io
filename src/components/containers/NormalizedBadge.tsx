import { Badge } from "@/ui/Badge";

interface Props {
  description: string;
}

export function NormalizedBadge({ description }: Props) {
  return <Badge tone="green" label="NORMALIZED" description={description} />;
}
