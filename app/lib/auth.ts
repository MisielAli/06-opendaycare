import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/utils/supabase/server";

const DEFAULT_DESTINATION = "/";
const INTERNAL_ORIGIN = "http://internal.local";

export type StaffIdentity = {
  id: string;
  fullName: string;
  initial: string;
  role: "staff";
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

export function getStaffIdentityFromClaims(
  claims: unknown,
): StaffIdentity | null {
  if (!isRecord(claims) || !isRecord(claims.app_metadata)) {
    return null;
  }

  const id = readNonEmptyString(claims.sub);
  if (!id || claims.app_metadata.role !== "staff") {
    return null;
  }

  const fullName =
    readNonEmptyString(claims.app_metadata.full_name) ?? "Personal";
  const initial = Array.from(fullName)[0]?.toLocaleUpperCase("es") ?? "P";

  return {
    id,
    fullName,
    initial,
    role: "staff",
  };
}

export function getSafeInternalDestination(destination: unknown): string {
  if (
    typeof destination !== "string" ||
    destination !== destination.trim() ||
    !destination.startsWith("/") ||
    destination.startsWith("//") ||
    destination.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(destination)
  ) {
    return DEFAULT_DESTINATION;
  }

  try {
    decodeURI(destination);

    const url = new URL(destination, INTERNAL_ORIGIN);
    if (url.origin !== INTERNAL_ORIGIN) {
      return DEFAULT_DESTINATION;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_DESTINATION;
  }
}

const getCurrentStaffIdentity = cache(async (): Promise<StaffIdentity | null> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();

    if (error || !data?.claims) {
      return null;
    }

    return getStaffIdentityFromClaims(data.claims);
  } catch {
    return null;
  }
});

export async function requireStaff(
  destination: string,
): Promise<StaffIdentity> {
  const identity = await getCurrentStaffIdentity();

  if (!identity) {
    const safeDestination = getSafeInternalDestination(destination);
    redirect(`/login?next=${encodeURIComponent(safeDestination)}`);
  }

  return identity;
}
