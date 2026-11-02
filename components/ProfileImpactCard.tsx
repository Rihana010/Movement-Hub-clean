"use client";

import { useState } from "react";

export function ProfileImpactCard({
  name,
  joinedCount,
  organizedCount,
}: {
  name: string;
  joinedCount: number;
  organizedCount: number;
}) {
  const [message, setMessage] = useState("");

  async function shareImpact() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const context = canvas.getContext("2d");
    if (!context) {
      setMessage("Sharing is unavailable in this browser.");
      return;
    }

    context.fillStyle = "#fbfaff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#1b1233";
    context.fillRect(0, 0, canvas.width, 22);
    context.font = "700 30px Arial";
    context.fillText("MOVEMENT HUB", 70, 105);
    context.font = "700 76px Georgia";
    context.fillText("BROADCAST IMPACT", 70, 230);
    context.font = "400 42px Arial";
    context.fillText(name.slice(0, 42), 70, 315);
    context.font = "700 28px monospace";
    context.fillText(`MISSIONS JOINED  ${joinedCount}`, 70, 425);
    context.fillText(`MISSIONS ORGANIZED  ${organizedCount}`, 70, 480);
    context.fillText("MISSIONS COMPLETED  —", 70, 535);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    if (!blob) {
      setMessage("Unable to prepare the share card.");
      return;
    }

    const file = new File([blob], "movement-hub-impact.png", { type: "image/png" });
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: "Movement Hub impact", files: [file] });
        setMessage("Share card ready.");
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "movement-hub-impact.png";
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("PNG downloaded.");
  }

  return (
    <section className="profile-rule-block">
      <h2 className="profile-heading text-3xl">BROADCAST IMPACT</h2>
      <p className="mt-3 text-[var(--ink-soft)]">
        Share only the name and metrics currently available on this account.
      </p>
      <button type="button" className="btn btn-ink mt-5 w-full" onClick={shareImpact}>
        Share impact card
      </button>
      {message && <p className="mt-3 text-sm text-[var(--ink-soft)]" role="status">{message}</p>}
    </section>
  );
}
