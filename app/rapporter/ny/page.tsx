"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

/**
 * /rapporter/ny – creates a new report ID and redirects to the editor.
 */
export default function NyRapportPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/rapporter/${uuidv4()}/redigera`);
  }, [router]);

  return (
    <main className="page-container">
      <p>Skapar ny rapport…</p>
    </main>
  );
}
