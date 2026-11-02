"use client";

import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type MapEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  spotsOpen: number;
  coordinates: [number, number];
  href: string;
};

const markerIcon = L.divIcon({
  className: "movement-map-pin",
  html: '<span aria-hidden="true"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

export function HeatMap() {
  const [pins, setPins] = useState<MapEvent[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/events/public")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load public events.");
        return response.json() as Promise<MapEvent[]>;
      })
      .then(setPins)
      .catch(() => setError("Public events are temporarily unavailable."));
  }, []);

  return (
    <div className="overflow-hidden rounded-3xl border-2 border-[var(--ink)] bg-[var(--sheet)]">
      <MapContainer
        center={[25, 10]}
        zoom={2}
        minZoom={2}
        scrollWheelZoom
        className="h-[min(70vh,40rem)] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pins.map((event) => (
          <Marker key={event.id} position={event.coordinates} icon={markerIcon}>
            <Popup>
              <article className="min-w-52">
                <h2 className="text-xl">{event.title}</h2>
                <p className="mt-2 text-sm">{event.date}</p>
                <p className="text-sm">{event.time}</p>
                <p className="mt-2 text-sm">{event.location}</p>
                <p className="mt-2 font-semibold">{event.spotsOpen} spots open</p>
                <Link href={event.href} className="btn btn-sm mt-3">
                  View Mission
                </Link>
              </article>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {error && <p className="p-4 text-sm text-[var(--ink-soft)]">{error}</p>}
      {!error && pins.length === 0 && (
        <p className="p-4 text-sm text-[var(--ink-soft)]">
          No public missions have been placed on the map yet.
        </p>
      )}
    </div>
  );
}
