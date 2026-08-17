"use client";

import { feedTexts } from "@/app/lib/feed";
import { posts } from "@/app/lib/posts";
import { ComposerTrigger } from "@/components/feed/ComposerTrigger";
import { PostCard } from "@/components/feed/PostCard";
import { useStaff } from "@/components/staff/StaffProvider";

export default function FeedPage() {
  const { temporaryPosts, lastPublishedPostId } = useStaff();
  const feedPosts = [...temporaryPosts, ...posts];

  return (
    <div className="mx-auto w-full max-w-[760px] px-6 pb-20 md:px-10 md:pt-[34px]">
      <div className="mb-6 mt-16 md:mt-0">
        <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-primary">
          {feedTexts.kicker}
        </div>
        <h1 className="m-0 font-display text-[30px] font-semibold text-foreground">
          {feedTexts.greeting}
        </h1>
        <p className="mt-[5px] text-[14.5px] text-text-muted">
          {feedTexts.summary}
        </p>
      </div>

      <ComposerTrigger />

      <div className="mb-3.5 flex items-center gap-3.5">
        <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#8A7C6D]">
          {feedTexts.todaySeparator}
        </span>
        <span className="h-px flex-1 bg-divider" />
      </div>

      <div className="flex flex-col gap-4">
        {feedPosts.map((post) => (
          <PostCard key={post.id} post={post} focusOnMount={post.id === lastPublishedPostId} />
        ))}
      </div>
    </div>
  );
}
