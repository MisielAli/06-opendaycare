"use client";

import { useRef, useState } from "react";
import {
  fallbackAvatar,
  getEnrollmentLabel,
  kids,
  type AddKidFormValues,
  type TempKid,
} from "@/app/lib/kids";
import { AddKidModal } from "@/components/kids/AddKidModal";
import { KidsBrowser } from "@/components/kids/KidsBrowser";

export default function KidsPage() {
  const [temporaryKids, setTemporaryKids] = useState<TempKid[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  function closeModal() {
    setIsModalOpen(false);
    addButtonRef.current?.focus();
  }

  function handleSave(values: AddKidFormValues) {
    const [day, month, year] = values.birthDate.split("/");
    const firstAllergy = values.allergyTags.split(",").map((value) => value.trim()).find(Boolean);
    const createdAt = new Date();
    const newKid: TempKid = {
      id: `temp-${createdAt.getTime()}`,
      name: values.fullName || "Niño sin nombre",
      birthDate: `${year}-${month}-${day}`,
      room: values.room,
      enrollmentLabel: getEnrollmentLabel(createdAt),
      allergyLabel: firstAllergy?.toLocaleUpperCase("es"),
      allergyNotes: values.medicalNotes || undefined,
      ...fallbackAvatar,
      parents: [],
      createdAt,
    };

    setTemporaryKids((currentKids) => [newKid, ...currentKids]);
    closeModal();
  }

  return (
    <div className="mx-auto w-full max-w-[880px] px-6 pb-20 pt-16 md:px-10 md:pt-[34px]">
      <div className="mb-[22px] flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-primary">
            GESTIÓN
          </div>
          <h1 className="m-0 font-display text-[30px] font-semibold text-foreground">
            Niños
          </h1>
        </div>
        <button
          ref={addButtonRef}
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.7)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Agregar niño
        </button>
      </div>

      <KidsBrowser kids={[...temporaryKids, ...kids]} latestAddedKidId={temporaryKids[0]?.id} />
      {isModalOpen ? <AddKidModal onClose={closeModal} onSave={handleSave} /> : null}
    </div>
  );
}
