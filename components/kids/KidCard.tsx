import type { Kid } from "@/app/lib/kids";
import Link from "next/link";

function getParentsLabel(parentCount: number) {
  if (parentCount === 0) {
    return "sin padres vinculados";
  }

  return `${parentCount} ${parentCount === 1 ? "padre vinculado" : "padres vinculados"}`;
}

export function KidCard({
  kid,
  ageLabel,
  disableNavigation = false,
}: {
  kid: Kid;
  ageLabel: string;
  disableNavigation?: boolean;
}) {
  const hasAllergy = Boolean(kid.allergyLabel);
  const needsParentLink = kid.parents.length === 0;

  const content = (
    <>
      <div
        className="flex h-12 w-12 flex-none items-center justify-center rounded-full font-display text-[19px] font-semibold"
        style={{ backgroundColor: kid.avatarColor, color: kid.avatarTextColor }}
      >
        {kid.name[0]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-[16px] font-semibold text-foreground">
          {kid.name}
        </div>
        <div className="text-[13px] text-text-soft">
          {ageLabel} · {getParentsLabel(kid.parents.length)}
        </div>
      </div>
      {hasAllergy ? (
        <span className="flex-none rounded-full bg-[#FBD8CC] px-[9px] py-[5px] text-[11px] font-extrabold text-[#D9684A]">
          {kid.allergyLabel}
        </span>
      ) : needsParentLink ? (
        <span className="flex-none rounded-full bg-[#F9D2DE] px-[9px] py-[5px] text-[11px] font-extrabold text-[#C56486]">
          VINCULAR
        </span>
      ) : (
        <svg
          className="flex-none"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#CBB89F"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      )}
    </>
  );

  const className = "flex min-w-0 items-center gap-3.5 rounded-[18px] border border-border-soft bg-card p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,.5)]";

  if (disableNavigation) {
    return <div className={className}>{content}</div>;
  }

  return <Link href={`/kids/${kid.id}`} className={`${className} transition duration-150 hover:-translate-y-0.5 hover:border-[#F2A78E]`}>{content}</Link>;
}
