import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/currentAdmin";
import { eventScope } from "@/lib/adminAccess";
import { DeleteEventButton } from "@/components/DeleteEventButton";
import { ShareEventButton } from "@/components/ShareEventButton";
import { EventArchiveButton } from "@/components/EventArchiveButton";


export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: newId } = await searchParams;
  const admin = await requireAdmin();
  const scope = eventScope(admin);
  const today = new Date();

const startOfCurrentMonth = new Date(
  today.getFullYear(),
  today.getMonth(),
  1
);

await prisma.event.updateMany({
  where: {
    isActive: true,
    ...scope,
    OR: [
      {
        endDate: {
          lt: startOfCurrentMonth,
        },
      },
      {
        endDate: null,
        date: {
          lt: startOfCurrentMonth,
        },
      },
    ],
  },
  data: {
    isActive: false,
  },
});

const archivedEventCount = await prisma.event.count({
  where: {
    isActive: false,
    ...scope,
  },
});

const archivedEventDisplay =
  archivedEventCount > 30
    ? "30+"
    : archivedEventCount.toString();

  const events = await prisma.event.findMany({
    where: {
      isActive: true,
      ...scope,
    },
    orderBy: {
      date: "asc",
    },
    include: {
      signups: true,
      createdByAdmin: true,
      adminAssignments: {
        include: {
          admin: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  const justCreated = newId
    ? events.find((event) => event.id === Number(newId))
    : undefined;

  const toShare = (event: (typeof events)[number]) => ({
    title: event.title,
    date: formatDate(event.date),
    startTime: event.startTime,
    endTime: event.endTime,
    location: event.location,
    inviteCode: event.inviteCode,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="w-full md:w-auto">
          <h1>Events</h1>
          <p className="mt-3 w-full max-w-[48ch] text-[var(--ink-soft)]">
            Each event has its own private link. Send it to your WhatsApp group
            and volunteers sign up from there.
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 md:flex md:w-auto">
          <Link href="/admin/events/archive" className="btn btn-ghost w-full max-md:min-h-11">
            Archived ({archivedEventDisplay})
          </Link>
          <Link href="/admin/events/new" className="btn w-full max-md:min-h-11">
            Create event
          </Link>
        </div>
      </div>

      {justCreated && (
        <section
          className="ticket mt-8 p-5 sm:p-6 [&>div>div]:max-md:flex-col [&>div>div>button]:max-md:w-full [&>div>p]:max-md:text-xs"
          aria-live="polite"
        >
          <h2>{justCreated.title} is live</h2>
          <p className="mb-4 mt-2 max-w-[56ch]">
            Nobody can find it yet. Send the link to your group so people can
            sign up.
          </p>
          <ShareEventButton event={toShare(justCreated)} />
        </section>
      )}

      <div className="mt-8 hidden overflow-x-auto rounded-lg border-2 border-[var(--ink)] bg-[var(--sheet)] md:block">
        <table className="w-full min-w-[56rem] border-collapse text-left">
          <thead className="bg-[var(--ink)] text-[var(--sheet)]">
            <tr>
              <th className="px-4 py-3 font-bold">Event</th>
              <th className="px-4 py-3 font-bold">Contact</th>
              <th className="px-4 py-3 font-bold">Date</th>
              <th className="px-4 py-3 font-bold">Signed up</th>
              <th className="px-4 py-3 font-bold">Send to group</th>
              <th className="px-4 py-3 font-bold">Manage</th>
            </tr>
          </thead>

          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-t-2 border-[var(--paper-deep)] align-top">
                <td className="px-4 py-4">
                  <p className="font-bold">{event.title}</p>
                  <p className="text-sm text-[var(--ink-soft)]">
                    {event.startTime} to {event.endTime}, {event.location}
                  </p>
                </td>

                <td className="px-4 py-4 text-sm">
                  {event.adminAssignments[0]?.admin.fullName ||
                    event.adminAssignments[0]?.admin.email ||
                    event.createdByAdmin?.fullName ||
                    event.createdByAdmin?.email ||
                    "Unassigned"}
                </td>

                <td className="px-4 py-4">{formatDate(event.date)}</td>

                <td className="px-4 py-4 font-semibold">
                  {event.signups.length} of {event.volunteerCapacity}
                </td>

                <td className="px-4 py-4">
                  <ShareEventButton compact event={toShare(event)} />
                </td>

                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/events/${event.id}/edit`} className="btn btn-ghost btn-sm">
                      Edit
                    </Link>
                    <Link href={`/admin/events/${event.id}/volunteers`} className="btn btn-ghost btn-sm">
                      Signups
                    </Link>
                    <EventArchiveButton eventId={event.id} isActive={event.isActive} />
                    <DeleteEventButton
                      eventId={event.id}
                      title={event.title}
                      signupCount={event.signups.length}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && (
          <p className="p-8 text-center">
            No events yet.{" "}
            <Link href="/admin/events/new" className="font-bold underline">
              Create the first one
            </Link>
            .
          </p>
        )}

      </div>

      <div className="mt-8 grid gap-4 md:hidden">
        {events.map((event) => {
          const contact =
            event.adminAssignments[0]?.admin.fullName ||
            event.adminAssignments[0]?.admin.email ||
            event.createdByAdmin?.fullName ||
            event.createdByAdmin?.email ||
            "Unassigned";

          return (
            <article
              key={event.id}
              className="rounded-lg border-2 border-[var(--ink)] bg-[var(--sheet)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="min-w-0 break-words text-2xl">{event.title}</h2>
                <span className="technical-label shrink-0 rounded-full bg-[var(--paper-deep)] px-2 py-1 text-xs font-bold">
                  {event.signups.length} of {event.volunteerCapacity} signed up
                </span>
              </div>

              <div className="mt-3 grid gap-1 text-sm text-[var(--ink-soft)]">
                <p>{formatDate(event.date)}</p>
                <p>{event.startTime} to {event.endTime}</p>
                <p className="break-words">{event.location}</p>
                <p className="break-words">{contact}</p>
              </div>

              <div className="mt-4 [&>div>div]:flex-col [&>div>div>button]:w-full">
                <ShareEventButton compact event={toShare(event)} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 [&>a]:min-h-11 [&>a]:w-full [&>button]:min-h-11 [&>button]:w-full">
                <Link href={`/admin/events/${event.id}/edit`} className="btn btn-ghost btn-sm">
                  Edit
                </Link>
                <Link href={`/admin/events/${event.id}/volunteers`} className="btn btn-ghost btn-sm">
                  Signups
                </Link>
                <EventArchiveButton eventId={event.id} isActive={event.isActive} />
                <DeleteEventButton
                  eventId={event.id}
                  title={event.title}
                  signupCount={event.signups.length}
                />
              </div>
            </article>
          );
        })}
      </div>

      {events.length === 0 && (
        <p className="mt-8 rounded-lg border-2 border-[var(--ink)] bg-[var(--sheet)] p-8 text-center md:hidden">
          No events yet.{" "}
          <Link href="/admin/events/new" className="font-bold underline">
            Create the first one
          </Link>
          .
        </p>
      )}
    </div>
  );
}
