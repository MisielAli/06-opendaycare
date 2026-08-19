import { requireStaff } from "@/app/lib/auth";
import { formatBirthDate, getAgeLabel, kids } from "@/app/lib/kids";
import { AllergyAlert } from "@/components/kids/AllergyAlert";
import { ParentsPanel } from "@/components/kids/ParentsPanel";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamicParams = false;

export function generateStaticParams() {
  return kids.map((kid) => ({ id: kid.id }));
}

export default async function KidProfilePage(props: PageProps<"/kids/[id]">) {
  const { id } = await props.params;
  await requireStaff(`/kids/${encodeURIComponent(id)}`);

  const kid = kids.find((candidate) => candidate.id === id);

  if (!kid) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-[820px] px-6 pb-20 pt-16 md:px-10 md:pt-[34px]">
      <Link
        href="/kids"
        className="mb-5 flex items-center gap-[7px] text-[14px] font-bold text-text-muted"
      >
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
          <path d="m15 18-6-6 6-6" />
        </svg>
        Volver a Niños
      </Link>

      <div className="flex flex-col items-start gap-[26px] lg:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-[18px]">
          <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-[18px] sm:flex sm:items-center">
            <div
              className="flex h-[84px] w-[84px] flex-none items-center justify-center rounded-full font-display text-[34px] font-semibold"
              style={{ backgroundColor: kid.avatarColor, color: kid.avatarTextColor }}
            >
              {kid.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="m-0 font-display text-[28px] font-semibold text-foreground sm:truncate">
                {kid.name}
              </h1>
              <p className="mt-[3px] text-[15px] text-text-muted">
                {getAgeLabel(kid.birthDate)} · Sala {kid.room}
              </p>
            </div>
            <button
              type="button"
              className="col-start-2 justify-self-start rounded-[12px] border-[1.5px] border-border-soft bg-card px-4 py-[9px] text-[14px] font-bold text-nav-text sm:col-auto"
            >
              Editar
            </button>
          </div>

          <AllergyAlert notes={kid.allergyNotes} />

          <div className="overflow-hidden rounded-2xl border border-border-soft bg-card">
            <ProfileRow label="Fecha de nacimiento" value={formatBirthDate(kid.birthDate)} />
            <ProfileRow label="Sala" value={kid.room} />
            <ProfileRow label="Ingreso" value={kid.enrollmentLabel} isLast />
          </div>
        </div>

        <div className="flex w-full flex-none flex-col gap-3.5 lg:w-[300px]">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-foreground p-[13px] text-[15px] font-extrabold text-white"
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
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
            Resumen del día
          </button>
          <ParentsPanel kidName={kid.name} parents={kid.parents} />
        </div>
      </div>
    </div>
  );
}

function ProfileRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <div
      className={`flex justify-between px-[18px] py-[15px] text-[14.5px] ${
        isLast ? "" : "border-b border-divider-soft"
      }`}
    >
      <span className="text-text-muted">{label}</span>
      <span className="font-extrabold text-foreground">{value}</span>
    </div>
  );
}
