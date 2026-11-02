"use client";

import { useState } from "react";

export function AdminResetPasswordButton({
  adminId,
  email,
}: {
  adminId: number;
  email: string;
}) {
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  async function handleReset() {
    if (
      !window.confirm(
        `Generate a new temporary password for ${email}? Their current sessions will be invalidated.`
      )
    ) {
      return;
    }

    setIsResetting(true);
    const response = await fetch(`/api/admin/users/${adminId}/password`, {
      method: "PATCH",
    });
    const data = await response.json().catch(() => ({}));
    setIsResetting(false);

    if (!response.ok) {
      window.alert(data.error || "Unable to reset the temporary password.");
      return;
    }

    setTemporaryPassword(data.temporaryPassword);
  }

  if (temporaryPassword) {
    return (
      <span className="technical-label text-xs font-bold" title="Show once">
        {temporaryPassword}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleReset}
      disabled={isResetting}
      className="btn btn-ghost btn-sm"
    >
      {isResetting ? "Resetting..." : "Reset password"}
    </button>
  );
}
