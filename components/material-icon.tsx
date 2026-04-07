import { cn } from "@/lib/utils";

interface MaterialIconProps {
  name: string;
  filled?: boolean;
  className?: string;
}

export function MaterialIcon({ name, filled = false, className }: MaterialIconProps) {
  return (
    <span
      className={cn("material-symbols-outlined", className)}
      style={{ fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 500, 'GRAD' 0, 'opsz' 24` }}
    >
      {name}
    </span>
  );
}
