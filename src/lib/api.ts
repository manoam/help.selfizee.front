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
  publishedAt: string | null;
};

export type PostDetail = Post & {
  contenu: unknown;
  authorKcSub: string | null;
  authorName: string | null;
  categories: Array<{
    category: { id: number; nom: string; slug: string };
    subCategory: { id: number; nom: string; slug: string } | null;
    subSubCategory: { id: number; nom: string; slug: string } | null;
  }>;
  tags: Array<{ tag: { id: number; name: string; slug: string } }>;
};
