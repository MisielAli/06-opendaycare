"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type LoginErrors = {
  email?: string;
  password?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("caro@opendaycare.com");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: LoginErrors = {};

    if (!emailPattern.test(email)) {
      nextErrors.email = "Ingresá un email válido.";
    }

    if (!password) {
      nextErrors.password = "Ingresá tu contraseña.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      router.push("/");
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="w-full">
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
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          className="w-full rounded-[14px] border-[1.5px] border-[#eadfd0] bg-white px-4 py-3.5 text-[15px] text-foreground outline-none transition focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15"
        />
        {errors.email && (
          <p id="login-email-error" className="mt-1.5 text-[13px] font-bold text-primary">
            {errors.email}
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
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "login-password-error" : undefined}
          className="w-full rounded-[14px] border-[1.5px] border-[#eadfd0] bg-white px-4 py-3.5 text-[15px] text-foreground outline-none transition placeholder:text-[#b6a99b] focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15"
        />
        {errors.password && (
          <p id="login-password-error" className="mt-1.5 text-[13px] font-bold text-primary">
            {errors.password}
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
        className="w-full rounded-[15px] bg-gradient-to-b from-[#f4977e] to-[#ee8164] px-4 py-[15px] text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] outline-none transition hover:brightness-105 focus-visible:ring-4 focus-visible:ring-primary/30"
      >
        Iniciar sesión
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
