import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { JSONContent } from "@tiptap/react";

import { api, type PostDetail } from "../../lib/api";
import { RichTextEditor } from "../../components/RichTextEditor";

type FormState = {
  titre: string;
  slug: string;
  resume: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  contenu: JSONContent | null;
  contenuText: string;
};

const empty: FormState = {
  titre: "",
  slug: "",
  resume: "",
  status: "DRAFT",
  contenu: null,
  contenuText: "",
};

export function PostEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = !id;
  const [form, setForm] = useState<FormState>(empty);

  const { data: existing } = useQuery({
    queryKey: ["post-edit", id],
    queryFn: async () => {
      const { data } = await api.get<PostDetail>(`/posts/by-id/${id}`);
      return data;
    },
    enabled: !isNew,
    retry: false,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        titre: existing.titre,
        slug: existing.slug,
        resume: existing.resume ?? "",
        status: existing.status,
        contenu: existing.contenu as JSONContent,
        contenuText: "",
      });
    }
  }, [existing]);

  const save = useMutation({
    mutationFn: async (payload: FormState) => {
      if (isNew) {
        const { data } = await api.post("/posts", payload);
        return data;
      }
      const { data } = await api.put(`/posts/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      navigate("/admin/posts");
    },
  });

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">{isNew ? "Nouveau post" : "Éditer le post"}</h1>

      <div className="space-y-4">
        <div>
          <label className="text-sm block mb-1">Titre</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.titre}
            onChange={(e) => setForm({ ...form, titre: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm block mb-1">Slug (optionnel — sinon généré)</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm block mb-1">Résumé</label>
          <textarea
            className="w-full border rounded px-3 py-2 text-sm"
            rows={2}
            value={form.resume}
            onChange={(e) => setForm({ ...form, resume: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm block mb-1">Contenu</label>
          <RichTextEditor
            value={form.contenu}
            onChange={(json, text) =>
              setForm((f) => ({ ...f, contenu: json, contenuText: text }))
            }
          />
        </div>
        <div>
          <label className="text-sm block mb-1">Statut</label>
          <select
            className="border rounded px-3 py-2 text-sm"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as FormState["status"] })}
          >
            <option value="DRAFT">Brouillon</option>
            <option value="PUBLISHED">Publié</option>
            <option value="ARCHIVED">Archivé</option>
          </select>
        </div>

        {save.isError && (
          <p className="text-sm text-red-600">Erreur lors de l'enregistrement.</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => save.mutate(form)}
            disabled={save.isPending || !form.titre}
            className="bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)] rounded px-4 py-2 text-sm disabled:opacity-50"
          >
            {save.isPending ? "..." : "Enregistrer"}
          </button>
          <button
            onClick={() => navigate("/admin/posts")}
            className="border rounded px-4 py-2 text-sm"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
