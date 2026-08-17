import type { PostType } from "@/app/lib/posts";
import { postTypeLabels } from "@/app/lib/posts";

const typeClasses: Record<PostType, string> = {
  achievement: "bg-badge-achievement-bg text-badge-achievement-fg",
  activity: "bg-badge-activity-bg text-badge-activity-fg",
  announcement: "bg-badge-announcement-bg text-badge-announcement-fg",
};

const dotClasses: Record<PostType, string> = {
  achievement: "bg-badge-achievement-fg",
  activity: "bg-badge-activity-fg",
  announcement: "bg-badge-announcement-fg",
};

interface TypeBadgeProps {
  type: PostType;
}

export function TypeBadge({ type }: TypeBadgeProps) {
  return (
    <span
      className={`flex items-center gap-[7px] rounded-full px-3 py-1.5 ${typeClasses[type]}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotClasses[type]}`} />
      <span className="text-xs font-extrabold uppercase tracking-[0.5px]">
        {postTypeLabels[type]}
      </span>
    </span>
  );
}
