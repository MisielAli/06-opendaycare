"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  getSafeInternalDestination,
  getStaffIdentityFromClaims,
} from "@/app/lib/auth";
import { createClient } from "@/utils/supabase/server";

export type LoginError =
  | "invalid_credentials"
  | "unauthorized"
  | "service_unavailable";

export type LoginActionState = {
  fieldErrors?: {
    email?: string;
    password?: string;
  };
  formError?: LoginError;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function login(
  previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  void previousState;

  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const email = typeof emailValue === "string" ? emailValue.trim() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";
  const fieldErrors: NonNullable<LoginActionState["fieldErrors"]> = {};

  if (!emailPattern.test(email)) {
    fieldErrors.email = "Ingresá un email válido.";
  }

  if (!password) {
    fieldErrors.password = "Ingresá tu contraseña.";
  }

  if (fieldErrors.email || fieldErrors.password) {
    return { fieldErrors };
  }

  const destination = getSafeInternalDestination(formData.get("next"));

  try {
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return {
        formError:
          signInError.code === "invalid_credentials"
            ? "invalid_credentials"
            : "service_unavailable",
      };
    }

    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    if (claimsError || !claimsData?.claims) {
      return { formError: "service_unavailable" };
    }

    if (!getStaffIdentityFromClaims(claimsData.claims)) {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // The account remains unauthorized even if Supabase cannot confirm sign-out.
      }

      return { formError: "unauthorized" };
    }

    revalidatePath("/", "layout");
  } catch {
    return { formError: "service_unavailable" };
  }

  redirect(destination);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });

  revalidatePath("/", "layout");
  redirect("/login");
}
