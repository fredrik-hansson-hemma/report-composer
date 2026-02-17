"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getReport } from "@/lib/store";
import { Report } from "@/lib/types";

const ReportRenderer = dynamic(
  () => import("@/components/report/ReportRenderer"),
  { ssr: false, loading: () => <div className="page-container">Laddar rapport…</div> }
);

export default function VisaRapportPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const r = getReport(id);
    if (r) {
      setReport(r);
    } else {
      setNotFound(true);
    }
  }, [id]);

  if (notFound) {
    return (
      <main className="page-container">
        <h1>Rapport hittades inte</h1>
        <Link href="/rapporter" className="btn btn-ghost">
          ← Alla rapporter
        </Link>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="page-container">
        <p>Laddar…</p>
      </main>
    );
  }

  return (
    <>
      {/* Print-hidden navigation */}
      <header className="viewer-topbar no-print">
        <Link href="/rapporter" className="btn btn-ghost">
          ← Rapporter
        </Link>
        <div className="viewer-topbar-actions">
          <span className={`status-badge status-badge--${report.status}`}>
            {report.status === "published" ? "Publicerad" : "Utkast"}
          </span>
          <Link href={`/rapporter/${id}/redigera`} className="btn btn-ghost">
            Redigera
          </Link>
          <button className="btn btn-ghost" onClick={() => window.print()}>
            Skriv ut / Spara PDF
          </button>
        </div>
      </header>

      {/* Report content */}
      <main className="viewer-main">
        <div className="report-wrapper">
          <h1 className="report-title">{report.title || "Namnlös rapport"}</h1>

          {report.content.length === 0 ? (
            <p className="report-empty">Rapporten har inget innehåll ännu.</p>
          ) : (
            <ReportRenderer blocks={report.content} />
          )}
        </div>
      </main>
    </>
  );
}
