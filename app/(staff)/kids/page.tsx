import { kids } from "@/app/lib/kids";
import { KidsBrowser } from "@/components/kids/KidsBrowser";

export default function KidsPage() {
  return (
    <div className="mx-auto w-full max-w-[880px] px-6 pb-20 pt-16 md:px-10 md:pt-[34px]">
      <div className="mb-[22px] flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-primary">
            GESTIÓN
          </div>
          <h1 className="m-0 font-display text-[30px] font-semibold text-foreground">
            Niños
          </h1>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.7)]"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Agregar niño
        </button>
      </div>

      <KidsBrowser kids={kids} />
    </div>
  );
}
