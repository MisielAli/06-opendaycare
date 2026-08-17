"use client";

import { useEffect, useRef, useState } from "react";
import type { LinkParentFormValues, ParentRole } from "@/app/lib/kids";

const initialValues: LinkParentFormValues = {
  fullName: "",
  email: "",
  roleLabel: "Mamá",
};

const parentRoles: ParentRole[] = ["Mamá", "Papá", "Tutor/a"];

type FormErrors = Partial<Record<keyof LinkParentFormValues, string>>;

function validate(values: LinkParentFormValues): FormErrors {
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email);

  return {
    ...(values.fullName.trim() ? {} : { fullName: "Ingresa el nombre completo." }),
    ...(emailIsValid ? {} : { email: "Ingresa un email válido." }),
    ...(parentRoles.includes(values.roleLabel) ? {} : { roleLabel: "Selecciona un parentesco." }),
  };
}

interface LinkParentModalProps {
  kidName: string;
  openerRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onSubmit: (values: Pick<LinkParentFormValues, "fullName" | "roleLabel">) => void;
}

export function LinkParentModal({ kidName, openerRef, onClose, onSubmit }: LinkParentModalProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const nameInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const opener = openerRef.current;
    document.body.style.overflow = "hidden";
    nameInputRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [openerRef]);

  function updateValue<Key extends keyof LinkParentFormValues>(key: Key, value: LinkParentFormValues[Key]) {
    const nextValues = { ...values, [key]: value };
    setValues(nextValues);

    if (errors[key]) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [key]: validate(nextValues)[key],
      }));
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({ fullName: values.fullName.trim(), roleLabel: values.roleLabel });
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
      'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
        aria-labelledby="link-parent-title"
        aria-describedby="link-parent-description"
        onKeyDown={handleKeyDown}
        className="max-h-full w-full max-w-[480px] overflow-y-auto rounded-[24px] border border-border-soft bg-auth-background shadow-[0_20px_50px_-24px_rgba(63,54,46,.55)]"
      >
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex items-center justify-between border-b border-border-soft px-5 py-5 sm:px-[26px]">
            <div>
              <h2 id="link-parent-title" className="font-display text-[18px] font-semibold text-foreground">Vincular padre</h2>
              <p className="text-[13px] text-text-soft">a {kidName}</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Cerrar modal" className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-divider-soft text-text-muted focus-visible:outline-2 focus-visible:outline-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="m18 6-12 12M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-5 sm:p-[26px]">
            <p id="link-parent-description" className="mb-5 flex gap-[11px] rounded-[14px] bg-[#E3ECFB] px-4 py-[13px] text-[13.5px] leading-[1.45] text-[#3F5694]">
              <svg className="mt-px flex-none text-[#4E72C8]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
              Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de {kidName}.
            </p>

            <div className="mb-[18px]">
              <FieldLabel label="Nombre del padre/madre" htmlFor="parent-full-name" />
              <input ref={nameInputRef} id="parent-full-name" value={values.fullName} onChange={(event) => updateValue("fullName", event.target.value)} aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? "parent-full-name-error" : undefined} placeholder="Ej. Diego Fernández" className={inputClassName(errors.fullName)} />
              <FieldError id="parent-full-name-error" message={errors.fullName} />
            </div>

            <div className="mb-[18px]">
              <FieldLabel label="Email" htmlFor="parent-email" />
              <input id="parent-email" type="email" value={values.email} onChange={(event) => updateValue("email", event.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "parent-email-error" : undefined} placeholder="correo@ejemplo.com" className={inputClassName(errors.email)} />
              <FieldError id="parent-email-error" message={errors.email} />
            </div>

            <fieldset className="mb-5" aria-describedby={errors.roleLabel ? "parent-role-error" : undefined}>
              <legend className="mb-2.5 text-[12px] font-extrabold tracking-[0.7px] text-text-muted">PARENTESCO</legend>
              <div className="flex gap-[9px]" role="radiogroup" aria-label="Parentesco">
                {parentRoles.map((role) => (
                  <button key={role} type="button" role="radio" aria-checked={values.roleLabel === role} onClick={() => updateValue("roleLabel", role)} className={`flex-1 rounded-full border-[1.5px] px-2 py-[11px] text-[14px] font-extrabold focus-visible:outline-2 focus-visible:outline-primary ${values.roleLabel === role ? "border-[#9FB8EC] bg-[#CCD8F4] text-[#4E72C8]" : "border-border-soft bg-card text-nav-text"}`}>
                    {role}
                  </button>
                ))}
              </div>
              <FieldError id="parent-role-error" message={errors.roleLabel} />
            </fieldset>

            <div className="mb-5 rounded-[16px] border-[1.5px] border-dashed border-[#E6D08A] bg-[#FBF1D6] p-[18px] text-center">
              <div className="mb-2 text-[12px] font-extrabold tracking-[0.7px] text-[#A88526]">CÓDIGO DE INVITACIÓN</div>
              <div className="font-display text-[34px] font-semibold tracking-[7px] text-[#8A7234]">7K4P9</div>
              <div className="mt-1.5 text-[13px] text-[#A88526]">Vence en 7 días</div>
            </div>

            <button type="submit" className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-linear-to-b from-[#F4977E] to-[#EE8164] px-4 py-[14px] text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] focus-visible:outline-2 focus-visible:outline-primary">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></svg>
              Enviar invitación
            </button>
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
  return message ? <p id={id} className="mt-1.5 text-[13px] font-bold text-primary" role="alert">{message}</p> : null;
}

function inputClassName(hasError?: string) {
  return `w-full rounded-[14px] border-[1.5px] bg-white px-4 py-[13px] text-[15px] text-foreground outline-none placeholder:text-[#B6A99B] focus:border-primary ${hasError ? "border-primary" : "border-auth-input-border"}`;
}
