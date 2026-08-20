import { ActivateAccountForm } from "@/components/auth/ActivateAccountForm";
import { BrandMark } from "@/components/auth/BrandMark";
import { createClient } from "@/utils/supabase/server";

interface PageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function ActivateAccountPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialCode = typeof params.code === "string" ? params.code.trim().toUpperCase() : "";
  let initialEmail = "";
  let codeError: string | undefined;

  if (initialCode) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_invitation_by_code", { p_code: initialCode });
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) {
      codeError = "Código inválido o expirado.";
    } else if (row.status !== "pending") {
      codeError = row.status === "accepted" ? "Esta invitación ya fue usada." : "Código inválido o expirado.";
    } else if (new Date(row.expires_at) <= new Date()) {
      codeError = "Código inválido o expirado.";
    } else {
      initialEmail = row.email ?? "";
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-auth-background px-6 py-10 sm:px-10">
      <div className="w-full max-w-[440px]">
        <div className="mb-[22px] flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-gradient-to-br from-[#f8c3a8] to-[#f2937a] text-white shadow-[0_12px_26px_-10px_rgba(238,129,100,.65)]">
          <BrandMark size={30} />
        </div>

        <h1 className="mb-2 font-display text-[32px] leading-[1.15] font-semibold text-foreground">
          Bienvenida a OpenDayCare
        </h1>
        <p className="mb-[26px] text-[15.5px] leading-[1.55] text-text-muted">
          Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar la cuenta.
        </p>

        <section className="mb-[22px] flex items-center gap-3.5 rounded-[16px] border-[1.5px] border-auth-input-border bg-white px-4 py-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-avatar-blue-bg font-display text-[19px] font-semibold text-avatar-blue-fg">
            M
          </div>
          <div>
            <p className="text-[13px] text-text-muted">Te invitaron a seguir a</p>
            <p className="font-display text-[17px] font-semibold text-foreground">
              Mateo · Sala Soles
            </p>
          </div>
        </section>

        <ActivateAccountForm initialCode={initialCode} initialEmail={initialEmail} codeError={codeError} />
      </div>
    </main>
  );
}
