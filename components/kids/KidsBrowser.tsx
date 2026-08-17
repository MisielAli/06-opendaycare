"use client";

import { useState } from "react";
import { getAgeLabel, type Kid } from "@/app/lib/kids";
import { KidCard } from "./KidCard";

export function KidsBrowser({ kids }: { kids: Kid[] }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const filteredKids = kids.filter((kid) =>
    kid.name.toLocaleLowerCase("es").includes(normalizedQuery),
  );

  return (
    <>
      <label className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-border-soft bg-card px-4 py-3">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#B0A290"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="sr-only">Buscar niño</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar niño…"
          className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-foreground outline-none placeholder:text-[#B6A99B]"
        />
      </label>

      <div className="mb-3.5 flex items-center gap-3">
        <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-foreground">
          SALA SOLES
        </span>
        <span className="text-[13px] text-text-soft">8 niños</span>
        <span className="h-px flex-1 bg-divider" />
      </div>

      {filteredKids.length > 0 ? (
        <div className="grid grid-cols-2 gap-3.5">
          {filteredKids.map((kid) => (
            <KidCard key={kid.id} kid={kid} ageLabel={getAgeLabel(kid.birthDate)} />
          ))}
        </div>
      ) : (
        <p className="rounded-[14px] border border-border-soft bg-card px-4 py-6 text-center text-[14.5px] text-text-muted">
          No encontramos niños con ese nombre.
        </p>
      )}
    </>
  );
}
