export type ParentStatus = "active" | "pending";

export type ParentRole = "Mamá" | "Papá" | "Tutor/a";

export type RoomName = "Soles" | "Luna" | "Estrellas";

export interface RoomOption {
  name: RoomName;
}

export interface AddKidFormValues {
  fullName: string;
  birthDate: string;
  roomId: string;
  allergyTags: string;
  medicalNotes: string;
}

export interface LinkParentFormValues {
  fullName: string;
  email: string;
  roleLabel: ParentRole;
}

export interface ParentLink {
  name: string;
  roleLabel: string;
  status: ParentStatus;
  avatarColor: string;
}

export const pendingParentAvatarColor = "#A9C7E8";

export interface Kid {
  id: string;
  name: string;
  birthDate: string;
  room: string;
  enrollmentLabel: string;
  allergyLabel?: string;
  allergyNotes?: string;
  avatarColor: string;
  avatarTextColor: string;
  parents: ParentLink[];
}

export interface KidRecord {
  id: string;
  fullName: string;
  birthDate: string;
  roomName: string;
  enrolledAt: string;
  allergyTags: string[];
  medicalNotes: string | null;
  photoConsent: boolean;
  status: "active" | "archived";
}

export interface RoomRecord {
  id: string;
  name: string;
  kidCount: number;
}

export const roomOptions: RoomOption[] = [
  { name: "Soles" },
  { name: "Luna" },
  { name: "Estrellas" },
];

export const fallbackAvatar = {
  avatarColor: "#F2937A",
  avatarTextColor: "#8B3A24",
};

export function getEnrollmentLabel(date: Date): string {
  return new Intl.DateTimeFormat("es", { month: "short", year: "numeric" })
    .format(date)
    .replace(".", "");
}

export function getAgeLabel(birthDate: string): string {
  const [birthYear, birthMonth, birthDay] = birthDate.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - birthYear;

  if (
    today.getMonth() + 1 < birthMonth ||
    (today.getMonth() + 1 === birthMonth && today.getDate() < birthDay)
  ) {
    age -= 1;
  }

  return `${age} ${age === 1 ? "año" : "años"}`;
}

export function formatBirthDate(birthDate: string): string {
  const [year, month, day] = birthDate.split("-");
  const monthLabels = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];

  return `${Number(day)} ${monthLabels[Number(month) - 1]} ${year}`;
}

export const parentStatusLabels: Record<ParentStatus, string> = {
  active: "ACTIVA",
  pending: "PENDIENTE",
};
