import { Badge } from "../ui/Badge";

interface Props {
  description: string;
}

export function GroupedBadge({ description }: Props) {
  return <Badge tone="blue" label="GROUPED" description={description} />;
}
