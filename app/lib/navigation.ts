export interface NavItem {
  id: "feed" | "children" | "notices" | "account";
  label: string;
  href: string;
}

export const navItems: NavItem[] = [
  { id: "feed", label: "Feed", href: "#" },
  { id: "children", label: "Niños", href: "#" },
  { id: "notices", label: "Avisos", href: "#" },
  { id: "account", label: "Mi cuenta", href: "#" },
];

export const sidebarTexts = {
  brandName: "OpenDayCare",
  roomName: "Sala Soles",
  newPostButton: "Nueva publicación",
  userName: "Caro Giménez",
  userRole: "Maestra · Soles",
  logoutTitle: "Cerrar sesión",
} as const;
