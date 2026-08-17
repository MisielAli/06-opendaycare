import { postTypeLabels, postTypeStyles, type PostType } from "@/app/lib/posts";

interface TypeBadgeProps {
  type: PostType;
}

export function TypeBadge({ type }: TypeBadgeProps) {
  return (
    <span
      className="flex items-center gap-[7px] rounded-full px-3 py-1.5"
      style={postTypeStyles[type]}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: postTypeStyles[type].color }} />
      <span className="text-xs font-extrabold uppercase tracking-[0.5px]">
        {postTypeLabels[type]}
      </span>
    </span>
  );
}
