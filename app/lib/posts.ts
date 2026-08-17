export type PostType = "achievement" | "activity" | "announcement";

export interface Post {
  id: string;
  type: PostType;
  authorName: string;
  avatarInitial?: string;
  postedAtLabel: string;
  audienceLabel: string;
  content: string;
  photoLabel?: string;
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
  achievement: "Logro",
  activity: "Actividad",
  announcement: "Anuncio",
};

export const publishedByYouLabel = "publicado por vos";

export const audiencePrefixLabel = "Para:";
