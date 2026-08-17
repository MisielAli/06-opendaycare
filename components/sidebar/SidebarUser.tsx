import { Avatar } from "@/components/shared/Avatar";
import { sidebarTexts } from "@/app/lib/navigation";

export function SidebarUser() {
  return (
    <div className="mt-2.5 border-t border-border-soft pt-3.5">
      <div className="flex items-center gap-[11px] px-2 py-1.5">
        <Avatar variant="warm" initial="C" size={38} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-extrabold text-foreground">
            {sidebarTexts.userName}
          </div>
          <div className="text-xs text-text-soft">{sidebarTexts.userRole}</div>
        </div>
        <button
          type="button"
          title={sidebarTexts.logoutTitle}
          aria-label={sidebarTexts.logoutTitle}
          className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-background text-text-muted"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </div>
    </div>
  );
}
