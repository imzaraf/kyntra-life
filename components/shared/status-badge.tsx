import { Badge } from "@/components/ui/badge";

export function StatusBadge({ label }: { label: string }) {
  return (
    <Badge
      variant="secondary"
      className="rounded-md bg-sage-soft font-normal text-forest capitalize"
    >
      {label.replace("_", " ")}
    </Badge>
  );
}
