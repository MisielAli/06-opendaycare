export type PostType =
  | "meal"
  | "nap"
  | "activity"
  | "achievement"
  | "mood"
  | "photo"
  | "announcement";

export type PostAudience =
  | { kind: "kid"; kidId: string; kidName: string }
  | { kind: "room" };

export interface PostPhoto {
  id: string;
  name: string;
  previewUrl: string;
}

export interface CreatePostFormValues {
  audience: PostAudience | null;
  type: PostType | null;
  content: string;
  photos: PostPhoto[];
}

export interface Post {
  id: string;
  type: PostType;
  authorName: string;
  avatarInitial?: string;
  postedAtLabel: string;
  audienceLabel: string;
  content: string;
  photoLabel?: string;
  photos?: PostPhoto[];
  likeCount: number;
  commentCount: number;
}

export const posts: Post[] = [
  {
    id: "post-toilet-milestone",
    type: "achievement",
    authorName: "Mateo",
    avatarInitial: "M",
    postedAtLabel: "14:20",
    audienceLabel: "familia de Mateo",
    content:
      "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    likeCount: 3,
    commentCount: 1,
  },
  {
    id: "post-tempera-painting",
    type: "activity",
    authorName: "Mateo",
    avatarInitial: "M",
    postedAtLabel: "09:40",
    audienceLabel: "familia de Mateo",
    content:
      "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    photoLabel: "Foto · pintando con témperas",
    likeCount: 5,
    commentCount: 2,
  },
  {
    id: "post-park-announcement",
    type: "announcement",
    authorName: "Anuncio general",
    postedAtLabel: "07:50",
    audienceLabel: "toda la sala",
    content:
      "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    likeCount: 8,
    commentCount: 0,
  },
];

export const postTypeLabels: Record<PostType, string> = {
  meal: "Comida",
  nap: "Siesta",
  activity: "Actividad",
  achievement: "Logro",
  mood: "Ánimo",
  photo: "Foto",
  announcement: "Anuncio",
};

export const postTypeStyles: Record<
  PostType,
  { backgroundColor: string; color: string }
> = {
  meal: { backgroundColor: "#9A7B1E", color: "#FFFFFF" },
  nap: { backgroundColor: "#E7DCF6", color: "#7B5FC0" },
  activity: { backgroundColor: "#C7E7F1", color: "#2E89A6" },
  achievement: { backgroundColor: "#CFEBD8", color: "#3E9B6C" },
  mood: { backgroundColor: "#F9D2DE", color: "#C56486" },
  photo: { backgroundColor: "#FBD8CC", color: "#D9684A" },
  announcement: { backgroundColor: "#CCD8F4", color: "#4E72C8" },
};

export const publishedByYouLabel = "publicado por vos";

export const audiencePrefixLabel = "Para:";
