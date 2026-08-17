export function AllergyAlert({ notes }: { notes?: string }) {
  if (!notes) {
    return (
      <div className="rounded-2xl border border-border-soft bg-card px-[18px] py-4">
        <div className="font-extrabold text-foreground">Alergias y notas</div>
        <div className="mt-0.5 text-[14.5px] text-text-muted">
          Sin alergias ni notas registradas.
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3.5 rounded-2xl bg-[#FBDAD6] px-[18px] py-4">
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-[#F4A8A0]">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      </div>
      <div>
        <div className="mb-0.5 text-[15px] font-extrabold text-[#C5413A]">
          Alergias y notas
        </div>
        <div className="text-[14.5px] leading-[1.5] text-[#B25249]">{notes}</div>
      </div>
    </div>
  );
}
