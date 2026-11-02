"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export function NewEventForm({ ownerMode = false }: { ownerMode?: boolean }) {
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

  const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const totalMinutes = index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;

  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
});

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const response = await fetch(ownerMode ? "/api/missions" : "/api/admin/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    setIsSubmitting(false);
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Unable to create event. Please check the form and try again.");
      return;
    }

    router.push(ownerMode ? `/missions?new=${data.id}` : `/admin/events?new=${data.id}`);
    router.refresh();
  }

  return (
    <div className="min-h-[calc(100dvh-4.5rem)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

          <h1 className="text-3xl font-bold text-slate-950">
            {ownerMode ? "Create a mission" : "Create New Event"}
          </h1>

          <p className="mt-3 text-slate-600">
            {ownerMode
              ? "Create an event you can manage and share with your community."
              : "Add a new event to the events and volunteer calendar."}
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
                End Date
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
              {isSubmitting ? "Creating..." : ownerMode ? "Create mission" : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewEventPage() {
  return <NewEventForm />;
}