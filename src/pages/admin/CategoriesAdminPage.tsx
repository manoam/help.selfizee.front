import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  AlertCircle,
  FolderTree,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";

import {
  api,
  type CategoryAdminDto,
  type SubCategoryDto,
  type SubSubCategoryDto,
} from "../../lib/api";
import { Modal } from "../../components/admin/Modal";

type Level = "cat" | "sub" | "subsub";

const TABS: { key: Level; label: string }[] = [
  { key: "cat", label: "Catégories" },
  { key: "sub", label: "Sous-catégories" },
  { key: "subsub", label: "Sous-sous-catégories" },
];

export function CategoriesAdminPage() {
  const [tab, setTab] = useState<Level>("cat");

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--k-text)]">Catégories</h1>
        <p className="text-sm text-[var(--k-muted)] mt-1">
          Gérez l'arborescence des catégories du centre d'assistance.
        </p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-[var(--k-border)]">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition ${
              tab === t.key
                ? "border-[var(--k-primary)] text-[var(--k-primary)]"
                : "border-transparent text-[var(--k-muted)] hover:text-[var(--k-text)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "cat" && <CategoriesTab />}
      {tab === "sub" && <SubCategoriesTab />}
      {tab === "subsub" && <SubSubCategoriesTab />}
    </div>
  );
}

// ---------- Onglet Catégories (niveau 1) ----------
function CategoriesTab() {
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<CategoryAdminDto | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () =>
      (await api.get<CategoryAdminDto[]>("/categories?all=1")).data,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const create = useMutation({
    mutationFn: async (nom: string) =>
      (await api.post("/categories", { nom })).data,
    onSuccess: () => {
      setNewName("");
      invalidate();
    },
  });
  const remove = useMutation({
    mutationFn: async (id: number) => api.delete(`/categories/${id}`),
    onSuccess: invalidate,
  });

  return (
    <div>
      <CreateRow
        placeholder="Nom de la catégorie"
        value={newName}
        onChange={setNewName}
        onSubmit={() => create.mutate(newName)}
        pending={create.isPending}
        error={create.isError}
      />

      <div className="bg-white border border-[var(--k-border)] rounded-xl2 shadow-soft overflow-hidden">
        {isLoading && (
          <div className="p-8 text-center text-sm text-[var(--k-muted)]">
            Chargement…
          </div>
        )}
        {!isLoading && rows.length === 0 && (
          <div className="p-12 text-center">
            <FolderTree className="h-12 w-12 mx-auto mb-3 text-[var(--k-muted)] opacity-50" />
            <p className="text-sm font-medium text-[var(--k-text)]">
              Aucune catégorie
            </p>
          </div>
        )}
        {!isLoading && rows.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-left border-b border-[var(--k-border)] bg-[var(--k-surface-2)]/40">
              <tr>
                <Th>Icône</Th>
                <Th>Nom</Th>
                <Th>Slug</Th>
                <Th>Sous-cat.</Th>
                <Th>Fiches</Th>
                <Th>Visible</Th>
                <th className="py-2.5 px-4 text-right text-xs font-semibold uppercase tracking-wide text-[var(--k-muted)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--k-border)] last:border-0 hover:bg-[var(--k-surface-2)]/40 transition group"
                >
                  <td className="py-3 px-4">
                    {r.iconeUrl ? (
                      <img
                        src={`${api.defaults.baseURL ?? ""}${r.iconeUrl}`}
                        alt=""
                        className="h-8 w-8 rounded object-cover border border-[var(--k-border)]"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-[var(--k-surface-2)] flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-[var(--k-muted)] opacity-50" />
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-[var(--k-text)]">
                    {r.nom}
                  </td>
                  <td className="py-3 px-4 text-[var(--k-muted)] font-mono text-xs">
                    {r.slug}
                  </td>
                  <td className="py-3 px-4 text-[var(--k-muted)]">
                    {r._count?.subCategories ?? 0}
                  </td>
                  <td className="py-3 px-4 text-[var(--k-muted)]">
                    {r._count?.posts ?? 0}
                  </td>
                  <td className="py-3 px-4">
                    {r.afficher ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <Eye className="h-3 w-3" /> Affichée
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--k-muted)] bg-[var(--k-surface-2)] px-2 py-0.5 rounded-full">
                        <EyeOff className="h-3 w-3" /> Masquée
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={() => setEditing(r)}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[var(--k-muted)] hover:text-[var(--k-primary)] hover:bg-[var(--k-primary-2)] transition"
                        title="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              `Supprimer la catégorie "${r.nom}" ? Ses sous-catégories et sous-sous-catégories seront aussi supprimées.`,
                            )
                          )
                            remove.mutate(r.id);
                        }}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[var(--k-muted)] hover:text-[var(--k-danger)] hover:bg-red-50 transition"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CategoryEditModal
        category={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          invalidate();
        }}
      />
    </div>
  );
}

// Modal d'édition d'une catégorie : nom, slug, description, icône (upload),
// visibilité (afficher). Reproduit les champs du CRM (icone_name + afficher).
function CategoryEditModal({
  category,
  onClose,
  onSaved,
}: {
  category: CategoryAdminDto | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [nom, setNom] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [iconeUrl, setIconeUrl] = useState<string | null>(null);
  const [afficher, setAfficher] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Réinitialise le formulaire à chaque ouverture (nouvelle catégorie).
  useEffect(() => {
    if (!category) return;
    setNom(category.nom);
    setSlug(category.slug);
    setDescription(category.description ?? "");
    setIconeUrl(category.iconeUrl);
    setAfficher(category.afficher);
  }, [category]);

  const save = useMutation({
    mutationFn: async () => {
      if (!category) return;
      return (
        await api.put(`/categories/${category.id}`, {
          nom,
          slug: slug || undefined,
          description: description || null,
          iconeUrl,
          afficher,
        })
      ).data;
    },
    onSuccess: onSaved,
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post<{ url: string }>("/upload/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setIconeUrl(data.url);
    } catch {
      alert("Upload échoué (image trop lourde ou format non supporté).");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <Modal
      open={category !== null}
      onClose={onClose}
      title="Modifier la catégorie"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-[var(--k-text)] border border-[var(--k-border)] bg-white rounded-lg hover:bg-[var(--k-surface-2)] transition"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={!nom.trim() || save.isPending || uploading}
            className="px-3 py-1.5 text-sm font-semibold text-white bg-[var(--k-primary)] rounded-lg hover:brightness-110 transition disabled:opacity-50"
          >
            Enregistrer
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nom">
          <input
            className="input-field"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            autoFocus
          />
        </Field>
        <Field label="Slug (laisser vide pour auto-générer)">
          <input
            className="input-field font-mono text-xs"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto depuis le nom"
          />
        </Field>
        <Field label="Description">
          <textarea
            className="input-field"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <Field label="Icône">
          <div className="flex items-center gap-3">
            {iconeUrl ? (
              <img
                src={`${api.defaults.baseURL ?? ""}${iconeUrl}`}
                alt=""
                className="h-14 w-14 rounded object-cover border border-[var(--k-border)]"
              />
            ) : (
              <div className="h-14 w-14 rounded bg-[var(--k-surface-2)] flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-[var(--k-muted)] opacity-50" />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--k-text)] border border-[var(--k-border)] bg-white rounded-lg hover:bg-[var(--k-surface-2)] transition disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
                {iconeUrl ? "Changer l'image" : "Choisir une image"}
              </button>
              {iconeUrl && (
                <button
                  type="button"
                  onClick={() => setIconeUrl(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-[var(--k-danger)] hover:underline"
                >
                  <Trash2 className="h-3 w-3" /> Retirer l'image
                </button>
              )}
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleUpload(f);
              }}
            />
          </div>
        </Field>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={afficher}
            onChange={(e) => setAfficher(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--k-border)] accent-[var(--k-primary)]"
          />
          <span className="text-sm text-[var(--k-text)]">
            Afficher cette catégorie sur le site public
          </span>
        </label>
      </div>
    </Modal>
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
      <label className="block text-xs font-semibold text-[var(--k-text)] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

// ---------- Onglet Sous-catégories (niveau 2) ----------
function SubCategoriesTab() {
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [parentId, setParentId] = useState<number | "">("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const { data: parents = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () =>
      (await api.get<CategoryAdminDto[]>("/categories?all=1")).data,
  });
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-subcategories"],
    queryFn: async () =>
      (await api.get<SubCategoryDto[]>("/categories/sub")).data,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-subcategories"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };
  const parentName = (id: number) =>
    parents.find((p) => p.id === id)?.nom ?? "—";

  const create = useMutation({
    mutationFn: async () =>
      (await api.post("/categories/sub", { nom: newName, categoryId: parentId }))
        .data,
    onSuccess: () => {
      setNewName("");
      invalidate();
    },
  });
  const update = useMutation({
    mutationFn: async ({ id, nom }: { id: number; nom: string }) =>
      (await api.put(`/categories/sub/${id}`, { nom })).data,
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
  });
  const remove = useMutation({
    mutationFn: async (id: number) => api.delete(`/categories/sub/${id}`),
    onSuccess: invalidate,
  });

  return (
    <div>
      <CreateRow
        placeholder="Nom de la sous-catégorie"
        value={newName}
        onChange={setNewName}
        onSubmit={() => create.mutate()}
        pending={create.isPending}
        error={create.isError}
        disabled={parentId === ""}
        parentSelect={
          <select
            className="input-field w-56"
            value={parentId}
            onChange={(e) =>
              setParentId(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">Catégorie parente…</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
        }
      />
      <Table
        isLoading={isLoading}
        empty={rows.length === 0}
        extraCols={["Catégorie parente"]}
      >
        {rows.map((r) => (
          <Row
            key={r.id}
            name={r.nom}
            slug={r.slug}
            editing={editingId === r.id}
            editName={editName}
            onEditNameChange={setEditName}
            onStartEdit={() => {
              setEditingId(r.id);
              setEditName(r.nom);
            }}
            onSave={() => update.mutate({ id: r.id, nom: editName })}
            onCancel={() => setEditingId(null)}
            onDelete={() => {
              if (
                confirm(
                  `Supprimer la sous-catégorie "${r.nom}" ? Ses sous-sous-catégories seront aussi supprimées.`,
                )
              )
                remove.mutate(r.id);
            }}
            extra={[parentName(r.categoryId)]}
          />
        ))}
      </Table>
    </div>
  );
}

// ---------- Onglet Sous-sous-catégories (niveau 3) ----------
function SubSubCategoriesTab() {
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [parentId, setParentId] = useState<number | "">("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const { data: parents = [] } = useQuery({
    queryKey: ["admin-subcategories"],
    queryFn: async () =>
      (await api.get<SubCategoryDto[]>("/categories/sub")).data,
  });
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-subsubcategories"],
    queryFn: async () =>
      (await api.get<SubSubCategoryDto[]>("/categories/sub-sub")).data,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-subsubcategories"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };
  const parentName = (id: number) =>
    parents.find((p) => p.id === id)?.nom ?? "—";

  const create = useMutation({
    mutationFn: async () =>
      (
        await api.post("/categories/sub-sub", {
          nom: newName,
          subCategoryId: parentId,
        })
      ).data,
    onSuccess: () => {
      setNewName("");
      invalidate();
    },
  });
  const update = useMutation({
    mutationFn: async ({ id, nom }: { id: number; nom: string }) =>
      (await api.put(`/categories/sub-sub/${id}`, { nom })).data,
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
  });
  const remove = useMutation({
    mutationFn: async (id: number) => api.delete(`/categories/sub-sub/${id}`),
    onSuccess: invalidate,
  });

  return (
    <div>
      <CreateRow
        placeholder="Nom de la sous-sous-catégorie"
        value={newName}
        onChange={setNewName}
        onSubmit={() => create.mutate()}
        pending={create.isPending}
        error={create.isError}
        disabled={parentId === ""}
        parentSelect={
          <select
            className="input-field w-56"
            value={parentId}
            onChange={(e) =>
              setParentId(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">Sous-catégorie parente…</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
        }
      />
      <Table
        isLoading={isLoading}
        empty={rows.length === 0}
        extraCols={["Sous-catégorie parente"]}
      >
        {rows.map((r) => (
          <Row
            key={r.id}
            name={r.nom}
            slug={r.slug}
            editing={editingId === r.id}
            editName={editName}
            onEditNameChange={setEditName}
            onStartEdit={() => {
              setEditingId(r.id);
              setEditName(r.nom);
            }}
            onSave={() => update.mutate({ id: r.id, nom: editName })}
            onCancel={() => setEditingId(null)}
            onDelete={() => {
              if (confirm(`Supprimer la sous-sous-catégorie "${r.nom}" ?`))
                remove.mutate(r.id);
            }}
            extra={[parentName(r.subCategoryId)]}
          />
        ))}
      </Table>
    </div>
  );
}

// ---------- Sous-composants partagés ----------
function CreateRow({
  placeholder,
  value,
  onChange,
  onSubmit,
  pending,
  error,
  disabled = false,
  parentSelect,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  pending: boolean;
  error: boolean;
  disabled?: boolean;
  parentSelect?: React.ReactNode;
}) {
  const canSubmit = value.trim() && !disabled && !pending;
  return (
    <div className="bg-white border border-[var(--k-border)] rounded-xl2 shadow-soft p-4 mb-6">
      <div className="flex gap-2 flex-wrap">
        {parentSelect}
        <input
          className="input-field flex-1 min-w-[200px]"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSubmit) onSubmit();
          }}
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-[var(--k-primary)] rounded-lg hover:brightness-110 transition disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Créer
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-2 mt-2 text-xs text-[var(--k-danger)]">
          <AlertCircle className="h-3.5 w-3.5" />
          Erreur (doublon ou parent manquant ?)
        </div>
      )}
    </div>
  );
}

function Table({
  isLoading,
  empty,
  extraCols,
  children,
}: {
  isLoading: boolean;
  empty: boolean;
  extraCols: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-[var(--k-border)] rounded-xl2 shadow-soft overflow-hidden">
      {isLoading && (
        <div className="p-8 text-center text-sm text-[var(--k-muted)]">
          Chargement…
        </div>
      )}
      {!isLoading && empty && (
        <div className="p-12 text-center">
          <FolderTree className="h-12 w-12 mx-auto mb-3 text-[var(--k-muted)] opacity-50" />
          <p className="text-sm font-medium text-[var(--k-text)]">
            Aucun élément
          </p>
        </div>
      )}
      {!isLoading && !empty && (
        <table className="w-full text-sm">
          <thead className="text-left border-b border-[var(--k-border)] bg-[var(--k-surface-2)]/40">
            <tr>
              <Th>Nom</Th>
              <Th>Slug</Th>
              {extraCols.map((c) => (
                <Th key={c}>{c}</Th>
              ))}
              <th className="py-2.5 px-4 text-right text-xs font-semibold uppercase tracking-wide text-[var(--k-muted)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="py-2.5 px-4 text-xs font-semibold uppercase tracking-wide text-[var(--k-muted)]">
      {children}
    </th>
  );
}

function Row({
  name,
  slug,
  editing,
  editName,
  onEditNameChange,
  onStartEdit,
  onSave,
  onCancel,
  onDelete,
  extra,
}: {
  name: string;
  slug: string;
  editing: boolean;
  editName: string;
  onEditNameChange: (v: string) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  extra: (string | number)[];
}) {
  return (
    <tr className="border-b border-[var(--k-border)] last:border-0 hover:bg-[var(--k-surface-2)]/40 transition group">
      <td className="py-3 px-4">
        {editing ? (
          <input
            autoFocus
            className="input-field"
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave();
              if (e.key === "Escape") onCancel();
            }}
          />
        ) : (
          <span className="font-medium text-[var(--k-text)]">{name}</span>
        )}
      </td>
      <td className="py-3 px-4 text-[var(--k-muted)] font-mono text-xs">
        {slug}
      </td>
      {extra.map((val, i) => (
        <td key={i} className="py-3 px-4 text-[var(--k-muted)]">
          {val}
        </td>
      ))}
      <td className="py-3 px-4 text-right">
        {editing ? (
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={onSave}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-emerald-600 hover:bg-emerald-50 transition"
              title="Enregistrer"
            >
              <Save className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[var(--k-muted)] hover:bg-[var(--k-surface-2)] transition"
              title="Annuler"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
            <button
              type="button"
              onClick={onStartEdit}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[var(--k-muted)] hover:text-[var(--k-primary)] hover:bg-[var(--k-primary-2)] transition"
              title="Éditer"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[var(--k-muted)] hover:text-[var(--k-danger)] hover:bg-red-50 transition"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
