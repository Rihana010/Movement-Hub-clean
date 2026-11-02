"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState, useTransition } from "react";
import { openNextImpactCrate } from "@/app/profile/actions";

type Crate = {
  id: number;
  reward: string | null;
  openedAt: Date | null;
};

export function ImpactCrates({ crates }: { crates: Crate[] }) {
  const [items, setItems] = useState(crates);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const reduceMotion = useReducedMotion();
  const sealedCount = items.filter((crate) => !crate.openedAt).length;

  function openCrate() {
    startTransition(async () => {
      try {
        const opened = await openNextImpactCrate();
        if (!opened) {
          setMessage("No sealed crates are waiting.");
          return;
        }
        setItems((current) =>
          current.map((crate) =>
            crate.id === opened.id
              ? { ...crate, reward: opened.reward, openedAt: new Date() }
              : crate
          )
        );
        setMessage(`Unlocked: ${opened.reward}`);
      } catch {
        setMessage("The crate could not be opened. Try again.");
      }
    });
  }

  return (
    <section className="profile-rule-block">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="profile-heading text-3xl">IMPACT CRATE</h2>
        <span className="technical-label text-xs text-[var(--ink-soft)]">
          {sealedCount} SEALED
        </span>
      </div>
      <p className="mt-3 text-[var(--ink-soft)]">
        One cosmetic reward is available for each linked join or organized event.
      </p>
      <button
        type="button"
        className="btn btn-ink mt-5 w-full"
        onClick={openCrate}
        disabled={isPending || sealedCount === 0}
      >
        {isPending ? "Opening…" : sealedCount ? "Open sealed crate" : "No sealed crates"}
      </button>
      {message && (
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.45 }}
          className="mt-4 border-2 border-[var(--marigold)] bg-[var(--marigold-soft)] p-3 text-sm font-semibold"
          role="status"
        >
          {message}
        </motion.p>
      )}
      {items.some((crate) => crate.openedAt) && (
        <div className="mt-5 grid gap-2">
          {items.filter((crate) => crate.openedAt).map((crate) => (
            <p key={crate.id} className="technical-label border-t border-[var(--ink)] pt-2 text-xs">
              {crate.reward}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
