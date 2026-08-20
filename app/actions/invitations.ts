"use server";

import "server-only";

import { Resend } from "resend";

import { ParentInvitationEmail } from "@/emails/ParentInvitation";
import {
  relationshipToDB,
  type InviteParentInput,
  type InviteParentResult,
} from "@/app/lib/invitations";
import { createClient } from "@/utils/supabase/server";

const CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 5;
const MAX_CODE_RETRIES = 5;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

function formatExpiresAt(date: Date): string {
  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export async function inviteParent(input: InviteParentInput): Promise<InviteParentResult> {
  const fullName = input.fullName.trim();
  const email = input.email.trim();
  const relationshipUI = input.relationship;
  const childId = input.childId.trim();

  if (!fullName) {
    throw new Error("Ingresa el nombre completo.");
  }
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("Ingresa un email válido.");
  }
  if (!(relationshipUI in relationshipToDB)) {
    throw new Error("Selecciona un parentesco.");
  }
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(childId)) {
    throw new Error("Niño inválido.");
  }

  const relationshipDB = relationshipToDB[relationshipUI];
  const normalizedEmail = email.toLowerCase();

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims) {
    throw new Error("No autenticado.");
  }
  const role = (claimsData.claims as Record<string, unknown> & { app_metadata?: Record<string, unknown> })?.app_metadata?.role;
  if (role !== "staff") {
    throw new Error("Solo staff puede invitar.");
  }
  const invitedBy = (claimsData.claims as { sub?: string }).sub;
  if (!invitedBy) {
    throw new Error("No autenticado.");
  }

  // Fetch child + room for email template
  const { data: child, error: childError } = await supabase
    .from("children")
    .select("id, full_name, room_id")
    .eq("id", childId)
    .maybeSingle();

  if (childError || !child) {
    throw new Error("Niño no encontrado.");
  }

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, name")
    .eq("id", (child as { room_id: string }).room_id)
    .maybeSingle();

  if (roomError || !room) {
    throw new Error("Sala no encontrada.");
  }

  const childName = (child as { full_name: string }).full_name;
  const roomName = (room as { name: string }).name;

  // Cancel previous pending invitations for same child+email
  await supabase
    .from("invitations")
    .update({ status: "cancelled" })
    .eq("child_id", childId)
    .eq("status", "pending")
    .ilike("email", normalizedEmail);

  // Generate code with retry on unique violation
  let lastError: unknown = null;
  let inserted: { code: string; expires_at: string } | null = null;

  for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt += 1) {
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("invitations")
      .insert({
        child_id: childId,
        invited_by: invitedBy,
        full_name: fullName,
        email: email,
        relationship: relationshipDB,
        code,
        status: "pending",
        expires_at: expiresAt,
      })
      .select("code, expires_at")
      .single();

    if (!error && data) {
      inserted = data as { code: string; expires_at: string };
      break;
    }

    // Unique violation on code -> retry
    const isUniqueViolation =
      (error as { code?: string })?.code === "23505" ||
      (error as { message?: string })?.message?.includes("unique") ||
      (error as { message?: string })?.message?.includes("duplicate");

    if (isUniqueViolation) {
      lastError = error;
      continue;
    }

    throw new Error((error as { message?: string })?.message ?? "No se pudo crear la invitación.");
  }

  if (!inserted) {
    throw new Error(
      (lastError as { message?: string })?.message ?? "No se pudo generar un código único."
    );
  }

  const code = inserted.code;
  const expiresAtRaw = inserted.expires_at;
  const expiresAtFormatted = formatExpiresAt(new Date(expiresAtRaw));

  // Send email via Resend (server-only, no rollback on failure)
  let emailSent = false;
  let emailError: string | undefined;

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    emailError = "RESEND_API_KEY no configurada.";
  } else {
    try {
      const resend = new Resend(resendApiKey);
      const { error: sendError } = await resend.emails.send({
        from: "OpenDaycare <onboarding@resend.dev>",
        to: email,
        subject: "Te invitaron a OpenDaycare",
        react: ParentInvitationEmail({
          childName,
          roomName,
          code,
          expiresAt: expiresAtFormatted,
        }),
      });
      if (sendError) {
        emailError = sendError.message ?? String(sendError);
      } else {
        emailSent = true;
      }
    } catch (err) {
      emailError = err instanceof Error ? err.message : String(err);
    }
  }

  return {
    code,
    expiresAt: expiresAtRaw,
    emailSent,
    emailError,
  };
}

export interface AcceptInvitationPayload {
  code: string;
  email: string;
  password: string;
}

export async function acceptInvitation(payload: AcceptInvitationPayload): Promise<{ childId: string }> {
  const code = payload.code.trim().toUpperCase();
  const email = payload.email.trim();
  const normalizedEmail = email.toLowerCase();
  const password = payload.password;

  if (!code) {
    throw new Error("Ingresá el código de invitación.");
  }
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("Ingresá un email válido.");
  }
  if (!password) {
    throw new Error("Creá una contraseña.");
  }

  const supabase = await createClient();

  // Try to get invitation context via helper RPC (SECURITY DEFINER, callable by anon)
  // If helper does not exist, fallback will use direct query (which may be blocked by RLS)
  let invitationContext: {
    child_id: string;
    daycare_id: string;
    full_name: string;
    relationship: string;
    status: string;
    expires_at: string;
  } | null = null;

  try {
    const { data, error } = await supabase.rpc("get_invitation_context", {
      p_code: code,
      p_email: normalizedEmail,
    });
    if (!error && data) {
      // data may be array or single object
      const row = Array.isArray(data) ? data[0] : data;
      if (row && row.child_id) {
        invitationContext = row as typeof invitationContext;
      }
    }
  } catch {
    // ignore, fallback below
  }

  // Fallback: try direct select (will work only if RLS allows or via service)
  if (!invitationContext) {
    // Attempt to fetch via supabase query; if RLS blocks, this will return null and we proceed to signUp attempt anyway
    try {
      const { data } = await supabase
        .from("invitations")
        .select("child_id, status, expires_at, full_name, relationship")
        .eq("code", code)
        .ilike("email", normalizedEmail)
        .maybeSingle();
      if (data) {
        const row = data as {
          child_id: string;
          status: string;
          expires_at: string;
          full_name: string;
          relationship: string;
        };
        // Need daycare_id via child -> room
        const { data: childRow } = await supabase
          .from("children")
          .select("room_id")
          .eq("id", row.child_id)
          .maybeSingle();
        let daycareId: string | null = null;
        if (childRow) {
          const { data: roomRow } = await supabase
            .from("rooms")
            .select("daycare_id")
            .eq("id", (childRow as { room_id: string }).room_id)
            .maybeSingle();
          if (roomRow) daycareId = (roomRow as { daycare_id: string }).daycare_id;
        }
        if (daycareId) {
          invitationContext = {
            child_id: row.child_id,
            daycare_id: daycareId,
            full_name: row.full_name,
            relationship: row.relationship,
            status: row.status,
            expires_at: row.expires_at,
          };
        }
      }
    } catch {
      // ignore
    }
  }

  // If we have context, early validate status/expiry to give friendly errors before auth
  if (invitationContext) {
    if (invitationContext.status !== "pending") {
      if (invitationContext.status === "accepted") throw new Error("Esta invitación ya fue usada.");
      if (invitationContext.status === "expired") throw new Error("Código inválido o expirado.");
      throw new Error("Código inválido o expirado.");
    }
    if (new Date(invitationContext.expires_at) <= new Date()) {
      throw new Error("Código inválido o expirado.");
    }
  } else {
    throw new Error("Código inválido o expirado.");
  }

  // Derive daycare_id and full_name for signUp
  const daycareIdForSignup = invitationContext.daycare_id;
  const fullNameForSignup = invitationContext.full_name;

  // Attempt signUp, if already exists then signIn
  let authUserId: string | null = null;

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        daycare_id: daycareIdForSignup,
        role: "parent",
        full_name: fullNameForSignup,
      },
    },
  });

  if (signUpError) {
    const msg = signUpError.message?.toLowerCase() ?? "";
    const alreadyExists =
      msg.includes("already registered") ||
      msg.includes("already exists") ||
      msg.includes("user already") ||
      signUpError.code === "user_already_exists";

    if (alreadyExists) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (signInError) {
        throw new Error("Email ya registrado. Verificá tu contraseña.");
      }
      authUserId = signInData.user?.id ?? null;
    } else {
      const lowerMsg = signUpError.message?.toLowerCase() ?? "";
      if (lowerMsg.includes("is invalid") || lowerMsg.includes("invalid") || lowerMsg.includes("email address")) {
        throw new Error("Ingresá un email válido. Usá un dominio real (ej. @gmail.com).");
      }
      throw new Error(signUpError.message);
    }
  } else {
    authUserId = signUpData.user?.id ?? null;
    // If email confirmation required, user may be null; try signIn
    if (!authUserId) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (!signInError && signInData.user) {
        authUserId = signInData.user.id;
      }
    }
  }

  // Now call the privileged RPC to link parent_children and mark accepted
  // Need fresh client with session cookies (already set via signUp/signIn)
  const authedSupabase = await createClient();
  const { data: rpcData, error: rpcError } = await authedSupabase.rpc("accept_invitation", {
    p_code: code,
    p_email: normalizedEmail,
  });

  if (rpcError) {
    const rpcMsg = (rpcError as { message?: string }).message ?? "";
    if (rpcMsg.includes("invitation_expired")) throw new Error("Código inválido o expirado.");
    if (rpcMsg.includes("invitation_not_pending")) throw new Error("Esta invitación ya fue usada.");
    if (rpcMsg.includes("invitation_not_found")) throw new Error("Código inválido o expirado.");
    if (rpcMsg.includes("not_authenticated")) throw new Error("No autenticado.");
    throw new Error(rpcMsg || "No se pudo aceptar la invitación.");
  }

  const childId = (rpcData as string) ?? invitationContext?.child_id ?? "";
  return { childId };
}
