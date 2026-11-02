"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { extractInviteCode } from "@/lib/inviteParse";
import { SupabaseGoogleButton } from "@/components/SupabaseGoogleButton";

type Role = "volunteer" | "organizer";

export function Gateway({
  initialRole,
  signedInAs,
}: {
  initialRole: Role;
  signedInAs: string | null;
}) {
  const [role, setRole] = useState<Role>(initialRole);

  return (
    <div className="gate-body">
      <div>
        <h1 className="gate-title">
          {role === "volunteer"
            ? "Volunteer with Movement Hub"
            : "Organizer Sign In"}
        </h1>
        <p className="gate-lede">
          {role === "volunteer"
            ? "Continue with Google to view the Heat Map and join missions."
            : "Manage your rosters, events, and platform settings."}
        </p>
      </div>

      <div className="grid gap-5">
        <div className="roles" role="tablist" aria-label="Choose an account path">
          <button
            type="button"
            role="tab"
            id="tab-volunteer"
            aria-selected={role === "volunteer"}
            aria-controls="panel"
            onClick={() => setRole("volunteer")}
          >
            <strong>Volunteer</strong>
            <span>Join missions</span>
          </button>
          <button
            type="button"
            role="tab"
            id="tab-organizer"
            aria-selected={role === "organizer"}
            aria-controls="panel"
            onClick={() => setRole("organizer")}
          >
            <strong>Organizer / Admin</strong>
            <span>Admin access</span>
          </button>
        </div>

        <div id="panel" role="tabpanel" aria-labelledby={`tab-${role}`}>
          <div className="ticket p-5 sm:p-6" hidden={role !== "volunteer"}>
            <VolunteerPanel />
          </div>
          <div className="ticket p-5 sm:p-6" hidden={role !== "organizer"}>
            <AdminPanel signedInAs={signedInAs} />
          </div>
        </div>
      </div>
    </div>
  );
}

function VolunteerPanel() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function open(text: string) {
    const code = extractInviteCode(text);

    if (!code) {
      setError(
        "That doesn't look like an event link. Copy the whole link from the WhatsApp message and paste it here."
      );
      return;
    }

    setError("");
    router.push(`/join/${code}`);
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      setValue(text);
      open(text);
    } catch {
      setError("Your browser blocked clipboard access. Paste the link into the box instead.");
    }
  }

  return (
    <div className="grid gap-5">
      <SupabaseGoogleButton />
      <div className="ticket-cut" aria-hidden="true" />
      <div>
        <p className="mb-3 text-center font-semibold text-[var(--ink-soft)]">
          Have a private invite link?
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            open(value);
          }}
          className="grid gap-4"
        >
          <label className="field">
            <span>WhatsApp event link</span>
            <textarea
              className="input"
              rows={3}
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setError("");
              }}
              placeholder="Paste it here. It looks like https://…/join/AbC123…"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </label>

          {error && (
            <p className="notice" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn" disabled={!value.trim()}>
              Open Event
            </button>
            <button type="button" className="btn btn-ghost" onClick={pasteFromClipboard}>
              Paste and open
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminPanel({ signedInAs }: { signedInAs: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || "Invalid admin email or password.");
        return;
      }

      router.push(data.mustChangePassword ? "/admin/change-password" : "/admin");
      router.refresh();
    } catch {
      setError("Can't reach the server. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <SupabaseGoogleButton label="Continue with Google" />
      <p className="text-sm text-[var(--ink-soft)]">
        Google sign-in creates or opens a Movement Hub account. It does not
        grant access to the legacy admin dashboard.
      </p>
      <div className="ticket-cut" aria-hidden="true" />
      <p className="text-sm font-semibold text-[var(--ink-soft)]">
        Or use your legacy admin email and password.
      </p>

      {signedInAs && (
        <p className="notice notice-ok">
          You&apos;re signed in as {signedInAs}.{" "}
          <Link href="/admin" className="underline">
            Go to the dashboard
          </Link>
        </p>
      )}

      <label className="field">
        <span>Work email</span>
        <input
          type="email"
          className="input"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
          required
        />
      </label>

      <label className="field">
        <span>Password</span>
        <div className="flex gap-2">
          <input
            type={showPassword ? "text" : "password"}
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ minHeight: "3rem" }}
            onClick={() => setShowPassword((current) => !current)}
            aria-pressed={showPassword}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </label>

      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="btn btn-ink" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-sm text-[var(--ink-soft)]">
        Forgot your password? Event admins should contact a super admin for a
        replacement temporary password.
      </p>
    </form>
  );
}
