"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SupabaseGoogleButton({
  label = "Continue with Google",
}: {
  label?: string;
}) {
  const [error, setError] = useState("");

  async function signIn() {
    setError("");

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/profile")}`;
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (signInError) {
        setError("Google sign-in is unavailable right now. Try again.");
      }
    } catch {
      setError("Google sign-in is not configured yet.");
    }
  }

  return (
    <div className="grid gap-2">
      <button type="button" className="btn btn-ghost w-full" onClick={signIn}>
      {label}
      </button>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
