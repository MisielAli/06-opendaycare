export type ParentStatus = "active" | "pending";

export type ParentRole = "Mamá" | "Papá" | "Tutor/a";

export type RoomName = "Soles" | "Luna" | "Estrellas";

export interface RoomOption {
  name: RoomName;
}

export interface AddKidFormValues {
  fullName: string;
  birthDate: string;
  room: RoomName | "";
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

export interface TempKid extends Kid {
  createdAt: Date;
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

export const fallbackEnrollmentDate = new Date();

export function getEnrollmentLabel(date: Date): string {
  return new Intl.DateTimeFormat("es", { month: "short", year: "numeric" })
    .format(date)
    .replace(".", "");
}

export const kids: Kid[] = [
  {
    id: "0001",
    name: "Mateo Fernández",
    birthDate: "2022-03-12",
    room: "Soles",
    enrollmentLabel: "feb 2025",
    allergyLabel: "MANÍ",
    allergyNotes:
      "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    avatarColor: "#A9D9E8",
    avatarTextColor: "#1F7A93",
    parents: [
      {
        name: "Lucía Fernández",
        roleLabel: "Mamá",
        status: "active",
        avatarColor: "#C9B6E8",
      },
      {
        name: "Diego Fernández",
        roleLabel: "Papá",
        status: "pending",
        avatarColor: "#A9C7E8",
      },
    ],
  },
  {
    id: "0002",
    name: "Sofía Méndez",
    birthDate: "2023-05-23",
    room: "Soles",
    enrollmentLabel: "mar 2025",
    avatarColor: "#F4B8CC",
    avatarTextColor: "#C44A7A",
    parents: [
      {
        name: "Mariana Méndez",
        roleLabel: "Mamá",
        status: "active",
        avatarColor: "#E7A6C0",
      },
    ],
  },
  {
    id: "0003",
    name: "Benjamín Ruiz",
    birthDate: "2022-09-18",
    room: "Soles",
    enrollmentLabel: "feb 2025",
    avatarColor: "#B9DEC4",
    avatarTextColor: "#3E8B62",
    parents: [
      {
        name: "Carolina Ruiz",
        roleLabel: "Mamá",
        status: "active",
        avatarColor: "#B9DEC4",
      },
      {
        name: "Pablo Ruiz",
        roleLabel: "Papá",
        status: "active",
        avatarColor: "#A9C7E8",
      },
    ],
  },
  {
    id: "0004",
    name: "Valentina Soto",
    birthDate: "2023-11-05",
    room: "Soles",
    enrollmentLabel: "abr 2025",
    avatarColor: "#F4DC8E",
    avatarTextColor: "#9A7B1E",
    parents: [],
  },
  {
    id: "0005",
    name: "Tomás Díaz",
    birthDate: "2022-06-28",
    room: "Soles",
    enrollmentLabel: "feb 2025",
    allergyLabel: "LACTOSA",
    allergyNotes: "Intolerancia a la lactosa. Ofrecer alternativas sin lácteos.",
    avatarColor: "#C9B6E8",
    avatarTextColor: "#7B5FC0",
    parents: [
      {
        name: "Martín Díaz",
        roleLabel: "Papá",
        status: "active",
        avatarColor: "#A9C7E8",
      },
    ],
  },
  {
    id: "0006",
    name: "Emma Castro",
    birthDate: "2023-04-15",
    room: "Soles",
    enrollmentLabel: "mar 2025",
    avatarColor: "#F4B8CC",
    avatarTextColor: "#C44A7A",
    parents: [
      {
        name: "Ana Castro",
        roleLabel: "Mamá",
        status: "active",
        avatarColor: "#F4B8CC",
      },
    ],
  },
  {
    id: "0007",
    name: "Lucas Romero",
    birthDate: "2022-12-01",
    room: "Soles",
    enrollmentLabel: "feb 2025",
    avatarColor: "#A9D9E8",
    avatarTextColor: "#1F7A93",
    parents: [
      {
        name: "Javier Romero",
        roleLabel: "Papá",
        status: "active",
        avatarColor: "#A9D9E8",
      },
    ],
  },
  {
    id: "0008",
    name: "Olivia Vega",
    birthDate: "2023-08-09",
    room: "Soles",
    enrollmentLabel: "abr 2025",
    avatarColor: "#B9DEC4",
    avatarTextColor: "#3E8B62",
    parents: [
      {
        name: "Elena Vega",
        roleLabel: "Mamá",
        status: "active",
        avatarColor: "#B9DEC4",
      },
    ],
  },
];

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
