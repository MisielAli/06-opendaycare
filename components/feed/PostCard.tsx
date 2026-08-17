"use client";

import { useEffect, useRef } from "react";
import type { Post } from "@/app/lib/posts";
import {
  audiencePrefixLabel,
  publishedByYouLabel,
} from "@/app/lib/posts";
import { Avatar } from "@/components/shared/Avatar";
import { TypeBadge } from "@/components/shared/TypeBadge";
import { PostActions } from "./PostActions";
import { PhotoPlaceholder } from "./PhotoPlaceholder";
import { PostPhotoGrid } from "./PostPhotoGrid";

const avatarVariantByType: Record<Post["type"], "blue" | "indigo" | "meal" | "nap" | "mood" | "photo"> = {
  meal: "meal",
  nap: "nap",
  activity: "blue",
  achievement: "blue",
  mood: "mood",
  photo: "photo",
  announcement: "indigo",
};

interface PostCardProps {
  post: Post;
  focusOnMount?: boolean;
}

export function PostCard({ post, focusOnMount = false }: PostCardProps) {
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (focusOnMount) {
      cardRef.current?.focus();
    }
  }, [focusOnMount]);

  return (
    <article ref={cardRef} tabIndex={-1} className="rounded-[20px] border border-border-soft bg-card px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
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
      {post.photos?.length ? <PostPhotoGrid photos={post.photos} /> : null}
      {post.photoLabel && !post.photos?.length ? <PhotoPlaceholder label={post.photoLabel} /> : null}
      <PostActions
        likeCount={post.likeCount}
        commentCount={post.commentCount}
      />
    </article>
  );
}
