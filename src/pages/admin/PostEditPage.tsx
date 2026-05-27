import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { JSONContent } from "@tiptap/react";

import {
  api,
  type PostDetail,
  type CategoryDto,
  type SubCategoryDto,
  type SubSubCategoryDto,
  type TagDto,
  type GammeBorneDto,
  type ModelBorneDto,
  type TypeProfilDto,
} from "../../lib/api";
import { RichTextEditor } from "../../components/RichTextEditor";
import { AttachmentsManager } from "../../components/admin/AttachmentsManager";
import { RelatedPostsPicker } from "../../components/admin/RelatedPostsPicker";

type ViewBlock = {
  intro: string;
  notice: string;
  probleme: string;
};

type CategoryRow = {
  categoryId: number | null;
  subCategoryId: number | null;
  subSubCategoryId: number | null;
};

type ModelBorneRow = {
  gammeBorneId: number | null;
  modelBorneId: number | null;
};

type FormState = {
  titre: string;
  slug: string;
  resume: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFavourite: boolean;
  contenu: JSONContent | null;
  contenuText: string;
  descriptionProbleme: string;
  question: string;
  vueClient: ViewBlock;
  vueCallCenter: ViewBlock;
  vueInterne: { intro: string; probleme: string }; // contenu interne = `contenu` JSON principal
  categories: CategoryRow[];
  tagIds: number[];
  modelBornes: ModelBorneRow[];
  typeProfilIds: number[];
  relatedPostIds: number[];
};

const emptyView: ViewBlock = { intro: "", notice: "", probleme: "" };
const emptyState: FormState = {
  titre: "",
  slug: "",
  resume: "",
  status: "DRAFT",
  isFavourite: false,
  contenu: null,
  contenuText: "",
  descriptionProbleme: "",
  question: "",
  vueClient: emptyView,
  vueCallCenter: emptyView,
  vueInterne: { intro: "", probleme: "" },
  categories: [{ categoryId: null, subCategoryId: null, subSubCategoryId: null }],
  tagIds: [],
  modelBornes: [],
  typeProfilIds: [],
  relatedPostIds: [],
};

type ViewTab = "client" | "callcenter" | "interne";

export function PostEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = !id;
  const [form, setForm] = useState<FormState>(emptyState);
  const [tab, setTab] = useState<ViewTab>("client");

  // Chargement initial du post à éditer
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
    if (!existing) return;
    setForm({
      titre: existing.titre,
      slug: existing.slug,
      resume: existing.resume ?? "",
      status: existing.status,
      isFavourite: !!existing.isFavourite,
      contenu: (existing.contenu as JSONContent) ?? null,
      contenuText: existing.contenuText ?? "",
      descriptionProbleme: existing.descriptionProbleme ?? "",
      question: existing.question ?? "",
      vueClient: {
        intro: existing.introClient ?? "",
        notice: existing.noticeClient ?? "",
        probleme: existing.problemeClient ?? "",
      },
      vueCallCenter: {
        intro: existing.introCallCenter ?? "",
        notice: existing.noticeCallCenter ?? "",
        probleme: existing.problemeCallCenter ?? "",
      },
      vueInterne: {
        intro: existing.introInterne ?? "",
        probleme: existing.problemeInterne ?? "",
      },
      categories:
        existing.categories.length > 0
          ? existing.categories.map((c) => ({
              categoryId: c.categoryId,
              subCategoryId: c.subCategoryId,
              subSubCategoryId: c.subSubCategoryId,
            }))
          : [{ categoryId: null, subCategoryId: null, subSubCategoryId: null }],
      tagIds: existing.tags.map((t) => t.tag.id),
      modelBornes: existing.modelBornes.map((m) => ({
        gammeBorneId: m.gammeBorneId,
        modelBorneId: m.modelBorneId,
      })),
      typeProfilIds: existing.typeProfils.map((t) => t.typeProfil.id),
      relatedPostIds: existing.relatedTo.map((r) => r.to.id),
    });
  }, [existing]);

  // Données de référence
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get<CategoryDto[]>("/categories")).data,
  });
  const { data: subCategories = [] } = useQuery({
    queryKey: ["sub-categories"],
    queryFn: async () =>
      (await api.get<SubCategoryDto[]>("/categories/sub")).data,
  });
  const { data: subSubCategories = [] } = useQuery({
    queryKey: ["sub-sub-categories"],
    queryFn: async () =>
      (await api.get<SubSubCategoryDto[]>("/categories/sub-sub")).data,
  });
  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => (await api.get<TagDto[]>("/tags")).data,
  });
  const { data: gammesBornes = [] } = useQuery({
    queryKey: ["gammes-bornes"],
    queryFn: async () =>
      (await api.get<GammeBorneDto[]>("/gammes-bornes")).data,
  });
  const { data: modelBornes = [] } = useQuery({
    queryKey: ["model-bornes"],
    queryFn: async () => (await api.get<ModelBorneDto[]>("/model-bornes")).data,
  });
  const { data: typeProfils = [] } = useQuery({
    queryKey: ["type-profils"],
    queryFn: async () =>
      (await api.get<TypeProfilDto[]>("/type-profils")).data,
  });

  const subCatsByCat = useMemo(() => {
    const m = new Map<number, SubCategoryDto[]>();
    for (const sc of subCategories) {
      const arr = m.get(sc.categoryId) ?? [];
      arr.push(sc);
      m.set(sc.categoryId, arr);
    }
    return m;
  }, [subCategories]);
  const subSubCatsBySub = useMemo(() => {
    const m = new Map<number, SubSubCategoryDto[]>();
    for (const ssc of subSubCategories) {
      const arr = m.get(ssc.subCategoryId) ?? [];
      arr.push(ssc);
      m.set(ssc.subCategoryId, arr);
    }
    return m;
  }, [subSubCategories]);
  const modelBornesByGamme = useMemo(() => {
    const m = new Map<number, ModelBorneDto[]>();
    for (const mb of modelBornes) {
      const arr = m.get(mb.gammeBorneId) ?? [];
      arr.push(mb);
      m.set(mb.gammeBorneId, arr);
    }
    return m;
  }, [modelBornes]);

  // Save
  const save = useMutation({
    mutationFn: async (
      args: { stayOnPage: boolean; data: FormState },
    ): Promise<PostDetail> => {
      const payload = serializePayload(args.data);
      if (isNew) {
        const { data } = await api.post<PostDetail>("/posts", payload);
        return data;
      }
      const { data } = await api.put<PostDetail>(`/posts/${id}`, payload);
      return data;
    },
    onSuccess: (saved, args) => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["post-edit"] });
      if (args.stayOnPage) {
        if (isNew) navigate(`/admin/posts/${saved.id}`, { replace: true });
      } else {
        navigate("/admin/posts");
      }
    },
  });

  const updateForm = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const updateCategoryRow = (idx: number, patch: Partial<CategoryRow>) => {
    setForm((f) => {
      const next = [...f.categories];
      next[idx] = { ...next[idx], ...patch };
      // Reset sous-niveaux quand un parent change.
      if (patch.categoryId !== undefined) {
        next[idx].subCategoryId = null;
        next[idx].subSubCategoryId = null;
      } else if (patch.subCategoryId !== undefined) {
        next[idx].subSubCategoryId = null;
      }
      return { ...f, categories: next };
    });
  };

  const updateModelBorneRow = (idx: number, patch: Partial<ModelBorneRow>) => {
    setForm((f) => {
      const next = [...f.modelBornes];
      next[idx] = { ...next[idx], ...patch };
      if (patch.gammeBorneId !== undefined) {
        next[idx].modelBorneId = null;
      }
      return { ...f, modelBornes: next };
    });
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {isNew ? "Nouveau document" : "Éditer le document"}
        </h1>
        {!isNew && existing && (
          <a
            href={`/post/${existing.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[--k-primary] hover:underline"
          >
            Voir la page publique →
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Contenu principal">
            <Field label="Titre *">
              <input
                className="input-field"
                value={form.titre}
                onChange={(e) => updateForm("titre", e.target.value)}
              />
            </Field>
            <Field label="Slug (optionnel — sinon généré)">
              <input
                className="input-field"
                value={form.slug}
                onChange={(e) => updateForm("slug", e.target.value)}
              />
            </Field>
            <Field label="Résumé (court)">
              <textarea
                className="input-field"
                rows={2}
                value={form.resume}
                onChange={(e) => updateForm("resume", e.target.value)}
              />
            </Field>
            <Field label="Description du problème">
              <textarea
                className="input-field"
                rows={5}
                value={form.descriptionProbleme}
                onChange={(e) =>
                  updateForm("descriptionProbleme", e.target.value)
                }
              />
            </Field>
          </Card>

          <Card title="Vues (notice / problème par profil)">
            {/* Onglets */}
            <div className="flex gap-2 border-b border-[--k-border] mb-4">
              {(["client", "callcenter", "interne"] as ViewTab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                    tab === t
                      ? "border-[--k-primary] text-[--k-primary]"
                      : "border-transparent text-[--k-muted] hover:text-[--k-text]"
                  }`}
                >
                  {t === "client"
                    ? "Notice client"
                    : t === "callcenter"
                      ? "Notice call-center"
                      : "Notice interne"}
                </button>
              ))}
            </div>

            {tab === "client" && (
              <ViewFields
                value={form.vueClient}
                onChange={(v) => updateForm("vueClient", v)}
              />
            )}
            {tab === "callcenter" && (
              <ViewFields
                value={form.vueCallCenter}
                onChange={(v) => updateForm("vueCallCenter", v)}
              />
            )}
            {tab === "interne" && (
              <div className="space-y-4">
                <Field label="Intro :">
                  <textarea
                    className="input-field"
                    rows={6}
                    value={form.vueInterne.intro}
                    onChange={(e) =>
                      updateForm("vueInterne", {
                        ...form.vueInterne,
                        intro: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Contenu (richtext) :">
                  <RichTextEditor
                    value={form.contenu}
                    onChange={(json, text) =>
                      setForm((f) => ({ ...f, contenu: json, contenuText: text }))
                    }
                  />
                </Field>
                <Field label="Problème :">
                  <textarea
                    className="input-field"
                    rows={6}
                    value={form.vueInterne.probleme}
                    onChange={(e) =>
                      updateForm("vueInterne", {
                        ...form.vueInterne,
                        probleme: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>
            )}
          </Card>

          <Card title="Questions">
            <textarea
              className="input-field"
              rows={5}
              value={form.question}
              onChange={(e) => updateForm("question", e.target.value)}
            />
          </Card>

          {!isNew && existing && (
            <Card title="Documents">
              <AttachmentsManager postId={existing.id} />
            </Card>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          <Card title="Catégorisation">
            {form.categories.map((row, idx) => {
              const subCats = row.categoryId
                ? subCatsByCat.get(row.categoryId) ?? []
                : [];
              const subSubCats = row.subCategoryId
                ? subSubCatsBySub.get(row.subCategoryId) ?? []
                : [];
              return (
                <div
                  key={idx}
                  className="space-y-2 pb-3 mb-3 border-b border-[--k-border] last:border-0 last:pb-0 last:mb-0"
                >
                  <Field label="Catégorie *">
                    <select
                      className="input-field"
                      value={row.categoryId ?? ""}
                      onChange={(e) =>
                        updateCategoryRow(idx, {
                          categoryId: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    >
                      <option value="">Sélectionner</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nom}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Sous catégorie">
                    <select
                      className="input-field"
                      value={row.subCategoryId ?? ""}
                      disabled={!row.categoryId}
                      onChange={(e) =>
                        updateCategoryRow(idx, {
                          subCategoryId: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    >
                      <option value="">Sélectionner</option>
                      {subCats.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.nom}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Sous sous catégorie">
                    <select
                      className="input-field"
                      value={row.subSubCategoryId ?? ""}
                      disabled={!row.subCategoryId}
                      onChange={(e) =>
                        updateCategoryRow(idx, {
                          subSubCategoryId: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    >
                      <option value="">Sélectionner</option>
                      {subSubCats.map((ssc) => (
                        <option key={ssc.id} value={ssc.id}>
                          {ssc.nom}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {form.categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        updateForm(
                          "categories",
                          form.categories.filter((_, i) => i !== idx),
                        )
                      }
                      className="text-xs text-[--k-danger] hover:underline"
                    >
                      Retirer cette catégorie
                    </button>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              onClick={() =>
                updateForm("categories", [
                  ...form.categories,
                  { categoryId: null, subCategoryId: null, subSubCategoryId: null },
                ])
              }
              className="text-xs text-[--k-primary] hover:underline"
            >
              + Ajouter une catégorie
            </button>
          </Card>

          <Card title="Publication">
            <Field label="Statut">
              <select
                className="input-field"
                value={form.status}
                onChange={(e) =>
                  updateForm("status", e.target.value as FormState["status"])
                }
              >
                <option value="DRAFT">Brouillon</option>
                <option value="PUBLISHED">Publié</option>
                <option value="ARCHIVED">Archivé</option>
              </select>
            </Field>
            <Field label="Niveaux d'accès">
              <MultiSelect
                options={typeProfils.map((tp) => ({ id: tp.id, label: tp.nom }))}
                selectedIds={form.typeProfilIds}
                onChange={(ids) => updateForm("typeProfilIds", ids)}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={form.isFavourite}
                onChange={(e) => updateForm("isFavourite", e.target.checked)}
              />
              Afficher dans les favoris
            </label>
          </Card>

          <Card title="Gammes de bornes">
            {form.modelBornes.map((row, idx) => {
              const models = row.gammeBorneId
                ? modelBornesByGamme.get(row.gammeBorneId) ?? []
                : [];
              return (
                <div key={idx} className="space-y-2 mb-3">
                  <Field label="Gamme">
                    <select
                      className="input-field"
                      value={row.gammeBorneId ?? ""}
                      onChange={(e) =>
                        updateModelBorneRow(idx, {
                          gammeBorneId: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    >
                      <option value="">Sélectionner</option>
                      {gammesBornes.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.nom}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {models.length > 0 && (
                    <Field label="Modèle (optionnel)">
                      <select
                        className="input-field"
                        value={row.modelBorneId ?? ""}
                        onChange={(e) =>
                          updateModelBorneRow(idx, {
                            modelBorneId: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                      >
                        <option value="">Toutes</option>
                        {models.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nom}
                            {m.version ? `-${m.version}` : ""}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      updateForm(
                        "modelBornes",
                        form.modelBornes.filter((_, i) => i !== idx),
                      )
                    }
                    className="text-xs text-[--k-danger] hover:underline"
                  >
                    Retirer
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() =>
                updateForm("modelBornes", [
                  ...form.modelBornes,
                  { gammeBorneId: null, modelBorneId: null },
                ])
              }
              className="text-xs text-[--k-primary] hover:underline"
            >
              + Ajouter une gamme
            </button>
          </Card>

          <Card title="Tags">
            <MultiSelect
              options={tags.map((t) => ({ id: t.id, label: t.name }))}
              selectedIds={form.tagIds}
              onChange={(ids) => updateForm("tagIds", ids)}
            />
          </Card>

          <Card title="Articles liés">
            <RelatedPostsPicker
              selectedIds={form.relatedPostIds}
              excludeId={existing?.id}
              onChange={(ids) => updateForm("relatedPostIds", ids)}
            />
          </Card>
        </div>
      </div>

      {save.isError && (
        <p className="text-sm text-[--k-danger] mt-4">
          Erreur lors de l'enregistrement.
        </p>
      )}

      <div className="flex gap-3 mt-6 pb-12">
        <button
          type="button"
          onClick={() => save.mutate({ stayOnPage: true, data: form })}
          disabled={save.isPending || !form.titre}
          className="bg-[--k-success] text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {save.isPending ? "..." : "Enregistrer et rester"}
        </button>
        <button
          type="button"
          onClick={() => save.mutate({ stayOnPage: false, data: form })}
          disabled={save.isPending || !form.titre}
          className="bg-[--k-success] text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Enregistrer et quitter
        </button>
        <button
          type="button"
          onClick={() => navigate("/admin/posts")}
          className="border border-[--k-border] rounded px-4 py-2 text-sm"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

// ----- Sous-composants -----

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[--k-border] rounded-2xl shadow-soft">
      <div className="px-5 py-3 border-b border-[--k-border]">
        <h2 className="text-sm font-semibold text-[--k-text]">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[--k-muted] mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function ViewFields({
  value,
  onChange,
}: {
  value: ViewBlock;
  onChange: (v: ViewBlock) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Intro :">
        <textarea
          className="input-field"
          rows={6}
          value={value.intro}
          onChange={(e) => onChange({ ...value, intro: e.target.value })}
        />
      </Field>
      <Field label="Contenu :">
        <textarea
          className="input-field"
          rows={10}
          value={value.notice}
          onChange={(e) => onChange({ ...value, notice: e.target.value })}
        />
      </Field>
      <Field label="Problème :">
        <textarea
          className="input-field"
          rows={6}
          value={value.probleme}
          onChange={(e) => onChange({ ...value, probleme: e.target.value })}
        />
      </Field>
    </div>
  );
}

function MultiSelect({
  options,
  selectedIds,
  onChange,
}: {
  options: { id: number; label: string }[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };
  return (
    <div className="border border-[--k-border] rounded-lg max-h-48 overflow-y-auto bg-white">
      {options.length === 0 && (
        <div className="px-3 py-2 text-xs text-[--k-muted]">Aucune option</div>
      )}
      {options.map((opt) => (
        <label
          key={opt.id}
          className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-[--k-surface-2]"
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(opt.id)}
            onChange={() => toggle(opt.id)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

// ----- Serialisation vers payload API -----

function serializePayload(f: FormState) {
  return {
    titre: f.titre,
    slug: f.slug || undefined,
    resume: f.resume || null,
    status: f.status,
    isFavourite: f.isFavourite,
    contenu: f.contenu ?? {},
    contenuText: f.contenuText || null,
    descriptionProbleme: f.descriptionProbleme || null,
    question: f.question || null,
    introClient: f.vueClient.intro || null,
    noticeClient: f.vueClient.notice || null,
    problemeClient: f.vueClient.probleme || null,
    introCallCenter: f.vueCallCenter.intro || null,
    noticeCallCenter: f.vueCallCenter.notice || null,
    problemeCallCenter: f.vueCallCenter.probleme || null,
    introInterne: f.vueInterne.intro || null,
    problemeInterne: f.vueInterne.probleme || null,
    tagIds: f.tagIds,
    categories: f.categories
      .filter((c): c is CategoryRow & { categoryId: number } =>
        c.categoryId != null,
      )
      .map((c) => ({
        categoryId: c.categoryId,
        subCategoryId: c.subCategoryId,
        subSubCategoryId: c.subSubCategoryId,
      })),
    modelBornes: f.modelBornes
      .filter((m): m is ModelBorneRow & { gammeBorneId: number } =>
        m.gammeBorneId != null,
      )
      .map((m) => ({
        gammeBorneId: m.gammeBorneId,
        modelBorneId: m.modelBorneId,
      })),
    typeProfilIds: f.typeProfilIds,
    relatedPostIds: f.relatedPostIds,
  };
}
