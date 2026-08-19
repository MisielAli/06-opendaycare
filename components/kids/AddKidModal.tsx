"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addKid, type AddKidActionState } from "@/app/actions/kids";
import type { AddKidFormValues, RoomRecord } from "@/app/lib/kids-shared";

const initialValues: AddKidFormValues = {
  fullName: "",
  birthDate: "",
  roomId: "",
  allergyTags: "",
  medicalNotes: "",
};

const initialActionState: AddKidActionState = { status: "idle" };

type FormErrors = Partial<Record<"fullName" | "birthDate" | "roomId", string>>;

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(
    Boolean,
  );

  return parts.join("/");
}

function toIsoDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) {
    return "";
  }

  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function isValidBirthDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) {
    return false;
  }

  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day) &&
    date <= today
  );
}

function validate(values: AddKidFormValues): FormErrors {
  return {
    ...(values.fullName.trim() ? {} : { fullName: "Ingresa el nombre completo." }),
    ...(isValidBirthDate(values.birthDate)
      ? {}
      : { birthDate: "Ingresa una fecha válida que no sea futura." }),
    ...(values.roomId ? {} : { roomId: "Selecciona una sala." }),
  };
}

interface AddKidModalProps {
  rooms: RoomRecord[];
  onClose: () => void;
}

export function AddKidModal({ rooms, onClose }: AddKidModalProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [actionState, formAction, isPending] = useActionState(
    addKid,
    initialActionState,
  );
  const router = useRouter();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const serverFieldErrors =
    actionState.status === "error" ? actionState.fieldErrors ?? {} : {};
  const fullNameError = errors.fullName ?? serverFieldErrors.fullName;
  const birthDateError = errors.birthDate ?? serverFieldErrors.birthDate;
  const roomIdError = errors.roomId ?? serverFieldErrors.roomId;

  useEffect(() => {
    if (actionState.status !== "success") {
      return;
    }

    router.refresh();
    onClose();
  }, [actionState.status, onClose, router]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    nameInputRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function updateValue(key: keyof AddKidFormValues, value: string) {
    const nextValues = { ...values, [key]: value };
    setValues(nextValues);
    if (errors[key as keyof FormErrors]) {
      const fieldError = validate(nextValues)[key as keyof FormErrors];
      setErrors((currentErrors) => ({ ...currentErrors, [key]: fieldError }));
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      setErrors(nextErrors);
      return;
    }

    setErrors({});
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      onClose();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusableElements?.length) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#3F362E]/45 p-4 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-kid-title"
        onKeyDown={handleKeyDown}
        className="max-h-full w-full max-w-[520px] overflow-y-auto rounded-[24px] border border-border-soft bg-auth-background shadow-[0_20px_50px_-24px_rgba(63,54,46,.55)]"
      >
        <form onSubmit={handleSubmit} action={formAction} noValidate>
          <div className="flex items-center justify-between border-b border-border-soft px-5 py-5 sm:px-[26px]">
            <button type="button" onClick={onClose} className="text-[15px] font-bold text-text-muted focus-visible:rounded focus-visible:outline-2 focus-visible:outline-primary">
              Cancelar
            </button>
            <h2 id="add-kid-title" className="font-display text-[18px] font-semibold text-foreground">
              Agregar niño
            </h2>
            <button type="submit" disabled={isPending} className="text-[15px] font-extrabold text-primary focus-visible:rounded focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60">
              {isPending ? "Guardando…" : "Guardar"}
            </button>
          </div>

          <div className="space-y-[18px] p-5 sm:p-[26px]">
            {actionState.status === "error" && actionState.formError ? (
              <p role="alert" className="rounded-[14px] bg-[#FBD8CC] px-4 py-3 text-[13.5px] font-bold text-[#D9684A]">
                {actionState.formError}
              </p>
            ) : null}

            <FieldLabel label="Nombre completo" htmlFor="kid-full-name" />
            <input
              ref={nameInputRef}
              id="kid-full-name"
              name="fullName"
              value={values.fullName}
              onChange={(event) => updateValue("fullName", event.target.value)}
              aria-invalid={Boolean(fullNameError)}
              aria-describedby={fullNameError ? "kid-full-name-error" : undefined}
              placeholder="Ej. Martina López"
              className={inputClassName(fullNameError)}
            />
            <FieldError id="kid-full-name-error" message={fullNameError} />

            <div className="grid gap-[18px] sm:grid-cols-2 sm:gap-[14px]">
              <div>
                <FieldLabel label="Fecha de nacimiento" htmlFor="kid-birth-date" />
                <input
                  id="kid-birth-date"
                  inputMode="numeric"
                  value={values.birthDate}
                  onChange={(event) => updateValue("birthDate", formatDateInput(event.target.value))}
                  aria-invalid={Boolean(birthDateError)}
                  aria-describedby={birthDateError ? "kid-birth-date-error" : undefined}
                  placeholder="dd/mm/aaaa"
                  className={inputClassName(birthDateError)}
                />
                <FieldError id="kid-birth-date-error" message={birthDateError} />
                <input type="hidden" name="birthDate" value={toIsoDate(values.birthDate)} />
              </div>
              <div>
                <FieldLabel label="Sala" htmlFor="kid-room" />
                <select
                  id="kid-room"
                  name="roomId"
                  value={values.roomId}
                  onChange={(event) => updateValue("roomId", event.target.value)}
                  aria-invalid={Boolean(roomIdError)}
                  aria-describedby={roomIdError ? "kid-room-error" : undefined}
                  className={inputClassName(roomIdError)}
                >
                  <option value="" disabled>Seleccionar</option>
                  {rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
                </select>
                <FieldError id="kid-room-error" message={roomIdError} />
              </div>
            </div>

            <div>
              <FieldLabel label="Alergias (etiquetas)" htmlFor="kid-allergies" />
              <input
                id="kid-allergies"
                name="allergyTags"
                value={values.allergyTags}
                onChange={(event) => updateValue("allergyTags", event.target.value)}
                placeholder="Ej. Maní, Lactosa"
                className={inputClassName()}
              />
            </div>

            <div>
              <FieldLabel label="Notas médicas" htmlFor="kid-medical-notes" />
              <textarea
                id="kid-medical-notes"
                name="medicalNotes"
                value={values.medicalNotes}
                onChange={(event) => updateValue("medicalNotes", event.target.value)}
                placeholder="Indicaciones, medicación, contactos…"
                className={`${inputClassName()} min-h-[90px] resize-y leading-6`}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldLabel({ label, htmlFor }: { label: string; htmlFor: string }) {
  return <label htmlFor={htmlFor} className="mb-2 block text-[12px] font-extrabold tracking-[0.7px] text-text-muted">{label.toUpperCase()}</label>;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} className="mt-1.5 text-[13px] font-bold text-primary">{message}</p> : null;
}

function inputClassName(hasError?: string) {
  return `w-full rounded-[14px] border-[1.5px] bg-white px-4 py-[13px] text-[15px] text-foreground outline-none placeholder:text-[#B6A99B] focus:border-primary ${hasError ? "border-primary" : "border-auth-input-border"}`;
}
