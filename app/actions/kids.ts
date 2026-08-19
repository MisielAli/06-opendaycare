"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";

export interface AddKidActionState {
  status: "idle" | "success" | "error";
  fieldErrors?: {
    fullName?: string;
    birthDate?: string;
    roomId?: string;
  };
  formError?: string;
}

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function addKid(
  _previousState: AddKidActionState,
  formData: FormData,
): Promise<AddKidActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const birthDate = String(formData.get("birthDate") ?? "").trim();
  const roomId = String(formData.get("roomId") ?? "").trim();
  const allergyTagsRaw = String(formData.get("allergyTags") ?? "");
  const medicalNotes = String(formData.get("medicalNotes") ?? "").trim();

  const fieldErrors: NonNullable<AddKidActionState["fieldErrors"]> = {};

  if (!fullName) {
    fieldErrors.fullName = "Ingresa el nombre completo.";
  }

  if (!birthDate) {
    fieldErrors.birthDate = "Ingresa la fecha de nacimiento.";
  } else if (!isoDatePattern.test(birthDate) || birthDate > todayIsoDate()) {
    fieldErrors.birthDate = "Ingresa una fecha válida que no sea futura.";
  }

  if (!roomId) {
    fieldErrors.roomId = "Selecciona una sala.";
  } else if (!uuidPattern.test(roomId)) {
    fieldErrors.roomId = "La sala seleccionada no es válida.";
  }

  if (fieldErrors.fullName || fieldErrors.birthDate || fieldErrors.roomId) {
    return { status: "error", fieldErrors };
  }

  const allergyTags = allergyTagsRaw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const supabase = await createClient();
  const { error } = await supabase.from("children").insert({
    room_id: roomId,
    full_name: fullName,
    birth_date: birthDate,
    allergy_tags: allergyTags.length > 0 ? allergyTags : null,
    medical_notes: medicalNotes || null,
  });

  if (error) {
    if (error.code === "23514") {
      return {
        status: "error",
        fieldErrors: {
          birthDate: "Ingresa una fecha válida que no sea futura.",
        },
      };
    }

    return {
      status: "error",
      formError:
        "No pudimos guardar el niño. Verificá los datos e intentá de nuevo.",
    };
  }

  revalidatePath("/kids");
  return { status: "success" };
}
