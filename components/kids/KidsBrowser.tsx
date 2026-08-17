"use client";

import { useState } from "react";
import {
  getAgeLabel,
  roomOptions,
  type Kid,
} from "@/app/lib/kids";
import { KidCard } from "./KidCard";

export function KidsBrowser({ kids, latestAddedKidId }: { kids: Kid[]; latestAddedKidId?: string }) {
  const [search, setSearch] = useState({ query: "", latestAddedKidId });
  const query = search.latestAddedKidId === latestAddedKidId ? search.query : "";
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
          onChange={(event) => setSearch({ query: event.target.value, latestAddedKidId })}
          placeholder="Buscar niño…"
          className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-foreground outline-none placeholder:text-[#B6A99B]"
        />
      </label>

      {filteredKids.length > 0 ? (
        <div className="space-y-7">
          {roomOptions.map(({ name }) => {
            const roomKids = filteredKids.filter((kid) => kid.room === name);
            if (roomKids.length === 0) return null;

            return (
              <section key={name}>
                <div className="mb-3.5 flex items-center gap-3">
                  <h2 className="text-[12.5px] font-extrabold tracking-[0.8px] text-foreground">SALA {name.toUpperCase()}</h2>
                  <span className="text-[13px] text-text-soft">{roomKids.length} {roomKids.length === 1 ? "niño" : "niños"}</span>
                  <span className="h-px flex-1 bg-divider" />
                </div>
                <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                  {roomKids.map((kid) => <KidCard key={kid.id} kid={kid} ageLabel={getAgeLabel(kid.birthDate)} disableNavigation={kid.id.startsWith("temp-")} />)}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <p className="rounded-[14px] border border-border-soft bg-card px-4 py-6 text-center text-[14.5px] text-text-muted">
          No encontramos niños con ese nombre.
        </p>
      )}
    </>
  );
}
