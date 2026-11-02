import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SupabaseSignOutButton } from "@/components/SupabaseSignOutButton";
import { ProfileImpactCard } from "@/components/ProfileImpactCard";
import { ImpactCrates } from "@/components/ImpactCrates";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?signin=1");
  }

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { fullName: true },
  });
  const metadataName =
    typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata.name === "string"
        ? user.user_metadata.name
        : null;
  const fullName = profile?.fullName || metadataName || "Movement Hub member";
  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const joined = await prisma.volunteerSignup.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      createdAt: true,
      event: {
        select: {
          id: true,
          title: true,
          date: true,
          location: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const organized = await prisma.event.findMany({
    where: { ownerUserId: user.id },
    select: {
      id: true,
      createdAt: true,
      title: true,
      date: true,
      location: true,
    },
    orderBy: { createdAt: "desc" },
  });
  const sources = [
    ...joined.map((item) => ({ sourceType: "joined", sourceId: item.event.id })),
    ...organized.map((event) => ({ sourceType: "organized", sourceId: event.id })),
  ];
  if (sources.length) {
    await prisma.$transaction(
      sources.map((source) =>
        prisma.impactCrate.upsert({
          where: {
            userId_sourceType_sourceId: {
              userId: user.id,
              ...source,
            },
          },
          create: { userId: user.id, ...source },
          update: {},
        })
      )
    );
  }
  const crates = await prisma.impactCrate.findMany({
    where: { userId: user.id },
    select: { id: true, reward: true, openedAt: true },
    orderBy: { id: "asc" },
  });
  const joinedCount = joined.length;
  const organizedCount = organized.length;
  const total = joinedCount + organizedCount;
  const rank = total >= 6
    ? "Community Architect"
    : total >= 3
      ? "Squad Lead"
      : total >= 1
        ? "Field Operative"
        : "Recruit";
  const nextRank = total < 1
    ? { target: 1, label: "Field Operative" }
    : total < 3
      ? { target: 3, label: "Squad Lead" }
      : total < 6
        ? { target: 6, label: "Community Architect" }
        : null;
  const activityDates = [
    ...joined.map((item) => item.createdAt),
    ...organized.map((event) => event.createdAt),
  ];

  return (
    <main className="profile-page mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="grid gap-8 border-b-2 border-[var(--ink)] pb-8 md:grid-cols-[1fr_auto] md:items-end">
        <div className="flex items-center gap-4">
          <div className="profile-avatar" aria-hidden="true">{initials || "MH"}</div>
          <div>
            <p className="technical-label text-xs text-[var(--ink-soft)]">MOVEMENT HUB ACCOUNT</p>
            <h1 className="profile-heading mt-2 text-5xl">{fullName}</h1>
          </div>
        </div>
        <div className="border-l-0 border-[var(--ink)] md:border-l-2 md:pl-8">
          <p className="technical-label text-xs text-[var(--ink-soft)]">MISSIONS COMPLETED</p>
          <p className="profile-metric mt-1 text-6xl">—</p>
          <p className="mt-1 max-w-xs text-sm text-[var(--ink-soft)]">
            Attendance tracking is not available yet.
          </p>
        </div>
      </header>

      <section className="grid border-b-2 border-[var(--ink)] py-6 sm:grid-cols-3">
        <Metric label="MISSIONS JOINED" value={String(joinedCount)} />
        <Metric label="MISSIONS ORGANIZED" value={String(organizedCount)} />
        <Metric label="ACCOUNT STATUS" value="ACTIVE ACCOUNT" />
      </section>

      <section className="grid gap-8 py-8 lg:grid-cols-[1fr_0.8fr]">
        <div className="grid gap-8">
          <RankSection total={total} rank={rank} nextRank={nextRank} />
          <HistorySection title="DEPLOYED MISSIONS" events={joined.map((item) => ({
            id: item.event.id,
            title: item.event.title,
            date: item.event.date,
            location: item.event.location,
            role: "VOLUNTEER",
          }))} />
          <HistorySection title="COMMAND MISSIONS" events={organized.map((event) => ({
            id: event.id,
            title: event.title,
            date: event.date,
            location: event.location,
            role: "ORGANIZER",
          }))} />
          <ActivityGrid dates={activityDates} />
        </div>
        <div className="grid content-start gap-8">
          <section className="profile-rule-block">
            <h2 className="profile-heading text-3xl">Participation</h2>
            <div className="mt-5 grid gap-3">
              <Reward label="First mission joined" unlocked={joinedCount >= 1} criteria="Join one linked event" />
              <Reward label="First event organized" unlocked={organizedCount >= 1} criteria="Organize one linked event" />
              <Reward label="3 missions" unlocked={joinedCount >= 3} criteria="Join three linked events" />
              <Reward label="Organizer and volunteer" unlocked={joinedCount >= 1 && organizedCount >= 1} criteria="Have both linked roles" />
            </div>
          </section>
          <ImpactCrates crates={crates} />
          <ProfileImpactCard name={fullName} joinedCount={joinedCount} organizedCount={organizedCount} />
        </div>
      </section>

      <div className="border-t-2 border-[var(--ink)] pt-6">
        <SupabaseSignOutButton />
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[var(--ink)] py-3 last:border-0 sm:border-b-0 sm:border-r sm:px-5 sm:first:pl-0 sm:last:border-0">
      <p className="technical-label text-xs text-[var(--ink-soft)]">{label}</p>
      <p className="profile-metric mt-2 text-3xl">{value}</p>
    </div>
  );
}

function RankSection({
  total,
  rank,
  nextRank,
}: {
  total: number;
  rank: string;
  nextRank: { target: number; label: string } | null;
}) {
  const progress = nextRank ? Math.min((total / nextRank.target) * 100, 100) : 100;
  return (
    <section className="profile-rule-block">
      <p className="technical-label text-xs text-[var(--ink-soft)]">RANK</p>
      <h2 className="profile-heading mt-2 text-4xl">{rank}</h2>
      <div className="mt-4 h-3 border-2 border-[var(--ink)] bg-[var(--sheet)]">
        <div className="h-full bg-[var(--marigold)]" style={{ width: `${progress}%` }} />
      </div>
      <p className="technical-label mt-2 text-xs text-[var(--ink-soft)]">
        {nextRank ? `${total} of ${nextRank.target} to ${nextRank.label}` : "6+ total — Community Architect"}
      </p>
      <p className="mt-3 text-sm text-[var(--ink-soft)]">
        Thresholds: 0 Recruit · 1 Field Operative · 3 Squad Lead · 6 Community Architect
      </p>
    </section>
  );
}

function HistorySection({
  title,
  events,
}: {
  title: string;
  events: { id: number; title: string; date: Date; location: string; role: string }[];
}) {
  return (
    <section className="profile-rule-block">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="profile-heading text-3xl">{title}</h2>
        <span className="technical-label text-xs text-[var(--ink-soft)]">{events.length}</span>
      </div>
      {events.length ? (
        <div className="mt-4 grid border-t border-[var(--ink)]">
          {events.map((event) => (
            <div key={event.id} className="grid gap-1 border-b border-[var(--ink)] py-3 sm:grid-cols-[8rem_1fr_auto] sm:items-center sm:gap-4">
              <span className="text-sm text-[var(--ink-soft)]">
                {event.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span className="font-semibold">{event.title} <span className="font-normal text-[var(--ink-soft)]">· {event.location}</span></span>
              <span className="technical-label text-xs text-[var(--ink-soft)]">{event.role}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 border-t border-[var(--ink)] pt-4 text-[var(--ink-soft)]">
          Event history is not linked to this account yet.
        </p>
      )}
    </section>
  );
}

function Reward({ label, unlocked, criteria }: { label: string; unlocked: boolean; criteria: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-[var(--ink)] py-3">
      <div>
        <p>{label}</p>
        {!unlocked && <p className="text-sm text-[var(--ink-soft)]">{criteria}</p>}
      </div>
      <span className="technical-label shrink-0 text-xs text-[var(--ink-soft)]">{unlocked ? "UNLOCKED" : "LOCKED"}</span>
    </div>
  );
}

function ActivityGrid({ dates }: { dates: Date[] }) {
  const now = new Date();
  const currentMonday = new Date(now);
  currentMonday.setHours(0, 0, 0, 0);
  currentMonday.setDate(currentMonday.getDate() - ((currentMonday.getDay() + 6) % 7));
  const weeks = Array.from({ length: 12 }, (_, index) => {
    const start = new Date(currentMonday);
    start.setDate(start.getDate() - (11 - index) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  });
  return (
    <section className="profile-rule-block">
      <h2 className="profile-heading text-3xl">ACTIVITY GRID</h2>
      <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-12">
        {weeks.map((week) => {
          const active = dates.some((date) => date >= week.start && date < week.end);
          return <span key={week.start.toISOString()} title={active ? "Linked activity" : "No linked activity"} className={`aspect-square border border-[var(--ink)] ${active ? "bg-[var(--marigold)]" : "bg-[var(--paper-deep)]"}`} />;
        })}
      </div>
      <p className="mt-3 text-sm text-[var(--ink-soft)]">Last 12 weeks of linked joins and organized events.</p>
    </section>
  );
}
