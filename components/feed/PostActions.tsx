import { feedTexts } from "@/app/lib/feed";

interface PostActionsProps {
  likeCount: number;
  commentCount: number;
}

export function PostActions({ likeCount, commentCount }: PostActionsProps) {
  return (
    <div className="mt-4 flex items-center gap-[18px] border-t border-divider-soft pt-3.5">
      <span className="flex items-center gap-[7px] text-sm font-bold text-primary-soft">
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="#E0654A"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
        </svg>
        {likeCount}
      </span>
      <a
        href="#"
        className="flex items-center gap-[7px] text-sm font-bold text-text-muted"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
        </svg>
        {commentCount}
      </a>
      <span className="flex-1" />
      <a href="#" className="text-sm font-extrabold text-primary-deep">
        {feedTexts.editAction}
      </a>
    </div>
  );
}
