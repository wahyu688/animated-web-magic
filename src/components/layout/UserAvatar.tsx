import { cn } from "@/lib/utils";

interface UserAvatarProps {
  initials: string;
  size?: number;
  online?: boolean;
  className?: string;
}

/** Brand-gradient initials avatar for the signed-in user. */
export default function UserAvatar({ initials, size = 30, online = false, className }: UserAvatarProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full gradient-primary text-caption font-semibold text-white",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {initials}
      {online && (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-card" />
      )}
    </span>
  );
}
