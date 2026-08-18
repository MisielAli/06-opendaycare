import type { LoginError } from "@/app/actions/auth";
import { getSafeInternalDestination } from "@/app/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";
import { BrandMark } from "@/components/auth/BrandMark";

function getLoginError(
  error: string | string[] | undefined,
): LoginError | undefined {
  if (
    error === "invalid_credentials" ||
    error === "unauthorized" ||
    error === "service_unavailable"
  ) {
    return error;
  }

  return undefined;
}

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const query = await searchParams;
  const next = getSafeInternalDestination(query.next);
  const initialError = getLoginError(query.error);

  return (
    <main className="grid min-h-screen bg-auth-background lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#f6a98e] via-[#f2937a] to-[#ec7e62] px-[60px] py-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-[120px] -top-[140px] h-[420px] w-[420px] rounded-full bg-white/12" />
        <div className="absolute -bottom-[110px] -left-20 h-[300px] w-[300px] rounded-full bg-white/10" />

        <div className="relative flex items-center gap-[13px]">
          <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white/22">
            <BrandMark />
          </div>
          <span className="font-display text-[21px] font-semibold tracking-[0.5px]">
            OpenDayCare
          </span>
        </div>

        <div className="relative">
          <h1 className="mb-[18px] font-display text-[42px] leading-[1.12] font-semibold">
            El día de cada niño,
            <br />
            compartido con su familia.
          </h1>
          <p className="max-w-[430px] text-[17px] leading-[1.6] text-white/92">
            Publicá momentos, gestioná las salas y mantené a las familias cerca,
            desde un solo lugar.
          </p>
        </div>

        <p className="relative text-[14px] text-white/90">Guardería Sala Soles</p>
      </section>

      <section className="flex items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-[392px]">
          <h1 className="mb-1.5 font-display text-[30px] font-semibold text-foreground">
            Iniciar sesión
          </h1>
          <p className="mb-7 text-[15px] text-text-muted">
            Ingresá para ver el día de hoy.
          </p>
          <LoginForm next={next} initialError={initialError} />
        </div>
      </section>
    </main>
  );
}
