export interface NavItem {
  id: "feed" | "children" | "notices" | "account";
  label: string;
  href?: string;
}

export const navItems: NavItem[] = [
  { id: "feed", label: "Feed", href: "/" },
  { id: "children", label: "Niños", href: "/kids" },
  { id: "notices", label: "Avisos" },
  { id: "account", label: "Mi cuenta" },
];

export const sidebarTexts = {
  brandName: "OpenDayCare",
  roomName: "Sala Soles",
  newPostButton: "Nueva publicación",
  staffRoleLabel: "Personal · Soles",
  logoutTitle: "Cerrar sesión",
} as const;
