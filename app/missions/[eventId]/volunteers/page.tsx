import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ShareEventButton } from "@/components/ShareEventButton";

type Props = { params: Promise<{ eventId: string }> };

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function MissionVolunteersPage({ params }: Props) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/?signin=1");
  const id = Number((await params).eventId);
  const event = await prisma.event.findFirst({
    where: { id, ownerUserId: user.id },
    include: { signups: { orderBy: { createdAt: "asc" } } },
  });
  if (!event) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="border-b-2 border-[var(--ink)] pb-6">
        <Link href="/missions" className="underline">← My events</Link>
        <h1 className="mt-5">Signups</h1>
        <p className="mt-3 text-[var(--ink-soft)]">{event.title} · {formatDate(event.date)}</p>
        <div className="mt-5">
          <ShareEventButton event={{
            title: event.title,
            date: formatDate(event.date),
            startTime: event.startTime,
            endTime: event.endTime,
            location: event.location,
            inviteCode: event.inviteCode,
          }} />
        </div>
      </header>
      <div className="mt-8 overflow-x-auto border-2 border-[var(--ink)]">
        <table className="w-full border-collapse text-left">
          <thead className="bg-[var(--ink)] text-[var(--sheet)]">
            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Signup date</th></tr>
          </thead>
          <tbody>
            {event.signups.map((signup) => (
              <tr key={signup.id} className="border-t-2 border-[var(--paper-deep)]">
                <td className="px-4 py-3">{signup.fullName}</td>
                <td className="px-4 py-3">{signup.phone || "—"}</td>
                <td className="px-4 py-3">{formatDate(signup.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!event.signups.length && <p className="p-6">No volunteers have signed up yet.</p>}
      </div>
    </main>
  );
}
