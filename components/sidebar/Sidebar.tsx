"use client";

import { useState } from "react";
import { sidebarTexts } from "@/app/lib/navigation";
import { SidebarNav } from "./SidebarNav";
import { SidebarUser } from "./SidebarUser";

function BrandMark() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menú"
        onClick={() => setIsOpen(true)}
        className={`fixed top-4 left-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl border border-border-soft bg-card text-foreground md:hidden ${
          isOpen ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col bg-card px-4 py-6 transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0 md:border-r md:border-border-soft ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start pb-[22px]">
          <button
            type="button"
            className="flex flex-1 items-center gap-[11px] px-2 pt-1"
          >
            <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[12px] bg-gradient-to-br from-[#F8C3A8] to-[#F2937A]">
              <BrandMark />
            </div>
            <div>
              <div className="font-display text-[17px] leading-none font-semibold text-foreground">
                {sidebarTexts.brandName}
              </div>
              <div className="mt-0.5 text-[11.5px] text-text-soft">
                {sidebarTexts.roomName}
              </div>
            </div>
          </button>
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setIsOpen(false)}
            className="mt-1 flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-background text-text-muted transition-colors hover:text-foreground md:hidden"
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
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          className="mb-[18px] flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] p-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.75)]"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          {sidebarTexts.newPostButton}
        </button>

        <SidebarNav />
        <SidebarUser />
      </aside>
    </>
  );
}
