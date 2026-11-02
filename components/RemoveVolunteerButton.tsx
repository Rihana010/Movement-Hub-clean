"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RemoveVolunteerButton({
  eventId,
  signupId,
  name,
}: {
  eventId: number;
  signupId: number;
  name: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleRemove() {
    if (!window.confirm(`Remove ${name} from this event? Their spot opens up again.`)) return;

    setBusy(true);
    const response = await fetch(
      `/api/admin/events/${eventId}/signups/${signupId}`,
      { method: "DELETE" }
    );
    setBusy(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      window.alert(data.error || "Couldn't remove this volunteer. Try again.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={busy}
      className="btn btn-ghost btn-sm"
      style={{ color: "var(--brick)" }}
    >
      {busy ? "Removing…" : "Remove"}
    </button>
  );
}
