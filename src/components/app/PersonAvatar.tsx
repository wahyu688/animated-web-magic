import { avatarTone, initialsOf } from "@/lib/task-meta";
import { toneClasses } from "@/lib/tones";
import { cn } from "@/lib/utils";

interface PersonAvatarProps {
  name: string | null | undefined;
  /** Used for the stable tint; defaults to the name. */
  id?: string | null;
  size?: number;
  className?: string;
}

/** Soft-tinted initials avatar for teammates (task assignees, members, comments). */
export default function PersonAvatar({ name, id, size = 22, className }: PersonAvatarProps) {
  const tone = toneClasses[avatarTone(id ?? name)];
  return (
    <span
      title={name ?? undefined}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold", tone.soft, tone.text, className)}
      style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.4)) }}
    >
      {initialsOf(name)}
    </span>
  );
}
