import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { JSONContent } from "@tiptap/react";
import {
  FileText,
  Layers,
  Tag as TagIcon,
  Server,
  Eye,
  Plus,
  Trash2,
  ExternalLink,
  Save,
  X,
  Star,
  Users,
  Link2,
  HelpCircle,
  Paperclip,
  AlertCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
  vueInterne: { intro: string; probleme: string };
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

const STATUS_META: Record<
  FormState["status"],
  { label: string; bg: string; text: string }
> = {
  DRAFT: { label: "Brouillon", bg: "bg-amber-50", text: "text-amber-700" },
  PUBLISHED: { label: "Publié", bg: "bg-emerald-50", text: "text-emerald-700" },
  ARCHIVED: { label: "Archivé", bg: "bg-slate-100", text: "text-slate-600" },
};

export function PostEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = !id;
  const [form, setForm] = useState<FormState>(emptyState);
  const [tab, setTab] = useState<ViewTab>("client");

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

  const save = useMutation({
    mutationFn: async (args: {
      stayOnPage: boolean;
      data: FormState;
    }): Promise<PostDetail> => {
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

  const statusMeta = STATUS_META[form.status];

  return (
    <div className="max-w-6xl pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-[--k-muted] mb-2">
          <a href="/admin/posts" className="hover:text-[--k-text] transition">
            Documents
          </a>
          <span>›</span>
          <span className="text-[--k-text]">
            {isNew ? "Nouveau" : existing?.titre ?? "…"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[--k-text]">
              {isNew ? "Nouveau document" : "Édition du document"}
            </h1>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusMeta.bg} ${statusMeta.text}`}
            >
              {statusMeta.label}
            </span>
            {form.isFavourite && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                Favori
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isNew && existing && (
              <>
                <a
                  href={`/post/${existing.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[--k-primary] border border-[--k-primary-border] bg-[--k-primary-2] rounded-lg hover:brightness-95 transition"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Voir la page
                </a>
                <button
                  type="button"
                  onClick={() => navigate("/admin/posts/new")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[--k-text] border border-[--k-border] bg-white rounded-lg hover:bg-[--k-surface-2] transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Créer un nouveau
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          <Card icon={FileText} title="Contenu principal">
            <Field label="Titre" required>
              <input
                className="input-field"
                value={form.titre}
                onChange={(e) => updateForm("titre", e.target.value)}
                placeholder="Titre du document"
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Slug" hint="optionnel — généré si vide">
                <input
                  className="input-field"
                  value={form.slug}
                  onChange={(e) => updateForm("slug", e.target.value)}
                  placeholder="auto"
                />
              </Field>
              <Field label="Résumé">
                <input
                  className="input-field"
                  value={form.resume}
                  onChange={(e) => updateForm("resume", e.target.value)}
                  placeholder="Une phrase courte"
                />
              </Field>
            </div>
            <Field label="Description du problème">
              <textarea
                className="input-field"
                rows={4}
                value={form.descriptionProbleme}
                onChange={(e) =>
                  updateForm("descriptionProbleme", e.target.value)
                }
                placeholder="Quel est le problème adressé par ce document ?"
              />
            </Field>
          </Card>

          <Card icon={Eye} title="Vues (notice / problème par profil)">
            <div className="flex gap-1 p-1 bg-[--k-surface-2] rounded-lg mb-4 w-fit">
              {(["client", "callcenter", "interne"] as ViewTab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition ${
                    tab === t
                      ? "bg-white text-[--k-text] shadow-sm"
                      : "text-[--k-muted] hover:text-[--k-text]"
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
                <Field label="Intro">
                  <textarea
                    className="input-field"
                    rows={5}
                    value={form.vueInterne.intro}
                    onChange={(e) =>
                      updateForm("vueInterne", {
                        ...form.vueInterne,
                        intro: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field
                  label="Contenu"
                  hint="éditeur richtext (sauvegardé en JSON TipTap)"
                >
                  <div className="border border-[--k-border] rounded-lg overflow-hidden bg-white">
                    <RichTextEditor
                      value={form.contenu}
                      onChange={(json, text) =>
                        setForm((f) => ({
                          ...f,
                          contenu: json,
                          contenuText: text,
                        }))
                      }
                    />
                  </div>
                </Field>
                <Field label="Problème">
                  <textarea
                    className="input-field"
                    rows={5}
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

          <Card icon={HelpCircle} title="Questions">
            <textarea
              className="input-field"
              rows={4}
              value={form.question}
              onChange={(e) => updateForm("question", e.target.value)}
              placeholder="Questions fréquemment associées à ce document"
            />
          </Card>

          {!isNew && existing && (
            <Card icon={Paperclip} title="Documents joints">
              <AttachmentsManager postId={existing.id} />
            </Card>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          <Card icon={Layers} title="Catégorisation">
            <div className="space-y-3">
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
                    className="space-y-2 p-3 bg-[--k-surface-2] rounded-lg relative"
                  >
                    {form.categories.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          updateForm(
                            "categories",
                            form.categories.filter((_, i) => i !== idx),
                          )
                        }
                        className="absolute top-2 right-2 text-[--k-muted] hover:text-[--k-danger] transition"
                        title="Retirer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <Field label="Catégorie" required>
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
                    {row.categoryId && subCats.length > 0 && (
                      <Field label="Sous-catégorie">
                        <select
                          className="input-field"
                          value={row.subCategoryId ?? ""}
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
                    )}
                    {row.subCategoryId && subSubCats.length > 0 && (
                      <Field label="Sous-sous-catégorie">
                        <select
                          className="input-field"
                          value={row.subSubCategoryId ?? ""}
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
                    )}
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  updateForm("categories", [
                    ...form.categories,
                    {
                      categoryId: null,
                      subCategoryId: null,
                      subSubCategoryId: null,
                    },
                  ])
                }
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[--k-primary] hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter une catégorie
              </button>
            </div>
          </Card>

          <Card icon={Eye} title="Publication">
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
            <Field label="Niveaux d'accès" icon={Users}>
              <MultiSelect
                options={typeProfils.map((tp) => ({
                  id: tp.id,
                  label: tp.nom,
                }))}
                selectedIds={form.typeProfilIds}
                onChange={(ids) => updateForm("typeProfilIds", ids)}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm cursor-pointer mt-2 select-none">
              <input
                type="checkbox"
                checked={form.isFavourite}
                onChange={(e) => updateForm("isFavourite", e.target.checked)}
                className="rounded border-[--k-border]"
              />
              <Star
                className={`h-4 w-4 ${form.isFavourite ? "fill-amber-500 text-amber-500" : "text-[--k-muted]"}`}
              />
              <span className="text-[--k-text]">Afficher dans les favoris</span>
            </label>
          </Card>

          <Card icon={Server} title="Gammes de bornes">
            <div className="space-y-3">
              {form.modelBornes.length === 0 && (
                <p className="text-xs text-[--k-muted] italic">
                  Aucune gamme associée
                </p>
              )}
              {form.modelBornes.map((row, idx) => {
                const models = row.gammeBorneId
                  ? modelBornesByGamme.get(row.gammeBorneId) ?? []
                  : [];
                return (
                  <div
                    key={idx}
                    className="space-y-2 p-3 bg-[--k-surface-2] rounded-lg relative"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        updateForm(
                          "modelBornes",
                          form.modelBornes.filter((_, i) => i !== idx),
                        )
                      }
                      className="absolute top-2 right-2 text-[--k-muted] hover:text-[--k-danger] transition"
                      title="Retirer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
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
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[--k-primary] hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter une gamme
              </button>
            </div>
          </Card>

          <Card icon={TagIcon} title="Tags">
            <TagPicker
              tags={tags}
              selectedIds={form.tagIds}
              onChange={(ids) => updateForm("tagIds", ids)}
            />
          </Card>

          <Card icon={Link2} title="Articles liés">
            <RelatedPostsPicker
              selectedIds={form.relatedPostIds}
              excludeId={existing?.id}
              onChange={(ids) => updateForm("relatedPostIds", ids)}
            />
          </Card>
        </div>
      </div>

      {save.isError && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-[--k-danger]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Erreur lors de l'enregistrement.
        </div>
      )}

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[--k-border] bg-white/95 backdrop-blur-sm shadow-[0_-1px_4px_rgba(0,0,0,0.04)]">
        <div className="max-w-6xl mx-auto flex items-center justify-end gap-2 px-4 md:px-5 py-3">
          <button
            type="button"
            onClick={() => navigate("/admin/posts")}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[--k-text] border border-[--k-border] bg-white rounded-lg hover:bg-[--k-surface-2] transition"
          >
            <X className="h-4 w-4" />
            Annuler
          </button>
          <button
            type="button"
            onClick={() => save.mutate({ stayOnPage: true, data: form })}
            disabled={save.isPending || !form.titre}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[--k-text] border border-[--k-border] bg-white rounded-lg hover:bg-[--k-surface-2] transition disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Enregistrer et rester
          </button>
          <button
            type="button"
            onClick={() => save.mutate({ stayOnPage: false, data: form })}
            disabled={save.isPending || !form.titre}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[--k-primary] rounded-lg hover:brightness-110 transition disabled:opacity-50 shadow-sm shadow-[--k-primary]/30"
          >
            <Save className="h-4 w-4" />
            {save.isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----- Sous-composants -----

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-[--k-border] rounded-xl2 shadow-soft overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-[--k-border] bg-gradient-to-r from-white to-[--k-surface-2]/50">
        <Icon className="h-4 w-4 text-[--k-primary] shrink-0" />
        <h2 className="text-sm font-semibold text-[--k-text]">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  icon: Icon,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-[--k-muted]" />}
        <label className="block text-xs font-semibold text-[--k-text]">
          {label}
          {required && <span className="text-[--k-danger] ml-0.5">*</span>}
        </label>
        {hint && (
          <span className="text-[10px] text-[--k-muted] font-normal">
            ({hint})
          </span>
        )}
      </div>
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
      <Field label="Intro">
        <textarea
          className="input-field"
          rows={5}
          value={value.intro}
          onChange={(e) => onChange({ ...value, intro: e.target.value })}
        />
      </Field>
      <Field label="Contenu">
        <textarea
          className="input-field"
          rows={10}
          value={value.notice}
          onChange={(e) => onChange({ ...value, notice: e.target.value })}
        />
      </Field>
      <Field label="Problème">
        <textarea
          className="input-field"
          rows={5}
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
        <div className="px-3 py-2 text-xs text-[--k-muted] italic">
          Aucune option disponible
        </div>
      )}
      {options.map((opt) => {
        const checked = selectedIds.includes(opt.id);
        return (
          <label
            key={opt.id}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer transition ${
              checked
                ? "bg-[--k-primary-2] text-[--k-primary]"
                : "hover:bg-[--k-surface-2]"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(opt.id)}
              className="rounded border-[--k-border]"
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}

function TagPicker({
  tags,
  selectedIds,
  onChange,
}: {
  tags: TagDto[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const [search, setSearch] = useState("");
  const selectedTags = tags.filter((t) => selectedIds.includes(t.id));
  const filtered = tags
    .filter((t) => !selectedIds.includes(t.id))
    .filter((t) =>
      search.trim()
        ? t.name.toLowerCase().includes(search.toLowerCase())
        : true,
    )
    .slice(0, 30);

  return (
    <div className="space-y-2">
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-[--k-primary-2] text-[--k-primary] border border-[--k-primary-border] rounded-full text-xs font-medium"
            >
              {t.name}
              <button
                type="button"
                onClick={() => onChange(selectedIds.filter((x) => x !== t.id))}
                className="hover:text-[--k-danger] transition"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        className="input-field"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher un tag..."
      />
      {filtered.length > 0 && (
        <div className="border border-[--k-border] rounded-lg max-h-40 overflow-y-auto bg-white">
          {filtered.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange([...selectedIds, t.id])}
              className="w-full text-left text-sm px-3 py-1.5 hover:bg-[--k-surface-2] transition"
            >
              + {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ----- Serialisation -----

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
