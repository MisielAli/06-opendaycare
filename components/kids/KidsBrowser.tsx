"use client";

import { useState } from "react";
import { getAgeLabel, type Kid, type RoomRecord } from "@/app/lib/kids-shared";
import { KidCard } from "./KidCard";

interface KidsBrowserProps {
  rooms: RoomRecord[];
  kids: Kid[];
}

export function KidsBrowser({ rooms, kids }: KidsBrowserProps) {
  const [search, setSearch] = useState("");
  const [collapsedRoomIds, setCollapsedRoomIds] = useState<string[]>([]);

  const normalizedQuery = search.trim().toLocaleLowerCase("es");
  const isSearching = normalizedQuery.length > 0;
  const filteredKids = kids.filter((kid) =>
    kid.name.toLocaleLowerCase("es").includes(normalizedQuery),
  );

  function toggleRoom(roomId: string) {
    setCollapsedRoomIds((currentIds) =>
      currentIds.includes(roomId)
        ? currentIds.filter((id) => id !== roomId)
        : [...currentIds, roomId],
    );
  }

  if (kids.length === 0 && !isSearching) {
    return (
      <p className="rounded-[14px] border border-border-soft bg-card px-4 py-6 text-center text-[14.5px] text-text-muted">
        Todavía no hay niños cargados. Tocá “Agregar niño” para dar de alta el
        primero.
      </p>
    );
  }

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
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar niño…"
          className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-foreground outline-none placeholder:text-[#B6A99B]"
        />
      </label>

      {filteredKids.length > 0 ? (
        <div className="space-y-7">
          {rooms.map((room) => {
            const roomKids = filteredKids.filter((kid) => kid.room === room.name);
            if (isSearching && roomKids.length === 0) return null;

            const isCollapsed = collapsedRoomIds.includes(room.id);
            const roomGridId = `room-kids-${room.id}`;

            return (
              <section key={room.id} aria-labelledby={`room-heading-${room.id}`}>
                <div className="mb-3.5 flex items-center gap-3">
                  <h2
                    id={`room-heading-${room.id}`}
                    className="text-[12.5px] font-extrabold tracking-[0.8px] text-foreground"
                  >
                    <button
                      type="button"
                      onClick={() => toggleRoom(room.id)}
                      aria-expanded={!isCollapsed}
                      aria-controls={roomGridId}
                      className="flex items-center gap-3 rounded focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      SALA {room.name.toUpperCase()}
                      <span className="text-[13px] font-normal tracking-normal text-text-soft">
                        {roomKids.length} {roomKids.length === 1 ? "niño" : "niños"}
                      </span>
                      <svg
                        className={`flex-none text-[#B0A290] transition-transform duration-150 ${isCollapsed ? "-rotate-90" : ""}`}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                  </h2>
                  <span className="h-px flex-1 bg-divider" />
                </div>
                <div
                  id={roomGridId}
                  className="grid grid-cols-1 gap-3.5 md:grid-cols-2"
                >
                  {!isCollapsed
                    ? roomKids.map((kid) => (
                        <KidCard
                          key={kid.id}
                          kid={kid}
                          ageLabel={getAgeLabel(kid.birthDate)}
                        />
                      ))
                    : null}
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
