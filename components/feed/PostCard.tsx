import type { Post } from "@/app/lib/posts";
import {
  audiencePrefixLabel,
  publishedByYouLabel,
} from "@/app/lib/posts";
import { Avatar } from "@/components/shared/Avatar";
import { TypeBadge } from "@/components/shared/TypeBadge";
import { PostActions } from "./PostActions";
import { PhotoPlaceholder } from "./PhotoPlaceholder";

const avatarVariantByType: Record<Post["type"], "blue" | "indigo"> = {
  achievement: "blue",
  activity: "blue",
  announcement: "indigo",
};

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="rounded-[20px] border border-border-soft bg-card px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
      <header className="mb-3.5 flex items-center gap-3">
        <Avatar
          variant={avatarVariantByType[post.type]}
          initial={post.avatarInitial}
        />
        <div className="flex-1">
          <div className="font-display text-[16.5px] font-semibold text-foreground">
            {post.authorName}
          </div>
          <div className="text-[12.5px] text-text-soft">
            {post.postedAtLabel} · {publishedByYouLabel}
          </div>
        </div>
        <TypeBadge type={post.type} />
      </header>
      <div className="mb-2.5 text-[12.5px] text-text-soft">
        {audiencePrefixLabel} {post.audienceLabel}
      </div>
      <p className="m-0 text-[15.5px] leading-[1.55] text-[#4A4038]">
        {post.content}
      </p>
      {post.photoLabel && <PhotoPlaceholder label={post.photoLabel} />}
      <PostActions
        likeCount={post.likeCount}
        commentCount={post.commentCount}
      />
    </article>
  );
}
