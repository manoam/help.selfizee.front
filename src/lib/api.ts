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

// Fallback : lit l'access_token directement depuis le stockage oidc-client-ts.
// Utile juste après un rechargement (window.location.replace au callback) quand
// une requête API part AVANT que <AuthBridge> ait pu appeler setAccessToken()
// -> évite un 401 "missing_bearer" transitoire.
function tokenFromStore(): string | null {
  try {
    const kc = import.meta.env.VITE_KEYCLOAK_URL as string | undefined;
    const realm = import.meta.env.VITE_KEYCLOAK_REALM as string | undefined;
    const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID as
      | string
      | undefined;
    if (!kc || !realm || !clientId) return null;
    const authority = `${kc.replace(/\/$/, "")}/realms/${realm}`;
    const key = `oidc.user:${authority}:${clientId}`;
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { access_token?: string };
    return parsed.access_token ?? null;
  } catch {
    return null;
  }
}

api.interceptors.request.use((config) => {
  const token = currentAccessToken ?? tokenFromStore();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
export type SubCategoryWithParent = {
  id: number;
  nom: string;
  slug: string;
  categoryId: number;
  category: { id: number; nom: string; slug: string };
};
export type SubSubCategoryWithParent = {
  id: number;
  nom: string;
  slug: string;
  subCategoryId: number;
  subCategory: SubCategoryWithParent;
};
export type TagWithCount = TagDto & { _count?: { posts: number } };
export type VoteValue = "SAD" | "NEUTRAL" | "HAPPY";
export type VoteTally = {
  tally: Record<VoteValue, number>;
  myVote: VoteValue | null;
};
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
export type CategoryAdminDto = {
  id: number;
  nom: string;
  slug: string;
  description: string | null;
  iconeUrl: string | null;
  afficher: boolean;
  ordre: number;
  _count?: { subCategories: number; posts: number };
};
export type GammeBorneDto = { id: number; nom: string; slug: string };
export type ModelBorneDto = {
  id: number;
  nom: string;
  version: string | null;
  gammeBorneId: number;
};
export type TypeProfilDto = { id: number; nom: string; slug: string };
