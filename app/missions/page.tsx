import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ShareEventButton } from "@/components/ShareEventButton";
import { OwnerEventArchiveButton } from "@/components/OwnerEventArchiveButton";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function MissionsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/?signin=1");

  const events = await prisma.event.findMany({
    where: { ownerUserId: user.id },
    include: { signups: { select: { id: true } } },
    orderBy: { date: "asc" },
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1>My events</h1>
          <p className="mt-3 max-w-[52ch] text-[var(--ink-soft)]">
            Create and manage only the events you own.
          </p>
        </div>
        <Link href="/missions/new" className="btn">Create event</Link>
      </div>

      <div className="mt-8 grid gap-4">
        {events.map((event) => (
          <article key={event.id} className="border-2 border-[var(--ink)] bg-[var(--sheet)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl">{event.title}</h2>
                <p className="mt-2 text-[var(--ink-soft)]">
                  {formatDate(event.date)} · {event.startTime} to {event.endTime} · {event.location}
                </p>
                <p className="technical-label mt-2">
                  {event.signups.length} of {event.volunteerCapacity} signed up
                  {!event.isActive && " · ARCHIVED"}
                </p>
              </div>
              <ShareEventButton
                compact
                event={{
                  title: event.title,
                  date: formatDate(event.date),
                  startTime: event.startTime,
                  endTime: event.endTime,
                  location: event.location,
                  inviteCode: event.inviteCode,
                }}
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={`/missions/${event.id}/edit`} className="btn btn-ghost">Edit</Link>
              <Link href={`/missions/${event.id}/volunteers`} className="btn btn-ghost">Signups</Link>
              <OwnerEventArchiveButton eventId={event.id} isActive={event.isActive} />
              <Link href={`/join/${event.inviteCode}`} className="btn btn-ghost">Open invite page</Link>
            </div>
          </article>
        ))}
        {events.length === 0 && (
          <div className="border-2 border-[var(--ink)] p-6">
            No missions linked yet. Join or create an event while signed in.
          </div>
        )}
      </div>
    </main>
  );
}
