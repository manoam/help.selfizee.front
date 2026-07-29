import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Save, X, AlertCircle, FolderTree } from "lucide-react";

import {
  api,
  type CategoryAdminDto,
  type SubCategoryDto,
  type SubSubCategoryDto,
} from "../../lib/api";

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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

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
  const update = useMutation({
    mutationFn: async ({ id, nom }: { id: number; nom: string }) =>
      (await api.put(`/categories/${id}`, { nom })).data,
    onSuccess: () => {
      setEditingId(null);
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
      <Table
        isLoading={isLoading}
        empty={rows.length === 0}
        extraCols={["Sous-cat.", "Fiches"]}
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
                  `Supprimer la catégorie "${r.nom}" ? Ses sous-catégories et sous-sous-catégories seront aussi supprimées.`,
                )
              )
                remove.mutate(r.id);
            }}
            extra={[r._count?.subCategories ?? 0, r._count?.posts ?? 0]}
          />
        ))}
      </Table>
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
