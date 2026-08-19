export type RelationshipDB = "father" | "mother" | "guardian";
export type RelationshipUI = "Mamá" | "Papá" | "Tutor/a";
export type InvitationStatus = "pending" | "accepted" | "expired" | "cancelled";

export const relationshipToDB: Record<RelationshipUI, RelationshipDB> = {
  Mamá: "mother",
  Papá: "father",
  "Tutor/a": "guardian",
};

export const relationshipToUI: Record<RelationshipDB, RelationshipUI> = {
  mother: "Mamá",
  father: "Papá",
  guardian: "Tutor/a",
};

export interface InviteParentInput {
  childId: string;
  fullName: string;
  email: string;
  relationship: RelationshipUI;
}

export interface InviteParentResult {
  code: string;
  expiresAt: string;
  emailSent: boolean;
  emailError?: string;
}

export interface AcceptInvitationInput {
  code: string;
  email: string;
  password: string;
}

export interface AcceptInvitationResult {
  childId: string;
}
