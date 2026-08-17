import { Avatar } from "@/components/shared/Avatar";
import { feedTexts } from "@/app/lib/feed";

export function ComposerTrigger() {
  return (
    <button
      type="button"
      className="mb-6 flex items-center gap-3.5 rounded-[18px] border border-border-soft bg-card px-[18px] py-3.5 shadow-[0_4px_14px_-10px_rgba(120,90,60,.4)]"
    >
      <Avatar variant="warm" initial="C" size={40} />
      <span className="flex-1 text-[15px] text-text-soft">
        {feedTexts.composerPlaceholder}
      </span>
      <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-highlight text-primary-soft">
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </span>
    </button>
  );
}
