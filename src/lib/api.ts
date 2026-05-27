import axios from "axios";

// En dev : pas de VITE_API_BASE_URL → on tape `/api` et Vite proxie vers le back.
// En prod : VITE_API_BASE_URL pointe directement vers le back (https://api...sslip.io).
const baseURL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

export const api = axios.create({ baseURL });

// Bridge entre react-oidc-context (hook React) et axios (hors React).
// Le composant <AuthBridge /> appelle setAccessToken() à chaque refresh.
let currentAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  currentAccessToken = token;
}

api.interceptors.request.use((config) => {
  if (currentAccessToken) {
    config.headers.Authorization = `Bearer ${currentAccessToken}`;
  }
  return config;
});

// ----- Types DTO -----

export type Me = {
  sub: string;
  email?: string;
  name?: string;
  preferredUsername?: string;
  roles: string[];
};

export type Post = {
  id: number;
  titre: string;
  slug: string;
  resume: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFavourite?: boolean;
  publishedAt: string | null;
};

export type PostCategoryRel = {
  id?: number;
  categoryId: number;
  subCategoryId: number | null;
  subSubCategoryId: number | null;
  category?: { id: number; nom: string; slug: string };
  subCategory?: { id: number; nom: string; slug: string } | null;
  subSubCategory?: { id: number; nom: string; slug: string } | null;
};

export type PostModelBorneRel = {
  id?: number;
  gammeBorneId: number;
  modelBorneId: number | null;
  gammeBorne?: { id: number; nom: string };
  modelBorne?: { id: number; nom: string; version: string | null } | null;
};

export type PostAttachmentDto = {
  id: number;
  filename: string;
  originalName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  storagePath: string;
  label: string | null;
  description: string | null;
};

export type PostDetail = Post & {
  contenu: unknown;
  contenuText: string | null;
  ordre: number | null;
  descriptionProbleme: string | null;
  question: string | null;
  introClient: string | null;
  noticeClient: string | null;
  problemeClient: string | null;
  introCallCenter: string | null;
  noticeCallCenter: string | null;
  problemeCallCenter: string | null;
  introInterne: string | null;
  problemeInterne: string | null;
  authorKcSub: string | null;
  authorName: string | null;
  categories: PostCategoryRel[];
  tags: Array<{ tag: { id: number; name: string; slug: string } }>;
  attachments: PostAttachmentDto[];
  modelBornes: PostModelBorneRel[];
  typeProfils: Array<{ typeProfil: { id: number; nom: string; slug: string } }>;
  relatedTo: Array<{ to: { id: number; titre: string; slug: string } }>;
};

export type CategoryDto = { id: number; nom: string; slug: string };
export type SubCategoryDto = {
  id: number;
  nom: string;
  slug: string;
  categoryId: number;
};
export type SubSubCategoryDto = {
  id: number;
  nom: string;
  slug: string;
  subCategoryId: number;
};
export type TagDto = { id: number; name: string; slug: string };
export type GammeBorneDto = { id: number; nom: string; slug: string };
export type ModelBorneDto = {
  id: number;
  nom: string;
  version: string | null;
  gammeBorneId: number;
};
export type TypeProfilDto = { id: number; nom: string; slug: string };
