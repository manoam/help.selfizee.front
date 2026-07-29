import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Upload,
  Database,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  FileWarning,
  ImageDown,
} from "lucide-react";

import { api } from "../../lib/api";

type ImportReport = {
  ok: boolean;
  present: string[];
  missing: string[];
  logs: string[];
  counts: { posts: number; tags: number; categories: number };
  error?: string;
};

export function ImportPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFile = (f: File | null) => {
    setReport(null);
    setErrorMsg(null);
    if (f && !f.name.toLowerCase().endsWith(".sql")) {
      setErrorMsg("Le fichier doit être un export .sql (dump CRM).");
      setFile(null);
      return;
    }
    setFile(f);
  };

  const runImport = async () => {
    if (!file) return;
    setBusy(true);
    setReport(null);
    setErrorMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post<ImportReport>("/admin/import", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        // L'import peut prendre du temps (jsdom + upserts). Pas de timeout court.
        timeout: 5 * 60 * 1000,
      });
      setReport(data);
    } catch (err) {
      const e = err as {
        response?: { status?: number; data?: { error?: string; message?: string } };
      };
      const status = e.response?.status;
      const apiErr = e.response?.data;
      if (apiErr?.message) setErrorMsg(apiErr.message);
      else if (apiErr?.error) setErrorMsg(`Erreur: ${apiErr.error}`);
      else if (status === 403) setErrorMsg("Accès refusé — rôle admin requis.");
      else if (status === 413) setErrorMsg("Fichier trop volumineux (max 40 Mo).");
      else setErrorMsg("Échec de l'import. Vérifie le fichier et réessaie.");
      // Certaines erreurs renvoient quand même un rapport partiel.
      if (
        apiErr &&
        typeof apiErr === "object" &&
        "logs" in apiErr
      ) {
        setReport(apiErr as unknown as ImportReport);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-3xl">
      <Link
        to="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--k-muted)] hover:text-[var(--k-text)] transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au tableau de bord
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--k-text)] flex items-center gap-2">
          <Database className="h-6 w-6 text-[var(--k-primary)]" />
          Importer le CRM
        </h1>
        <p className="text-sm text-[var(--k-muted)] mt-1">
          Dépose l'export <code className="font-mono">crm_app.sql</code> (ou un
          export phpMyAdmin des tables <code className="font-mono">posts</code>,{" "}
          <code className="font-mono">post_tags</code>, …). Les fiches sont
          mises à jour via leur identifiant legacy (idempotent : ré-importer ne
          crée pas de doublons).
        </p>
      </div>

      {/* Zone d'upload */}
      <div className="bg-white border border-[var(--k-border)] rounded-xl2 shadow-soft p-6">
        <div
          onClick={() => !busy && fileInput.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (busy) return;
            handleFile(e.dataTransfer.files?.[0] ?? null);
          }}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
            busy
              ? "opacity-50 cursor-not-allowed border-[var(--k-border)]"
              : "cursor-pointer border-[var(--k-border)] hover:border-[var(--k-primary)] hover:bg-[var(--k-surface-2)]/40"
          }`}
        >
          <Upload className="h-8 w-8 mx-auto text-[var(--k-muted)] mb-2" />
          {file ? (
            <p className="text-sm text-[var(--k-text)] font-medium">
              {file.name}{" "}
              <span className="text-[var(--k-muted)]">
                ({(file.size / 1024 / 1024).toFixed(1)} Mo)
              </span>
            </p>
          ) : (
            <p className="text-sm text-[var(--k-muted)]">
              Clique ou glisse un fichier <strong>.sql</strong> ici
            </p>
          )}
        </div>

        <input
          ref={fileInput}
          type="file"
          accept=".sql,application/sql,text/plain"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />

        {errorMsg && (
          <div className="mt-4 flex items-start gap-2 text-sm text-[var(--k-danger)] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <FileWarning className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            disabled={!file || busy}
            onClick={runImport}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[var(--k-primary)] rounded-lg hover:brightness-110 transition disabled:opacity-50 shadow-sm shadow-[var(--k-primary)]/30"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Import en cours…
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                Lancer l'import
              </>
            )}
          </button>
          {file && !busy && (
            <button
              type="button"
              onClick={() => handleFile(null)}
              className="px-3 py-2 text-sm text-[var(--k-muted)] hover:text-[var(--k-text)] transition"
            >
              Annuler
            </button>
          )}
        </div>
      </div>

      {/* Rapatriement des images du CRM */}
      <RapatriementSection />

      {/* Rapport */}
      {report && (
        <div className="mt-6 bg-white border border-[var(--k-border)] rounded-xl2 shadow-soft p-6">
          <div className="flex items-center gap-2 mb-4">
            {report.ok ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-[var(--k-danger)]" />
            )}
            <h2 className="text-sm font-semibold text-[var(--k-text)]">
              {report.ok ? "Import terminé" : "Import échoué"}
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <ReportStat label="Fiches" value={report.counts.posts} />
            <ReportStat label="Tags" value={report.counts.tags} />
            <ReportStat label="Catégories" value={report.counts.categories} />
          </div>

          {report.present.length > 0 && (
            <p className="text-xs text-[var(--k-muted)] mb-1">
              Tables importées : {report.present.join(", ")}
            </p>
          )}
          {report.missing.length > 0 && (
            <p className="text-xs text-amber-600 mb-3">
              Tables absentes du dump (sautées) : {report.missing.join(", ")}
            </p>
          )}

          {report.error && (
            <div className="text-sm text-[var(--k-danger)] bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
              {report.error}
            </div>
          )}

          <details className="text-xs">
            <summary className="cursor-pointer text-[var(--k-muted)] hover:text-[var(--k-text)] select-none">
              Voir le journal détaillé ({report.logs.length} lignes)
            </summary>
            <pre className="mt-2 max-h-72 overflow-auto bg-[var(--k-surface-2)]/40 rounded-lg p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
              {report.logs.join("\n")}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

function ReportStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[var(--k-surface-2)]/40 rounded-lg p-3 text-center">
      <div className="text-xl font-bold text-[var(--k-text)]">{value}</div>
      <div className="text-xs text-[var(--k-muted)]">{label}</div>
    </div>
  );
}

type RapatriementStatus = {
  finished: boolean;
  filesOnDisk: number;
  progress: {
    phase: "downloading" | "rewriting" | "done";
    total: number;
    done?: number;
    ok?: number;
    ko?: number;
    rewritten?: number;
  } | null;
};

// Télécharge les images des fiches depuis l'ancien CRM (crm.konitys.fr) vers
// notre serveur et réécrit les liens. À lancer une fois (avant l'arrêt du CRM).
function RapatriementSection() {
  const [status, setStatus] = useState<RapatriementStatus | null>(null);
  const [starting, setStarting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const { data } = await api.get<RapatriementStatus>(
        "/admin/rapatriement-status",
      );
      setStatus(data);
    } catch {
      /* ignore */
    }
  };

  // Charge le statut au montage puis poll toutes les 3s. On garde le poll actif
  // en continu (léger) pour refléter un rapatriement lancé au boot ou ailleurs.
  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = async () => {
    setStarting(true);
    setMsg(null);
    try {
      await api.post("/admin/rapatriement/run");
      setMsg("Rapatriement lancé — il continue en arrière-plan.");
      setTimeout(fetchStatus, 1500);
    } catch (err) {
      const e = err as { response?: { status?: number } };
      if (e.response?.status === 409)
        setMsg("Un rapatriement est déjà en cours.");
      else if (e.response?.status === 404)
        setMsg("Endpoint absent — le back n'est pas encore redéployé.");
      else setMsg("Échec du lancement.");
    } finally {
      setStarting(false);
    }
  };

  const p = status?.progress;
  const inProgress = Boolean(p && !status?.finished);
  const pct =
    p && p.total > 0 && p.done != null
      ? Math.round((p.done / p.total) * 100)
      : 0;

  return (
    <div className="mt-6 bg-white border border-[var(--k-border)] rounded-xl2 shadow-soft p-6">
      <h2 className="text-sm font-semibold text-[var(--k-text)] flex items-center gap-2 mb-1">
        <ImageDown className="h-4 w-4 text-[var(--k-primary)]" />
        Rapatrier les images du CRM
      </h2>
      <p className="text-xs text-[var(--k-muted)] mb-4">
        Télécharge toutes les images des fiches depuis l'ancien serveur{" "}
        <code className="font-mono">crm.konitys.fr</code> vers notre serveur et
        remplace les liens. À lancer une fois, avant l'arrêt du CRM.
      </p>

      {/* État */}
      {status && (
        <div className="mb-4 text-xs text-[var(--k-muted)]">
          {status.finished ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Terminé — {status.filesOnDisk} images sur le serveur.
            </span>
          ) : inProgress ? (
            <span>
              En cours — {p?.done ?? 0}/{p?.total ?? 0} ({p?.ok ?? 0} ok,{" "}
              {p?.ko ?? 0} échecs)
              {p?.phase === "rewriting" && " — réécriture des liens…"}
            </span>
          ) : (
            <span>{status.filesOnDisk} images actuellement sur le serveur.</span>
          )}
        </div>
      )}

      {/* Barre de progression */}
      {inProgress && (
        <div className="mb-4 h-2 w-full rounded-full bg-[var(--k-surface-2)] overflow-hidden">
          <div
            className="h-full bg-[var(--k-primary)] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <button
        type="button"
        onClick={start}
        disabled={starting || inProgress}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[var(--k-primary)] rounded-lg hover:brightness-110 transition disabled:opacity-50"
      >
        {starting || inProgress ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {inProgress ? "Rapatriement en cours…" : "Lancement…"}
          </>
        ) : (
          <>
            <ImageDown className="h-4 w-4" />
            {status?.finished ? "Relancer" : "Lancer le rapatriement"}
          </>
        )}
      </button>

      {msg && <p className="mt-3 text-xs text-[var(--k-muted)]">{msg}</p>}
    </div>
  );
}
