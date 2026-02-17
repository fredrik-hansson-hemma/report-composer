"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAllReports, deleteReport } from "@/lib/store";
import { Report } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RapporterPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    setReports(getAllReports());
  }, []);

  const handleNew = () => {
    const id = uuidv4();
    router.push(`/rapporter/${id}/redigera`);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Ta bort rapporten?")) return;
    deleteReport(id);
    setReports(getAllReports());
  };

  return (
    <main className="page-container">
      <div className="page-header">
        <h1 className="page-title">Rapporter</h1>
        <button className="btn btn-primary" onClick={handleNew}>
          + Ny rapport
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="empty-state">
          <p>Inga rapporter ännu.</p>
          <button className="btn btn-primary" onClick={handleNew}>
            Skapa din första rapport
          </button>
        </div>
      ) : (
        <ul className="report-list">
          {reports.map((r) => (
            <li key={r.id} className="report-list-item">
              <div className="report-list-meta">
                <Link
                  href={`/rapporter/${r.id}`}
                  className="report-list-title"
                >
                  {r.title || "Namnlös rapport"}
                </Link>
                <div className="report-list-sub">
                  <span
                    className={`status-badge status-badge--${r.status}`}
                  >
                    {r.status === "published" ? "Publicerad" : "Utkast"}
                  </span>
                  <span className="report-list-date">
                    Uppdaterad {formatDate(r.updatedAt)}
                  </span>
                </div>
              </div>
              <div className="report-list-actions">
                <Link
                  href={`/rapporter/${r.id}`}
                  className="btn btn-ghost"
                >
                  Visa
                </Link>
                <Link
                  href={`/rapporter/${r.id}/redigera`}
                  className="btn btn-ghost"
                >
                  Redigera
                </Link>
                <button
                  className="btn btn-ghost btn-danger"
                  onClick={() => handleDelete(r.id)}
                >
                  Ta bort
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
