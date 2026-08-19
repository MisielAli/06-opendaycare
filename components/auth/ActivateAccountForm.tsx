"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { acceptInvitation } from "@/app/actions/invitations";

type ActivationErrors = {
  invitationCode?: string;
  email?: string;
  password?: string;
  photoConsent?: string;
  general?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ActivateAccountForm({ initialCode = "" }: { initialCode?: string }) {
  const router = useRouter();
  const [invitationCode, setInvitationCode] = useState(initialCode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [photoConsent, setPhotoConsent] = useState(true);
  const [errors, setErrors] = useState<ActivationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: ActivationErrors = {};

    if (!invitationCode.trim()) {
      nextErrors.invitationCode = "Ingresá el código de invitación.";
    }

    if (!emailPattern.test(email)) {
      nextErrors.email = "Ingresá un email válido.";
    }

    if (!password) {
      nextErrors.password = "Creá una contraseña.";
    }

    if (!photoConsent) {
      nextErrors.photoConsent = "Necesitás autorizar el consentimiento de fotos.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await acceptInvitation({
        code: invitationCode.trim().toUpperCase(),
        email: email.trim(),
        password,
      });
      router.push("/login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo activar la cuenta.";
      if (message.includes("Código inválido") || message.includes("inválido o expirado")) {
        setErrors((prev) => ({ ...prev, invitationCode: "Código inválido o expirado." }));
      } else if (message.includes("ya fue usada") || message.includes("invitation_not_pending")) {
        setErrors((prev) => ({ ...prev, invitationCode: "Esta invitación ya fue usada." }));
      } else if (message.includes("email válido")) {
        setErrors((prev) => ({ ...prev, email: message }));
      } else if (message.includes("contraseña")) {
        setErrors((prev) => ({ ...prev, password: message }));
      } else {
        setErrors((prev) => ({ ...prev, general: message }));
      }
      setIsSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="w-full">
      <div className="mb-[18px]">
        <label
          htmlFor="invitation-code"
          className="mb-2 block text-[12px] font-extrabold tracking-[0.7px] text-text-muted"
        >
          CÓDIGO DE INVITACIÓN
        </label>
        <input
          id="invitation-code"
          name="invitationCode"
          value={invitationCode}
          onChange={(event) => setInvitationCode(event.target.value.toUpperCase())}
          aria-invalid={Boolean(errors.invitationCode)}
          aria-describedby={errors.invitationCode ? "invitation-code-error" : undefined}
          className="w-full rounded-[14px] border-[1.5px] border-auth-input-border bg-white px-4 py-3.5 font-display text-[18px] font-bold tracking-[3px] text-foreground outline-none transition focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15"
        />
        {errors.invitationCode && (
          <p id="invitation-code-error" className="mt-1.5 text-[13px] font-bold text-primary" role="alert">
            {errors.invitationCode}
          </p>
        )}
      </div>

      <div className="mb-[18px]">
        <label
          htmlFor="activation-email"
          className="mb-2 block text-[12px] font-extrabold tracking-[0.7px] text-text-muted"
        >
          EMAIL
        </label>
        <input
          id="activation-email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "activation-email-error" : undefined}
          className="w-full rounded-[14px] border-[1.5px] border-auth-input-border bg-white px-4 py-3.5 text-[15px] text-foreground outline-none transition focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15"
        />
        {errors.email && (
          <p id="activation-email-error" className="mt-1.5 text-[13px] font-bold text-primary" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      <div className="mb-[18px]">
        <label
          htmlFor="activation-password"
          className="mb-2 block text-[12px] font-extrabold tracking-[0.7px] text-text-muted"
        >
          CREAR CONTRASEÑA
        </label>
        <input
          id="activation-password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "activation-password-error" : undefined}
          className="w-full rounded-[14px] border-[1.5px] border-[#f2a78e] bg-white px-4 py-3.5 text-[15px] text-foreground outline-none transition focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15"
        />
        {errors.password && (
          <p id="activation-password-error" className="mt-1.5 text-[13px] font-bold text-primary" role="alert">
            {errors.password}
          </p>
        )}
      </div>

      <div className="mb-6">
        <label className="flex cursor-pointer items-start gap-3 rounded-[14px] bg-[#fbf1d6] px-4 py-3.5 text-[#8a7234] has-[input:focus-visible]:ring-4 has-[input:focus-visible]:ring-primary/15">
          <input
            name="photoConsent"
            type="checkbox"
            checked={photoConsent}
            onChange={(event) => setPhotoConsent(event.target.checked)}
            aria-invalid={Boolean(errors.photoConsent)}
            aria-describedby={errors.photoConsent ? "photo-consent-error" : undefined}
            className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer rounded-[8px] accent-[#5fb97e] outline-none"
          />
          <span className="text-[14px] leading-[1.45]">
            Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app.
          </span>
        </label>
        {errors.photoConsent && (
          <p id="photo-consent-error" className="mt-1.5 text-[13px] font-bold text-primary" role="alert">
            {errors.photoConsent}
          </p>
        )}
      </div>

      {errors.general ? (
        <p className="mb-4 rounded-[12px] bg-[#FBEDEC] px-4 py-3 text-[13.5px] font-bold text-primary" role="alert">
          {errors.general}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-[15px] bg-gradient-to-b from-[#f4977e] to-[#ee8164] px-4 py-[15px] text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] outline-none transition hover:brightness-105 focus-visible:ring-4 focus-visible:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Activando..." : "Activar mi cuenta"}
      </button>

      <p className="mt-[22px] text-center text-[14.5px] text-text-muted">
        ¿Ya tenés cuenta?{" "}
        <Link
          href="/login"
          className="rounded font-extrabold text-primary-deep outline-none transition hover:text-primary focus-visible:ring-4 focus-visible:ring-primary/15"
        >
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
