"use client";

import { useEffect, useState } from "react";

type ShareEvent = {
  title: string;
  date: string; // formatted, e.g. "Fri, Nov 14"
  startTime: string;
  endTime: string;
  location: string;
  inviteCode: string;
};

export function ShareEventButton({
  event,
  compact = false,
}: {
  event: ShareEvent;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [localOnly, setLocalOnly] = useState(false);
  const baseUrl = () =>
    (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/+$/, "");

  const link = () => `${baseUrl()}/join/${event.inviteCode}`;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const host = new URL(baseUrl()).hostname;
      setLocalOnly(
        host === "localhost" ||
          host === "127.0.0.1" ||
          /^(10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(host)
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function shareOnWhatsApp() {
    const text = [
      `*${event.title}*`,
      `${event.date}, ${event.startTime} to ${event.endTime}`,
      event.location,
      "",
      "Volunteers needed. Tap the link to sign up. It only asks for your name and phone number:",
      link(),
    ].join("\n");

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;

    // If the browser blocks the new tab, open WhatsApp in this one instead.
    if (!window.open(url, "_blank", "noopener")) {
      window.location.href = url;
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", link());
    }
  }

  const size = compact ? "btn-sm" : "";

  return (
    <div>
    <div className="flex flex-wrap gap-2">
      <button type="button" className={`btn btn-whatsapp ${size}`} onClick={shareOnWhatsApp}>
        Share on WhatsApp
      </button>
      <button type="button" className={`btn btn-ghost ${size}`} onClick={copyLink} aria-live="polite">
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
      {localOnly && (
        <p className="mt-2 max-w-[44ch] text-sm font-semibold text-[var(--brick)]">
          This link only opens on this computer or network. Set
          NEXT_PUBLIC_SITE_URL to your public address before sharing it.
        </p>
      )}
    </div>
  );
}
