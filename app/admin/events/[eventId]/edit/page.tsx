"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(
  () => import("@/components/LocationPicker").then((module) => module.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[240px] w-full items-center justify-center bg-[var(--paper-deep)] text-[var(--ink-soft)] md:h-[280px]">
        Loading map…
      </div>
    ),
  }
);

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const totalMinutes = index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;

  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
});

function formatDateForInput(dateString: string) {
  return new Date(dateString).toISOString().slice(0, 10);
}

export function EditEventForm({ ownerMode = false }: { ownerMode?: boolean }) {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    date: "",
    endDate: "",
    startTime: "",
    endTime: "",
    location: "",
    description: "",
    volunteerCapacity: "",
    isPublic: false,
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [admins, setAdmins] = useState<
    { id: number; fullName: string | null; email: string }[]
  >([]);

const [assignedAdminIds, setAssignedAdminIds] = useState<number[]>([]);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(
          ownerMode
            ? `/api/missions/${params.eventId}`
            : `/api/admin/events/${params.eventId}`
        );

        if (!response.ok) {
          throw new Error("Failed to load event.");
        }

        const event = await response.json();

        setAssignedAdminIds(
          event.adminAssignments?.map(
            (assignment: { adminId: number }) => assignment.adminId
          ) || []
        );
        const adminsResponse = ownerMode
          ? null
          : await fetch("/api/admin/users");

        if (adminsResponse?.ok) {
          const admins = await adminsResponse.json();

          setAdmins(admins);
        }

        setFormData({
          title: event.title,
          date: formatDateForInput(event.date),
          endDate: event.endDate ? formatDateForInput(event.endDate) : "",
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          description: event.description,
          volunteerCapacity: String(event.volunteerCapacity),
          isPublic: event.isPublic,
          latitude: event.latitude,
          longitude: event.longitude,
        });
      } catch {
        setError("Unable to load this event.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvent();
  }, [ownerMode, params.eventId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (
      formData.isPublic &&
      (formData.latitude === null || formData.longitude === null)
    ) {
      setError("Global Arena events require a map pin.");
      return;
    }
    setIsSubmitting(true);

    const response = await fetch(    ownerMode
      ? `/api/missions/${params.eventId}`
      : `/api/admin/events/${params.eventId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError("Unable to update event. Please check the form and try again.");
      return;
    }

    if (!ownerMode) {
      await fetch(`/api/admin/events/${params.eventId}/assign-admins`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            adminIds: assignedAdminIds,
          }),
        });
    }

    router.push(ownerMode ? "/missions" : "/admin/events");
    router.refresh();
  }

  if (isLoading) {
    return (
      <div className="min-h-[calc(100dvh-4.5rem)] px-4 py-8 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          Loading event...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-4.5rem)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

          <h1 className="text-3xl font-bold text-slate-950">
            {ownerMode ? "Edit your mission" : "Edit Event"}
          </h1>

          <p className="mt-3 text-slate-600">
            {ownerMode
              ? "Update the event details, timing, location, and volunteer capacity."
              : "Update event details, timing, location, and volunteer capacity."}
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        >
          <div className="grid gap-5">
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Event title
              </span>
              <input
                value={formData.title}
                onChange={(event) =>
                  setFormData({ ...formData, title: event.target.value })
                }
                className="input"
                required
              />
            </label>

            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-slate-700">
                Visibility
              </legend>
              <div className="visibility-options">
                <button
                  type="button"
                  className={formData.isPublic ? "is-selected" : "is-unselected"}
                  onClick={() => setFormData({ ...formData, isPublic: true })}
                >
                  <span className="visibility-options__heading">
                    <strong>Global Arena</strong>
                    {formData.isPublic && <small className="technical-label">SELECTED</small>}
                  </span>
                  <span>Shown on the Heat Map. Anyone can find it; signing in is required to join.</span>
                </button>
                <button
                  type="button"
                  className={!formData.isPublic ? "is-selected" : "is-unselected"}
                  onClick={() => setFormData({ ...formData, isPublic: false })}
                >
                  <span className="visibility-options__heading">
                    <strong>Secret Cell</strong>
                    {!formData.isPublic && <small className="technical-label">SELECTED</small>}
                  </span>
                  <span>Hidden from the map. Only people with the invite link can open it.</span>
                </button>
              </div>
              <p className="technical-label mt-2 text-xs text-[var(--ink-soft)]">
                {formData.isPublic ? "Map pin required" : "Map pin optional"}
              </p>
            </fieldset>

            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Date
              </span>
              <input
                type="date"
                value={formData.date}
                onChange={(event) =>
                  setFormData({ ...formData, date: event.target.value })
                }
                className="input"
                required
              />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">
                End date
              </span>

              <input
                type="date"
                value={formData.endDate}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    endDate: event.target.value,
                  })
                }
                className="input"
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label>
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Start time
                </span>

                <select
                  value={formData.startTime}
                  onChange={(event) =>
                    setFormData({ ...formData, startTime: event.target.value })
                  }
                  className="input"
                  required
                >
                  <option value="">Select start time</option>
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  End time
                </span>

                <select
                  value={formData.endTime}
                  onChange={(event) =>
                    setFormData({ ...formData, endTime: event.target.value })
                  }
                  className="input"
                  required
                >
                  <option value="">Select end time</option>
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Location
              </span>
              <input
                value={formData.location}
                onChange={(event) =>
                  setFormData({ ...formData, location: event.target.value })
                }
                className="input"
                required
              />
            </label>
            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Map location
              </span>
              <LocationPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                onChange={({ latitude, longitude }) =>
                  setFormData({ ...formData, latitude, longitude })
                }
              />
            </div>

            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Description
              </span>
              <textarea
                value={formData.description}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    description: event.target.value,
                  })
                }
                rows={5}
                className="input"
                required
              />
            </label>

            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Volunteer capacity
              </span>
              <input
                type="number"
                min="1"
                value={formData.volunteerCapacity}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    volunteerCapacity: event.target.value,
                  })
                }
                className="input"
                required
              />
            </label>
          </div>

          {!ownerMode && (
            <div className="mt-6 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <h3 className="mb-3 font-semibold text-slate-950">
              Assigned Event Admins
            </h3>

            <div className="space-y-2">
              {admins.map((admin) => (
                <label
                  key={admin.id}
                  className="flex items-center gap-3"
                >
                  <input
                    type="checkbox"
                    checked={assignedAdminIds.includes(admin.id)}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setAssignedAdminIds([
                          ...assignedAdminIds,
                          admin.id,
                        ]);
                      } else {
                        setAssignedAdminIds(
                          assignedAdminIds.filter(
                            (id) => id !== admin.id
                          )
                        );
                      }
                    }}
                  />

                  <span>
                    {admin.fullName || admin.email}
                  </span>
                </label>
              ))}
            </div>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-900 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => router.push(ownerMode ? "/missions" : "/admin/events")}
              className="btn btn-ghost"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-ink"
            >
              {isSubmitting ? "Saving..." : ownerMode ? "Save mission" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditEventPage() {
  return <EditEventForm />;
}