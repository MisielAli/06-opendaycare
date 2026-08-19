"use client";

import { useRef, useState } from "react";
import {
  parentStatusLabels,
  pendingParentAvatarColor,
  type ParentLink,
} from "@/app/lib/kids-shared";
import { LinkParentModal } from "@/components/kids/LinkParentModal";

function getParentDetails(parent: ParentLink) {
  return parent.status === "active"
    ? `${parent.roleLabel} · activa`
    : `${parent.roleLabel} · invitación enviada`;
}

export function ParentsPanel({
  kidName,
  childId,
  parents,
}: {
  kidName: string;
  childId: string;
  parents: ParentLink[];
}) {
  const [pendingParents, setPendingParents] = useState<ParentLink[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  const displayedParents = [...parents, ...pendingParents];

  function handleInviteSuccess({ fullName, roleLabel }: { fullName: string; roleLabel: string }) {
    setPendingParents((currentParents) => [
      ...currentParents,
      { name: fullName, roleLabel, status: "pending", avatarColor: pendingParentAvatarColor },
    ]);
    // Keep modal open if email failed is handled inside modal; here we just add row
    // Modal will close itself on email success via onClose
  }

  return (
    <div className="rounded-2xl border border-border-soft bg-card px-[18px] py-4">
      <div className="mb-3.5 text-[12.5px] font-extrabold tracking-[0.8px] text-[#8A7C6D]">
        PADRES VINCULADOS
      </div>
      <div className="flex flex-col gap-3.5">
        {displayedParents.map((parent, index) => (
          <div key={`${parent.name}-${index}`} className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 flex-none items-center justify-center rounded-full font-display text-[16px] font-semibold text-white"
              style={{ backgroundColor: parent.avatarColor }}
            >
              {parent.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14.5px] font-extrabold text-foreground">
                {parent.name}
              </div>
              <div className="text-[12.5px] text-text-soft">
                {getParentDetails(parent)}
              </div>
            </div>
            <span
              className={`flex-none rounded-full px-[9px] py-1 text-[10.5px] font-extrabold ${
                parent.status === "active"
                  ? "bg-[#CFEBD8] text-[#3E9B6C]"
                  : "bg-[#F7E7A6] text-[#9A7B1E]"
              }`}
            >
              {parentStatusLabels[parent.status]}
            </span>
          </div>
        ))}
        <button
          ref={openerRef}
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="group flex items-center gap-3 pt-2 text-left transition-opacity duration-150 hover:opacity-80"
        >
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-[#B0A290] transition-colors duration-150 group-hover:border-primary group-hover:text-primary">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className="text-[14.5px] font-extrabold text-primary-deep transition-colors duration-150 group-hover:text-primary">
            Vincular otro padre
          </span>
        </button>
      </div>
      {isModalOpen ? (
        <LinkParentModal
          kidName={kidName}
          childId={childId}
          openerRef={openerRef}
          onClose={() => setIsModalOpen(false)}
          onSuccess={(values) => {
            handleInviteSuccess(values);
            // Close only if we still want to close; modal itself handles close on success with emailSent true
            // If email failed, modal keeps open but we already added pending row
            // To ensure modal closes on success, we check if modal still open and close after a tick if needed
            // The modal's onClose will be called internally on success; we just ensure state sync
          }}
        />
      ) : null}
    </div>
  );
}
