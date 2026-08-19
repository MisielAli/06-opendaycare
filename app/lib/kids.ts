import "server-only";

import { cache } from "react";

import { createClient } from "@/utils/supabase/server";
import {
  fallbackAvatar,
  getEnrollmentLabel,
  type Kid,
  type KidRecord,
  type RoomRecord,
} from "@/app/lib/kids-shared";

export {
  formatBirthDate,
  getAgeLabel,
  roomOptions,
} from "@/app/lib/kids-shared";

interface RoomRow {
  id: string;
  name: string;
}

interface ChildRow {
  id: string;
  room_id: string;
  full_name: string;
  birth_date: string;
  enrolled_at: string;
  medical_notes: string | null;
  allergy_tags: string[] | null;
  photo_consent: boolean;
  status: "active" | "archived";
}

interface KidsAndRooms {
  rooms: RoomRecord[];
  kids: KidRecord[];
}

const loadActiveKidsAndRooms = cache(async (): Promise<KidsAndRooms> => {
  const supabase = await createClient();

  const [
    { data: roomsData, error: roomsError },
    { data: childrenData, error: childrenError },
  ] = await Promise.all([
    supabase.from("rooms").select("id, name").order("name", { ascending: true }),
    supabase
      .from("children")
      .select(
        "id, room_id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, photo_consent, status",
      )
      .eq("status", "active")
      .order("full_name", { ascending: true }),
  ]);

  if (roomsError) {
    throw new Error(`Could not load rooms: ${roomsError.message}`);
  }

  if (childrenError) {
    throw new Error(`Could not load children: ${childrenError.message}`);
  }

  const roomRows = (roomsData ?? []) as RoomRow[];
  const childRows = (childrenData ?? []) as ChildRow[];
  const roomNamesById = new Map(roomRows.map((room) => [room.id, room.name]));
  const kidCountByRoomId = new Map<string, number>();
  const kids: KidRecord[] = [];

  for (const child of childRows) {
    const roomName = roomNamesById.get(child.room_id);

    if (!roomName) {
      continue;
    }

    kids.push({
      id: child.id,
      fullName: child.full_name,
      birthDate: child.birth_date,
      roomName,
      enrolledAt: child.enrolled_at,
      allergyTags: child.allergy_tags ?? [],
      medicalNotes: child.medical_notes ?? null,
      photoConsent: child.photo_consent,
      status: child.status,
    });

    kidCountByRoomId.set(
      child.room_id,
      (kidCountByRoomId.get(child.room_id) ?? 0) + 1,
    );
  }

  const rooms: RoomRecord[] = roomRows.map((room) => ({
    id: room.id,
    name: room.name,
    kidCount: kidCountByRoomId.get(room.id) ?? 0,
  }));

  return { rooms, kids };
});

export async function getKids(): Promise<KidRecord[]> {
  const { kids } = await loadActiveKidsAndRooms();
  return kids;
}

export async function getRooms(): Promise<RoomRecord[]> {
  const { rooms } = await loadActiveKidsAndRooms();
  return rooms;
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getKidById(id: string): Promise<KidRecord | null> {
  if (!uuidPattern.test(id)) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("children")
    .select(
      "id, room_id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, photo_consent, status, rooms(name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const child = data as ChildRow & { rooms: { name: string }[] | null };
  const roomName = child.rooms?.[0]?.name;

  if (!roomName) {
    return null;
  }

  return {
    id: child.id,
    fullName: child.full_name,
    birthDate: child.birth_date,
    roomName,
    enrolledAt: child.enrolled_at,
    allergyTags: child.allergy_tags ?? [],
    medicalNotes: child.medical_notes ?? null,
    photoConsent: child.photo_consent,
    status: child.status,
  };
}

export function kidRecordToKid(record: KidRecord): Kid {
  return {
    id: record.id,
    name: record.fullName,
    birthDate: record.birthDate,
    room: record.roomName,
    enrollmentLabel: getEnrollmentLabel(
      new Date(`${record.enrolledAt}T00:00:00`),
    ),
    allergyLabel:
      record.allergyTags.length > 0
        ? record.allergyTags.join(", ").toLocaleUpperCase("es")
        : undefined,
    allergyNotes: record.medicalNotes ?? undefined,
    ...fallbackAvatar,
    parents: [],
  };
}
