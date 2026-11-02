"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type LocationPickerProps = {
  latitude: number | null;
  longitude: number | null;
  onChange: (coordinates: { latitude: number | null; longitude: number | null }) => void;
};

function MapClickHandler({
  onChange,
}: {
  onChange: LocationPickerProps["onChange"];
}) {
  useMapEvents({
    click(event) {
      onChange({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    },
  });
  return null;
}

function MapCentre({ latitude, longitude }: Pick<LocationPickerProps, "latitude" | "longitude">) {
  const map = useMap();

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      map.setView([latitude, longitude], Math.max(map.getZoom(), 12));
    }
  }, [latitude, longitude, map]);

  return null;
}

function MapSizeInvalidator() {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  return null;
}

export function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const [message, setMessage] = useState("");
  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: "movement-location-pin",
        html: '<span aria-hidden="true"></span>',
        iconSize: [24, 24],
        iconAnchor: [12, 24],
      }),
    []
  );
  const centre: [number, number] =
    latitude !== null && longitude !== null ? [latitude, longitude] : [20, 0];

  function useMyLocation() {
    setMessage("");
    if (!navigator.geolocation) {
      setMessage("Location is unavailable in this browser. You can still click the map.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setMessage("Location selected.");
      },
      () => {
        setMessage("Location permission was denied or unavailable. You can still click the map.");
      }
    );
  }

  return (
    <div className="location-picker">
      <div className="location-picker__actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={useMyLocation}>
          Use my location
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            onChange({ latitude: null, longitude: null });
            setMessage("");
          }}
          disabled={latitude === null || longitude === null}
        >
          Clear pin
        </button>
      </div>
      <MapContainer
        center={centre}
        zoom={latitude !== null && longitude !== null ? 12 : 2}
        scrollWheelZoom
        className="location-picker__map h-[240px] w-full md:h-[280px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onChange={onChange} />
        <MapCentre latitude={latitude} longitude={longitude} />
        <MapSizeInvalidator />
        {latitude !== null && longitude !== null && (
          <Marker
            position={[latitude, longitude]}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const position = event.target.getLatLng();
                onChange({ latitude: position.lat, longitude: position.lng });
              },
            }}
          />
        )}
      </MapContainer>
      {latitude !== null && longitude !== null ? (
        <p className="location-picker__coordinates technical-label">
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </p>
      ) : (
        <p className="location-picker__coordinates technical-label">No pin selected</p>
      )}
      {message && <p className="mt-2 text-sm text-[var(--ink-soft)]">{message}</p>}
    </div>
  );
}
