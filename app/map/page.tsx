"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

const HeatMap = dynamic(
  () => import("@/components/HeatMap").then((module) => module.HeatMap),
  { ssr: false }
);

export default function MapPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="ticket p-6 sm:p-8">
        <p className="technical-label text-sm text-[var(--ink-soft)]">
          Public discovery
        </p>
        <h1 className="mt-3">Heat Map</h1>
        <p className="mt-4 max-w-[60ch] text-[var(--ink-soft)]">
          Explore community missions around the world. Sign in with Google to
          join a mission.
        </p>
      </section>
      <div className="mt-6">
        <HeatMap />
      </div>
      <Link href="/" className="btn btn-ghost mt-6">
        Back to Movement Hub
      </Link>
    </main>
  );
}
