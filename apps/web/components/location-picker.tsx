"use client";

import { Check, LoaderCircle, MapPin, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import {
  geocodingService,
  hasValidCoordinates,
  isGeocodingConfigured,
  type GeocodingPlace,
} from "@/lib/geocoding";
import { RentoraMap } from "./rentora-map";
import { useI18n } from "@/context/i18n-context";

type LocationChange = {
  address: string;
  latitude: string;
  longitude: string;
  /** City code inferred from the selected address or reverse-geocoded marker. */
  city?: string;
};

type LocationPickerProps = {
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  error?: string;
  onChange: (location: LocationChange) => void;
};

export function LocationPicker({
  city,
  address,
  latitude,
  longitude,
  error,
  onChange,
}: LocationPickerProps) {
  const { t } = useI18n();
  const listId = useId();
  const inputId = useId();
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchTimerRef = useRef<number | null>(null);
  const resolveAbortRef = useRef<AbortController | null>(null);
  const reverseAbortRef = useRef<AbortController | null>(null);

  const [query, setQuery] = useState(address);
  const [places, setPlaces] = useState<GeocodingPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [message, setMessage] = useState("");
  const [mapRevision, setMapRevision] = useState(0);

  const coordinates =
    latitude.trim() &&
    longitude.trim() &&
    hasValidCoordinates({
      latitude: Number(latitude),
      longitude: Number(longitude),
    })
      ? { latitude: Number(latitude), longitude: Number(longitude) }
      : null;

  useEffect(() => {
    return () => {
      searchAbortRef.current?.abort();
      resolveAbortRef.current?.abort();
      reverseAbortRef.current?.abort();
      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const search = (value: string) => {
    setQuery(value);
    setActiveIndex(-1);
    setPlaces([]);
    setMessage("");

    searchAbortRef.current?.abort();
    resolveAbortRef.current?.abort();
    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
    }

    // Typing a different address invalidates the previous selection. Otherwise,
    // the visible query could disagree with stale coordinates submitted to the API.
    onChange({ address: value, latitude: "", longitude: "" });

    if (value.trim().length < 3) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    searchAbortRef.current = controller;
    setLoading(true);

    searchTimerRef.current = window.setTimeout(async () => {
      try {
        const results = await geocodingService.search({
          query: value,
          city,
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setPlaces(results);
          if (!results.length) {
            setMessage(
              "No matching addresses found. Try another spelling or include the street and city.",
            );
          }
        }
      } catch (reason) {
        if (!controller.signal.aborted) {
          setMessage(
            reason instanceof Error ? reason.message : t("errors.generic"),
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 450);
  };

  const choose = async (place: GeocodingPlace) => {
    searchAbortRef.current?.abort();
    resolveAbortRef.current?.abort();
    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
    }

    const controller = new AbortController();
    resolveAbortRef.current = controller;
    setLoading(true);
    setMessage("");

    try {
      const resolved = await geocodingService.resolve({
        ...place,
        city,
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      onChange({
        address: resolved.label,
        latitude: String(resolved.latitude),
        longitude: String(resolved.longitude),
        city: resolved.cityCode,
      });

      setQuery(resolved.label);
      setPlaces([]);
      setActiveIndex(-1);

      if (resolved.cityCode !== city) {
        setMessage(`City updated to ${resolved.cityName} to match the selected address.`);
      }
    } catch (reason) {
      if (!controller.signal.aborted) {
        setMessage(reason instanceof Error ? reason.message : t("errors.generic"));
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  const updateFromMarker = async (point: {
    latitude: number;
    longitude: number;
  }) => {
    reverseAbortRef.current?.abort();
    const controller = new AbortController();
    reverseAbortRef.current = controller;
    setMessage("");

    try {
      const resolved = await geocodingService.reverse({
        ...point,
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      if (!resolved) {
        setMessage(
          "Could not verify the city for this map point. Move the marker to a precise address in a supported Armenian city.",
        );
        // Re-mount the controlled map to put the marker back at the last verified point.
        setMapRevision((current) => current + 1);
        return;
      }

      onChange({
        address: resolved.label,
        latitude: String(point.latitude),
        longitude: String(point.longitude),
        city: resolved.cityCode,
      });
      setQuery(resolved.label);

      if (resolved.cityCode !== city) {
        setMessage(`City updated to ${resolved.cityName} to match the map location.`);
      }
    } catch (reason) {
      if (!controller.signal.aborted) {
        setMessage(reason instanceof Error ? reason.message : t("errors.generic"));
        setMapRevision((current) => current + 1);
      }
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!places.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, places.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      void choose(places[activeIndex]);
    } else if (event.key === "Escape") {
      setPlaces([]);
      setActiveIndex(-1);
    }
  };

  const clear = () => {
    searchAbortRef.current?.abort();
    resolveAbortRef.current?.abort();
    reverseAbortRef.current?.abort();
    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
    }
    setQuery("");
    setPlaces([]);
    setLoading(false);
    setMessage("");
    onChange({ address: "", latitude: "", longitude: "" });
  };

  return (
    <div className="location-picker">
      <div className="location-picker-search">
        <label htmlFor={inputId}>{t("create.address")}</label>

        <div className="location-search-input">
          <Search size={18} />
          <input
            id={inputId}
            value={query}
            onChange={(event) => search(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("create.addressPlaceholder")}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={places.length > 0 && !loading}
            aria-controls={listId}
            aria-busy={loading}
          />

          {query && (
            <button
              type="button"
              onClick={clear}
              aria-label={t("common.clear")}
            >
              <X size={16} />
            </button>
          )}
          {loading && <LoaderCircle className="animate-spin" size={17} />}
        </div>

        {places.length > 0 && (
          <ul id={listId} className="location-suggestions" role="listbox">
            {places.map((place, index) => (
              <li
                key={place.id}
                role="option"
                aria-selected={activeIndex === index}
              >
                <button
                  type="button"
                  className={activeIndex === index ? "is-active" : ""}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void choose(place)}
                >
                  <MapPin size={16} />
                  <span>{place.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {!isGeocodingConfigured && (
          <p className="location-helper">
            Address search is not configured. Please contact support.
          </p>
        )}
        {message && <p className="location-helper" role="status">{message}</p>}
        {error && <p className="field-error" role="alert">{error}</p>}
      </div>

      <RentoraMap
        key={mapRevision}
        marker={coordinates}
        interactiveMarker
        onMarkerChange={updateFromMarker}
        className="location-picker-map"
      />

      <div className="location-status" aria-live="polite">
        {coordinates ? (
          <>
            <Check size={16} />
            {t("create.markerSelected")}
          </>
        ) : (
          <>
            <MapPin size={16} />
            {t("create.selectAddress")}
          </>
        )}
      </div>
    </div>
  );
}
