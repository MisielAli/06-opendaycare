"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  login,
  type LoginActionState,
  type LoginError,
} from "@/app/actions/auth";

type LoginFormProps = {
  next?: string;
  initialError?: LoginError;
};

const formErrorMessages: Record<LoginError, string> = {
  invalid_credentials: "Email o contraseña incorrectos.",
  unauthorized: "Esta cuenta no tiene acceso al área de personal.",
  service_unavailable: "No pudimos iniciar sesión. Intentá nuevamente.",
};

export function LoginForm({ next = "/", initialError }: LoginFormProps) {
  const initialState: LoginActionState = initialError
    ? { formError: initialError }
    : {};
  const [state, formAction, isPending] = useActionState(login, initialState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const emailError = state.fieldErrors?.email;
  const passwordError = state.fieldErrors?.password;
  const formErrorMessage = state.formError
    ? formErrorMessages[state.formError]
    : null;

  return (
    <form
      action={formAction}
      noValidate
      aria-busy={isPending}
      className="w-full"
    >
      <input type="hidden" name="next" value={next} />

      {formErrorMessage && (
        <p
          role="alert"
          className="mb-4 rounded-[12px] border border-primary/25 bg-primary/10 px-3.5 py-3 text-[13px] font-bold text-primary-deep"
        >
          {formErrorMessage}
        </p>
      )}

      <div className="mb-[18px]">
        <label
          htmlFor="login-email"
          className="mb-2 block text-[12px] font-extrabold tracking-[0.7px] text-text-muted"
        >
          EMAIL
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "login-email-error" : undefined}
          className="w-full rounded-[14px] border-[1.5px] border-[#eadfd0] bg-white px-4 py-3.5 text-[15px] text-foreground outline-none transition focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15"
        />
        {emailError && (
          <p id="login-email-error" className="mt-1.5 text-[13px] font-bold text-primary">
            {emailError}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="login-password"
          className="mb-2 block text-[12px] font-extrabold tracking-[0.7px] text-text-muted"
        >
          CONTRASEÑA
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          aria-invalid={Boolean(passwordError)}
          aria-describedby={passwordError ? "login-password-error" : undefined}
          className="w-full rounded-[14px] border-[1.5px] border-[#eadfd0] bg-white px-4 py-3.5 text-[15px] text-foreground outline-none transition placeholder:text-[#b6a99b] focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15"
        />
        {passwordError && (
          <p id="login-password-error" className="mt-1.5 text-[13px] font-bold text-primary">
            {passwordError}
          </p>
        )}
      </div>

      <div className="mb-5 mt-2.5 text-right">
        <button
          type="button"
          className="rounded text-[13.5px] font-bold text-primary-deep outline-none transition hover:text-primary focus-visible:ring-4 focus-visible:ring-primary/15"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-[15px] bg-gradient-to-b from-[#f4977e] to-[#ee8164] px-4 py-[15px] text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] outline-none transition hover:brightness-105 focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:brightness-100"
      >
        {isPending ? "Ingresando..." : "Iniciar sesión"}
      </button>

      <p className="mt-6 text-center text-[14.5px] text-text-muted">
        ¿Te invitó la guardería?{" "}
        <Link
          href="/activate-account"
          className="rounded font-extrabold text-primary-deep outline-none transition hover:text-primary focus-visible:ring-4 focus-visible:ring-primary/15"
        >
          Activá tu cuenta
        </Link>
      </p>
    </form>
  );
}
