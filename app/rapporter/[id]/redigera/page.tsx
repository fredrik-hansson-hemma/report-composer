"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getReport, saveReport } from "@/lib/store";
import { Report } from "@/lib/types";

// The editor is purely client-side (BlockNote + Highcharts)
const ReportEditor = dynamic(
  () => import("@/components/editor/ReportEditor"),
  { ssr: false, loading: () => <div className="editor-loading">Laddar editor…</div> }
);

export default function RedigeraPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [title, setTitle] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  // Load or create report
  useEffect(() => {
    const existing = getReport(id);
    if (existing) {
      setReport(existing);
      setTitle(existing.title);
    } else {
      const fresh: Report = {
        id,
        title: "",
        content: [],
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveReport(fresh);
      setReport(fresh);
    }
  }, [id]);

  const handleContentChange = useCallback(
    (content: unknown[]) => {
      if (!report) return;
      setSaveStatus("saving");
      const updated: Report = {
        ...report,
        title,
        content: content as Report["content"],
        updatedAt: new Date().toISOString(),
      };
      saveReport(updated);
      setReport(updated);
      setSaveStatus("saved");
    },
    [report, title]
  );

  const handleTitleBlur = () => {
    if (!report) return;
    const updated: Report = {
      ...report,
      title,
      updatedAt: new Date().toISOString(),
    };
    saveReport(updated);
    setReport(updated);
  };

  const handlePublish = () => {
    if (!report) return;
    const updated: Report = {
      ...report,
      title,
      status: report.status === "published" ? "draft" : "published",
      updatedAt: new Date().toISOString(),
    };
    saveReport(updated);
    setReport(updated);
  };

  if (!report) {
    return (
      <main className="page-container">
        <p>Laddar…</p>
      </main>
    );
  }

  return (
    <div className="editor-layout">
      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <header className="editor-topbar">
        <Link href="/rapporter" className="btn btn-ghost editor-back">
          ← Rapporter
        </Link>

        <input
          className="editor-title-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          placeholder="Rapportens titel…"
        />

        <div className="editor-topbar-actions">
          <span className="save-status">
            {saveStatus === "saving" ? "Sparar…" : saveStatus === "saved" ? "Sparat" : "Osparade ändringar"}
          </span>
          <Link
            href={`/rapporter/${id}`}
            className="btn btn-ghost"
            target="_blank"
          >
            Förhandsgranska
          </Link>
          <button
            className={`btn ${report.status === "published" ? "btn-secondary" : "btn-primary"}`}
            onClick={handlePublish}
          >
            {report.status === "published" ? "Avpublicera" : "Publicera"}
          </button>
        </div>
      </header>

      {/* ── Status banner ─────────────────────────────────────────────── */}
      <div className="editor-status-bar">
        <span className={`status-badge status-badge--${report.status}`}>
          {report.status === "published" ? "Publicerad" : "Utkast"}
        </span>
        <span className="editor-help-hint">
          Tryck <kbd>/</kbd> för att infoga block · Diagram-URL: <code>?typ=linje&amp;indikator=overlevnad</code>
        </span>
      </div>

      {/* ── Editor ────────────────────────────────────────────────────── */}
      <div className="editor-canvas">
        <ReportEditor
          key={id}
          initialContent={report.content.length > 0 ? report.content : undefined}
          onChange={handleContentChange}
        />
      </div>
    </div>
  );
}
