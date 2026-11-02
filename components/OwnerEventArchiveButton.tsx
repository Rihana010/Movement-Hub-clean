"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OwnerEventArchiveButton({
  eventId,
  isActive,
}: {
  eventId: number;
  isActive: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function update() {
    setBusy(true);
    await fetch(`/api/missions/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button type="button" className="btn btn-ghost" onClick={update} disabled={busy}>
      {busy ? "Updating..." : isActive ? "Archive" : "Restore"}
    </button>
  );
}
