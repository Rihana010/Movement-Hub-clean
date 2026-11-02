"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteEventButton({
  eventId,
  title,
  signupCount,
}: {
  eventId: number;
  title: string;
  signupCount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    const warning = signupCount
      ? `Delete "${title}" and its ${signupCount} volunteer sign-ups? This can't be undone. Archive it instead if you only want to hide it.`
      : `Delete "${title}"? This can't be undone.`;

    if (!window.confirm(warning)) return;

    setBusy(true);
    const response = await fetch(`/api/admin/events/${eventId}`, { method: "DELETE" });
    setBusy(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      window.alert(data.error || "Couldn't delete the event. Try again.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={busy}
      className="btn btn-ghost btn-sm"
      style={{ color: "var(--brick)" }}
    >
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
