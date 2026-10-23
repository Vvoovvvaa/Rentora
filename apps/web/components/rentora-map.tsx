"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  LocateFixed,
  MapPinned,
  Maximize2,
  Minimize2,
} from "lucide-react";

import type { Property, PropertyMapBounds } from "@/types/models";
import { getValidCoordinates, hasValidCoordinates } from "@/lib/geocoding";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type RentoraMapProps = {
  properties?: Property[];
  marker?: Coordinates | null;
  initialCenter?: Coordinates | null;
  initialZoom?: number;
  initialBounds?: PropertyMapBounds;
  preview?: boolean;
  highlightArmenia?: boolean;
  selectedId?: number | null;
  interactiveMarker?: boolean;
  className?: string;
  onMarkerChange?: (coordinates: Coordinates) => void;
  onBoundsChange?: (bounds: PropertyMapBounds, userInitiated?: boolean) => void;
  onSelectProperty?: (propertyId: number) => void;
  highlightedId?: number | null;
  onHighlightProperty?: (propertyId: number | null) => void;
  fitToProperties?: boolean;
  initialFitReady?: boolean;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
  fullscreenLabel?: string;
  exitFullscreenLabel?: string;
  twoDLabel?: string;
  threeDLabel?: string;
  myLocationLabel?: string;
};

const ARMENIA_CENTER: [number, number] = [44.5, 40.18];
const ARMENIA_ZOOM = 7;
const MAPBOX_STYLE = "mapbox://styles/mapbox/standard";
const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Clusters aggregate through zoom 9; price banners appear from zoom 10.
const STANDARD_MARKER_MIN_ZOOM = 11;

const PROPERTY_SOURCE = "rentora-properties";
const BOOSTED_PROPERTY_SOURCE = "rentora-boosted-properties";

const CLUSTER_LAYER = "rentora-clusters";
const CLUSTER_COUNT_LAYER = "rentora-cluster-count";
const BOOSTED_CLUSTER_LAYER = "rentora-boosted-clusters";
const BOOSTED_CLUSTER_COUNT_LAYER = "rentora-boosted-cluster-count";
const SINGLE_PROPERTY_LAYER = "rentora-single-property-points";
const BOOSTED_SINGLE_PROPERTY_LAYER = "rentora-boosted-single-property-points";
const SINGLE_PROPERTY_FALLBACK = "rentora-single-property-fallback";
const BOOSTED_SINGLE_PROPERTY_FALLBACK = "rentora-boosted-single-property-fallback";

const COUNTRY_BOUNDARIES_SOURCE = "rentora-country-boundaries";
const ARMENIA_FILL_LAYER = "rentora-armenia-fill";
const ARMENIA_GLOW_LAYER = "rentora-armenia-glow";
const ARMENIA_BORDER_LAYER = "rentora-armenia-border";

const ARMENIA_PREVIEW_BOUNDS: [[number, number], [number, number]] = [
  [43.35, 38.75],
  [46.75, 41.35],
];

export const hasCoordinates = hasValidCoordinates;

type MapFeature = {
  properties?: {
    id?: unknown;
    cluster_id?: unknown;
  };
  geometry?: {
    coordinates?: unknown;
  };
};

function getFeaturePropertyId(feature: unknown): number | null {
  const item = feature as MapFeature | undefined;
  const id = Number(item?.properties?.id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function MapConfigurationNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`map-configuration-notice ${compact ? "is-compact" : ""}`}>
      <MapPinned size={compact ? 18 : 24} />
      <div>
        <strong>Mapbox is not configured</strong>
        <p>
          Add a public <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> to{" "}
          <code>apps/web/.env.local</code>, then restart the web app.
        </p>
      </div>
    </div>
  );
}

export function RentoraMap({
  properties = [],
  marker,
  initialCenter,
  initialZoom,
  initialBounds,
  preview = false,
  highlightArmenia = false,
  selectedId,
  highlightedId,
  interactiveMarker = false,
  className = "",
  onMarkerChange,
  onBoundsChange,
  onSelectProperty,
  onHighlightProperty,
  fitToProperties = false,
  initialFitReady = false,
  fullscreen = false,
  onToggleFullscreen,
  fullscreenLabel = "Expand map",
  exitFullscreenLabel = "Exit fullscreen",
  twoDLabel = "2D",
  threeDLabel = "3D",
  myLocationLabel = "Use my location",
}: RentoraMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("mapbox-gl").Map | null>(null);
  const mapboxRef = useRef<typeof import("mapbox-gl").default | null>(null);
  const markerRef = useRef<import("mapbox-gl").Marker | null>(null);
  const propertyMarkerRefs = useRef<Map<number, import("mapbox-gl").Marker>>(new Map());
  const hasFittedPropertiesRef = useRef(false);
  const hasUserAdjustedPreviewRef = useRef(false);
  const boundsCallbackRef = useRef(onBoundsChange);
  const selectCallbackRef = useRef(onSelectProperty);
  const highlightCallbackRef = useRef(onHighlightProperty);
  const userMapInteractionRef = useRef(false);
  const lastFocusedPropertyIdRef = useRef<number | null>(null);

  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [isThreeDimensional, setIsThreeDimensional] = useState(false);

  const markerLatitude = marker?.latitude;
  const markerLongitude = marker?.longitude;

  useEffect(() => {
    boundsCallbackRef.current = onBoundsChange;
  }, [onBoundsChange]);

  useEffect(() => {
    selectCallbackRef.current = onSelectProperty;
  }, [onSelectProperty]);

  useEffect(() => {
    highlightCallbackRef.current = onHighlightProperty;
  }, [onHighlightProperty]);

  useEffect(() => {
    if (!mapboxToken || !containerRef.current || mapRef.current) return;

    let disposed = false;
    let resizeObserver: ResizeObserver | undefined;
    let resizeFrame: number | undefined;
    const markerRegistry = propertyMarkerRefs.current;

    void import("mapbox-gl")
      .then(({ default: mapboxgl }) => {
        if (disposed || !containerRef.current) return;

        mapboxgl.accessToken = mapboxToken;
        mapboxRef.current = mapboxgl;

        const centerPoint =
          marker && hasCoordinates(marker)
            ? marker
            : initialCenter && hasCoordinates(initialCenter)
              ? initialCenter
              : null;

        const bounds: [[number, number], [number, number]] | undefined = initialBounds
          ? [
            [initialBounds.west, initialBounds.south],
            [initialBounds.east, initialBounds.north],
          ]
          : preview
            ? ARMENIA_PREVIEW_BOUNDS
            : undefined;

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: MAPBOX_STYLE,
          center: centerPoint
            ? [centerPoint.longitude, centerPoint.latitude]
            : ARMENIA_CENTER,
          zoom: centerPoint ? (initialZoom ?? 14) : (initialZoom ?? ARMENIA_ZOOM),
          pitch: 0,
          attributionControl: false,
          config: {
            basemap: {
              lightPreset: "day",
              show3dObjects: false,
            },
          },
          ...(bounds
            ? {
              bounds,
              fitBoundsOptions: {
                padding: preview ? 34 : 24,
                duration: 0,
                pitch: 0,
                bearing: 0,
              },
            }
            : {}),
          ...(preview
            ? {
              projection: "mercator" as const,
              dragRotate: false,
              pitchWithRotate: false,
              touchPitch: false,
              maxPitch: 0,
              minZoom: 5.25,
            }
            : {}),
        });

        mapRef.current = map;

        map.addControl(
          new mapboxgl.NavigationControl({
            showCompass: !preview,
            showZoom: true,
            visualizePitch: !preview,
          }),
          "top-right",
        );
        map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

        const fitPreviewBounds = () => {
          if (preview && bounds && !hasUserAdjustedPreviewRef.current) {
            map.fitBounds(bounds, {
              padding: 34,
              duration: 0,
              pitch: 0,
              bearing: 0,
            });
          }
        };

        if (preview) {
          map.touchZoomRotate.disableRotation();
          map.keyboard.disableRotation();

          map.on("movestart", (event) => {
            const originalEvent = (event as unknown as { originalEvent?: unknown }).originalEvent;
            if (originalEvent) hasUserAdjustedPreviewRef.current = true;
          });

          resizeObserver = new ResizeObserver(() => {
            if (resizeFrame !== undefined) window.cancelAnimationFrame(resizeFrame);

            resizeFrame = window.requestAnimationFrame(() => {
              if (disposed) return;
              map.resize();
              fitPreviewBounds();
            });
          });
          resizeObserver.observe(containerRef.current);
        }

        map.on("load", () => {
          if (disposed) return;
          if (preview) {
            map.resize();
            fitPreviewBounds();
          }
          if (highlightArmenia) addArmeniaHighlight(map);

          // Regular and Boost properties use separate cluster sources.
          // This keeps their clusters visually distinguishable when zoomed out.
          map.addSource(PROPERTY_SOURCE, {
            type: "geojson",
            data: emptyCollection(),
            cluster: true,
            clusterMaxZoom: 7,
            clusterRadius: 48,
          });

          map.addSource(BOOSTED_PROPERTY_SOURCE, {
            type: "geojson",
            data: emptyCollection(),
            cluster: true,
            clusterMaxZoom: 9,
            clusterRadius: 48,
          });

          // Regular clusters: Rentora brown.
          map.addLayer({
            id: CLUSTER_LAYER,
            type: "circle",
            slot: "top",
            source: PROPERTY_SOURCE,
            filter: ["has", "point_count"],
            paint: {
              "circle-color": "#513f30",
              "circle-radius": ["step", ["get", "point_count"], 18, 10, 23, 30, 28],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#f8f1e7",
            },
          });

          map.addLayer({
            id: CLUSTER_COUNT_LAYER,
            type: "symbol",
            slot: "top",
            source: PROPERTY_SOURCE,
            filter: ["has", "point_count"],
            layout: {
              "text-field": "{point_count_abbreviated}",
              "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
              "text-size": 12,
            },
            paint: { "text-color": "#ffffff" },
          });

          // Boost clusters: gold, with a small offset to avoid overlapping
          // regular clusters located in the same neighbourhood.
          map.addLayer({
            id: BOOSTED_CLUSTER_LAYER,
            type: "circle",
            slot: "top",
            source: BOOSTED_PROPERTY_SOURCE,
            filter: ["has", "point_count"],
            paint: {
              "circle-color": "#dfb56f",
              "circle-radius": ["step", ["get", "point_count"], 15, 10, 20, 30, 25],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#fff3d9",
              "circle-translate": [14, -8],
            },
          });

          map.addLayer({
            id: BOOSTED_CLUSTER_COUNT_LAYER,
            type: "symbol",
            slot: "top",
            source: BOOSTED_PROPERTY_SOURCE,
            filter: ["has", "point_count"],
            layout: {
              "text-field": "{point_count_abbreviated}",
              "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
              "text-size": 11,
            },
            paint: {
              "text-color": "#4c341f",
              "text-translate": [14, -8],
            },
          });

          // An isolated property remains visible as a small dot when zoomed out.
          // Dots disappear when the normal price banners begin showing at zoom 10.
          map.addLayer({
            id: SINGLE_PROPERTY_LAYER,
            type: "circle",
            slot: "top",
            source: PROPERTY_SOURCE,
            maxzoom: STANDARD_MARKER_MIN_ZOOM,
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 3, 9, 5],
              "circle-color": "#513f30",
              "circle-stroke-color": "#fff8ee",
              "circle-stroke-width": 1.5,
            },
          });

          map.addLayer({
            id: BOOSTED_SINGLE_PROPERTY_LAYER,
            type: "circle",
            slot: "top",
            source: BOOSTED_PROPERTY_SOURCE,
            maxzoom: STANDARD_MARKER_MIN_ZOOM,
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 3.5, 9, 5.5],
              "circle-color": "#dfb56f",
              "circle-stroke-color": "#fff3d9",
              "circle-stroke-width": 1.5,
            },
          });

          // Invisible labels provide reliable click/hover targets for isolated points.
          map.addLayer({
            id: SINGLE_PROPERTY_FALLBACK,
            type: "symbol",
            slot: "top",
            source: PROPERTY_SOURCE,
            filter: ["!", ["has", "point_count"]],
            layout: {
              "text-field": ["get", "price"],
              "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
              "text-size": 11,
              "text-allow-overlap": true,
              "text-ignore-placement": true,
            },
            paint: { "text-opacity": 0.01 },
          });

          map.addLayer({
            id: BOOSTED_SINGLE_PROPERTY_FALLBACK,
            type: "symbol",
            slot: "top",
            source: BOOSTED_PROPERTY_SOURCE,
            filter: ["!", ["has", "point_count"]],
            layout: {
              "text-field": ["get", "price"],
              "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
              "text-size": 11,
              "text-allow-overlap": true,
              "text-ignore-placement": true,
            },
            paint: { "text-opacity": 0.01 },
          });

          const zoomToCluster = (sourceId: string) => (
            event: import("mapbox-gl").MapLayerMouseEvent,
          ) => {
            const feature = event.features?.[0] as
              | { properties?: { cluster_id?: number }; geometry?: { coordinates?: unknown } }
              | undefined;
            const clusterId = feature?.properties?.cluster_id;
            const source = map.getSource(sourceId) as
              | import("mapbox-gl").GeoJSONSource
              | undefined;
            const coordinates = feature?.geometry?.coordinates;

            if (
              clusterId === undefined ||
              !feature ||
              !source ||
              !Array.isArray(coordinates)
            ) {
              return;
            }

            source.getClusterExpansionZoom(clusterId, (error, zoom) => {
              if (error || typeof zoom !== "number") return;
              map.easeTo({ center: coordinates as [number, number], zoom });
            });
          };

          map.on("click", CLUSTER_LAYER, zoomToCluster(PROPERTY_SOURCE));
          map.on("click", CLUSTER_COUNT_LAYER, zoomToCluster(PROPERTY_SOURCE));
          map.on("click", BOOSTED_CLUSTER_LAYER, zoomToCluster(BOOSTED_PROPERTY_SOURCE));
          map.on("click", BOOSTED_CLUSTER_COUNT_LAYER, zoomToCluster(BOOSTED_PROPERTY_SOURCE));

          const selectUnclusteredProperty = (
            event: import("mapbox-gl").MapLayerMouseEvent,
          ) => {
            const id = getFeaturePropertyId(event.features?.[0]);
            if (id !== null) selectCallbackRef.current?.(id);
          };

          const highlightUnclusteredProperty = (
            event: import("mapbox-gl").MapLayerMouseEvent,
          ) => {
            const id = getFeaturePropertyId(event.features?.[0]);
            if (id !== null) highlightCallbackRef.current?.(id);
          };

          for (const layer of [SINGLE_PROPERTY_FALLBACK, BOOSTED_SINGLE_PROPERTY_FALLBACK]) {
            map.on("click", layer, selectUnclusteredProperty);
            map.on("mouseenter", layer, (event) => {
              map.getCanvas().style.cursor = "pointer";
              highlightUnclusteredProperty(event);
            });
            map.on("mouseleave", layer, () => {
              map.getCanvas().style.cursor = "";
              highlightCallbackRef.current?.(null);
            });
          }

          for (const layer of [
            CLUSTER_LAYER,
            CLUSTER_COUNT_LAYER,
            BOOSTED_CLUSTER_LAYER,
            BOOSTED_CLUSTER_COUNT_LAYER,
            SINGLE_PROPERTY_LAYER,
            BOOSTED_SINGLE_PROPERTY_LAYER,
          ]) {
            map.on("mouseenter", layer, () => {
              map.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", layer, () => {
              map.getCanvas().style.cursor = "";
            });
          }

          map.on("dragstart", () => {
            userMapInteractionRef.current = true;
          });
          map.on("zoomstart", (event) => {
            const originalEvent = (event as unknown as { originalEvent?: unknown }).originalEvent;
            if (originalEvent) userMapInteractionRef.current = true;
          });
          map.on("moveend", () => {
            const nextBounds = map.getBounds();
            const userInitiated = userMapInteractionRef.current;
            userMapInteractionRef.current = false;
            if (!nextBounds) return;

            boundsCallbackRef.current?.(
              {
                north: nextBounds.getNorth(),
                south: nextBounds.getSouth(),
                east: nextBounds.getEast(),
                west: nextBounds.getWest(),
              },
              userInitiated,
            );
          });

          setReady(true);
        });

        map.on("error", (event) => {
          if (event.error?.message) {
            setMapError(
              "The Mapbox map could not be loaded. Check the public token and network connection.",
            );
          }
        });
      })
      .catch(() => setMapError("The Mapbox library could not be loaded."));

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      if (resizeFrame !== undefined) window.cancelAnimationFrame(resizeFrame);

      markerRef.current?.remove();
      markerRef.current = null;
      markerRegistry.forEach((propertyMarker) => propertyMarker.remove());
      markerRegistry.clear();

      mapRef.current?.remove();
      mapRef.current = null;
      mapboxRef.current = null;
    };

    // The map is initialized once; other effects synchronize its data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * Sync regular and boosted properties into separate cluster sources.
   */
  useEffect(() => {
    const map = mapRef.current;
    if (
      !map ||
      !ready ||
      !map.getSource(PROPERTY_SOURCE) ||
      !map.getSource(BOOSTED_PROPERTY_SOURCE)
    ) {
      return;
    }

    const points = properties.flatMap((property) => {
      const coordinates = getValidCoordinates(property);
      if (!coordinates) return [];

      return [{
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [coordinates.longitude, coordinates.latitude] as [number, number],
        },
        properties: {
          id: property.id,
          price: compactPrice(property),
          boosted: Boolean(property.boops),
          selected: property.id === selectedId,
        },
      }];
    });

    const regularPoints = points.filter((point) => !point.properties.boosted);
    const boostedPoints = points.filter((point) => point.properties.boosted);

    (map.getSource(PROPERTY_SOURCE) as import("mapbox-gl").GeoJSONSource).setData({
      type: "FeatureCollection",
      features: regularPoints,
    });

    (map.getSource(BOOSTED_PROPERTY_SOURCE) as import("mapbox-gl").GeoJSONSource).setData({
      type: "FeatureCollection",
      features: boostedPoints,
    });

    if (fitToProperties && initialFitReady && !hasFittedPropertiesRef.current) {
      hasFittedPropertiesRef.current = true;
      if (!points.length || !mapboxRef.current) return;

      const lib = mapboxRef.current;
      if (points.length === 1) {
        map.flyTo({
          center: points[0].geometry.coordinates,
          zoom: STANDARD_MARKER_MIN_ZOOM,
          duration: 550,
          essential: true,
        });
      } else {
        const firstCoordinates = points[0].geometry.coordinates;
        const resultBounds = points.reduce(
          (current, point) => current.extend(point.geometry.coordinates),
          new lib.LngLatBounds(firstCoordinates, firstCoordinates),
        );

        map.fitBounds(resultBounds, {
          padding: 80,
          maxZoom: STANDARD_MARKER_MIN_ZOOM,
          duration: 550,
        });
      }
    }
  }, [fitToProperties, initialFitReady, properties, ready, selectedId]);

  /*
   * Keep the existing HTML banner design.
   * Create price banners only when the zoom level makes them readable,
   * and only for properties within the visible map bounds.
   */
  useEffect(() => {
    const map = mapRef.current;
    const mapboxgl = mapboxRef.current;
    if (!map || !mapboxgl || !ready) return;

    const markerRegistry = propertyMarkerRefs.current;

    const syncPropertyMarkers = () => {
      const zoom = map.getZoom();
      const mapBounds = map.getBounds();

      if (!mapBounds) {
        return;
      }

      const visibleProperties = properties.flatMap((property) => {
        const coordinates = getValidCoordinates(property);

        if (
          !coordinates ||
          !shouldRenderPriceMarker(property, zoom) ||
          !mapBounds.contains([
            coordinates.longitude,
            coordinates.latitude,
          ])
        ) {
          return [];
        }

        return [{ property, coordinates }];
      });

      // Оставь остальной код этой функции без изменений.

      const visibleIds = new Set(visibleProperties.map(({ property }) => property.id));

      markerRegistry.forEach((propertyMarker, propertyId) => {
        if (!visibleIds.has(propertyId)) {
          propertyMarker.remove();
          markerRegistry.delete(propertyId);
        }
      });

      visibleProperties.forEach(({ property, coordinates }) => {
        const existingMarker = markerRegistry.get(property.id);
        if (existingMarker) {
          existingMarker.setLngLat([coordinates.longitude, coordinates.latitude]);
          updatePropertyMarkerState(
            existingMarker.getElement(),
            property,
            property.id === selectedId,
            property.id === highlightedId,
          );
          return;
        }

        const element = createPropertyMarkerElement(property, property.id === selectedId);
        updatePropertyMarkerState(
          element,
          property,
          property.id === selectedId,
          property.id === highlightedId,
        );

        element.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          selectCallbackRef.current?.(property.id);
        });
        element.addEventListener("pointerenter", () => {
          highlightCallbackRef.current?.(property.id);
        });
        element.addEventListener("pointerleave", () => {
          highlightCallbackRef.current?.(null);
        });

        const propertyMarker = new mapboxgl.Marker({
          element,
          anchor: "bottom",
        })
          .setLngLat([coordinates.longitude, coordinates.latitude])
          .addTo(map);

        markerRegistry.set(property.id, propertyMarker);
      });
    };

    syncPropertyMarkers();

    // moveend fires after zooming and panning, so one listener covers both.
    map.on("moveend", syncPropertyMarkers);
    return () => {
      map.off("moveend", syncPropertyMarkers);
    };
  }, [properties, ready, selectedId, highlightedId]);

  /* Sync list-hover highlights with currently rendered markers. */
  useEffect(() => {
    propertyMarkerRefs.current.forEach((propertyMarker, propertyId) => {
      propertyMarker.getElement().classList.toggle(
        "is-highlighted",
        propertyId === highlightedId,
      );
    });
  }, [highlightedId, properties, ready]);

  /* Editable / standalone marker used on listing forms. */
  useEffect(() => {
    const map = mapRef.current;
    const mapboxgl = mapboxRef.current;

    const validMarker = hasValidCoordinates({
      latitude: markerLatitude,
      longitude: markerLongitude,
    });

    if (!map || !ready || !mapboxgl || !validMarker) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const point = {
      latitude: Number(markerLatitude),
      longitude: Number(markerLongitude),
    };

    markerRef.current?.remove();

    const next = new mapboxgl.Marker({
      color: "#513f30",
      draggable: interactiveMarker,
    })
      .setLngLat([point.longitude, point.latitude])
      .addTo(map);

    if (interactiveMarker) {
      next.on("dragend", () => {
        const position = next.getLngLat();
        onMarkerChange?.({ latitude: position.lat, longitude: position.lng });
      });
    }

    markerRef.current = next;
    map.flyTo({
      center: [point.longitude, point.latitude],
      zoom: Math.max(map.getZoom(), 14),
      essential: true,
    });

    return () => {
      next.remove();
      if (markerRef.current === next) markerRef.current = null;
    };
  }, [interactiveMarker, markerLatitude, markerLongitude, onMarkerChange, ready]);

  /* Fly to selected property when it was selected from the results panel. */
  useEffect(() => {
    const map = mapRef.current;
    if (!selectedId) {
      lastFocusedPropertyIdRef.current = null;
      return;
    }

    const property = properties.find((item) => item.id === selectedId);
    const coordinates = getValidCoordinates(property);

    if (
      !map ||
      !ready ||
      !coordinates ||
      selectedId === lastFocusedPropertyIdRef.current
    ) {
      return;
    }

    lastFocusedPropertyIdRef.current = selectedId;
    map.stop();
    map.flyTo({
      center: [coordinates.longitude, coordinates.latitude],
      zoom: Math.max(map.getZoom(), 13),
      duration: 650,
      essential: true,
    });
  }, [properties, ready, selectedId]);

  /* Full map 2D / 3D mode. Preview mode never enables 3D. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || preview) return;

    const standardMap = map as unknown as {
      setConfigProperty?: (scope: string, property: string, value: unknown) => void;
    };

    standardMap.setConfigProperty?.("basemap", "show3dObjects", isThreeDimensional);
    map.easeTo({
      pitch: isThreeDimensional ? 52 : 0,
      bearing: isThreeDimensional ? map.getBearing() : 0,
      duration: 650,
      essential: true,
    });
  }, [isThreeDimensional, preview, ready]);

  /* Resize after fullscreen changes. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const frame = window.requestAnimationFrame(() => map.resize());
    const settle = window.setTimeout(() => map.resize(), 230);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settle);
    };
  }, [fullscreen, ready]);

  const locateUser = () => {
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        mapRef.current?.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 14,
          essential: true,
        });
      },
      () => {
        setMapError(
          "Your location is unavailable. You can continue exploring the map manually.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  if (!mapboxToken) {
    return (
      <div className={`rentora-map ${className}`}>
        <MapConfigurationNotice />
      </div>
    );
  }

  return (
    <div className={`rentora-map ${className}`}>
      <div ref={containerRef} className="rentora-map-canvas" aria-label="Property map" />

      {!preview && (
        <div className="map-utility-controls">
          <button
            type="button"
            onClick={() => setIsThreeDimensional((current) => !current)}
            aria-pressed={isThreeDimensional}
            aria-label={isThreeDimensional ? twoDLabel : threeDLabel}
            title={isThreeDimensional ? twoDLabel : threeDLabel}
          >
            <Box size={17} />
            {isThreeDimensional ? twoDLabel : threeDLabel}
          </button>

          <button
            type="button"
            onClick={locateUser}
            aria-label={myLocationLabel}
            title={myLocationLabel}
          >
            <LocateFixed size={17} />
          </button>

          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-label={fullscreen ? exitFullscreenLabel : fullscreenLabel}
              title={fullscreen ? exitFullscreenLabel : fullscreenLabel}
            >
              {fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
            </button>
          )}
        </div>
      )}

      {mapError && <div className="map-error">{mapError}</div>}
    </div>
  );
}

/* Geographic highlight for Armenia using Mapbox Countries vector boundaries. */
function addArmeniaHighlight(map: import("mapbox-gl").Map) {
  if (!map.getSource(COUNTRY_BOUNDARIES_SOURCE)) {
    map.addSource(COUNTRY_BOUNDARIES_SOURCE, {
      type: "vector",
      url: "mapbox://mapbox.country-boundaries-v1",
    });
  }

  const armeniaFilter = [
    "all",
    ["==", ["get", "iso_3166_1"], "AM"],
    ["==", ["get", "disputed"], "false"],
    ["==", ["get", "worldview"], "all"],
  ] as import("mapbox-gl").FilterSpecification;

  if (!map.getLayer(ARMENIA_FILL_LAYER)) {
    map.addLayer({
      id: ARMENIA_FILL_LAYER,
      type: "fill",
      slot: "middle",
      source: COUNTRY_BOUNDARIES_SOURCE,
      "source-layer": "country_boundaries",
      filter: armeniaFilter,
      paint: {
        "fill-color": "#9b6f4d",
        "fill-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5, 0.22,
          7, 0.18,
          9, 0.12,
          12, 0.07,
        ],
      },
    });
  }

  if (!map.getLayer(ARMENIA_GLOW_LAYER)) {
    map.addLayer({
      id: ARMENIA_GLOW_LAYER,
      type: "line",
      slot: "middle",
      source: COUNTRY_BOUNDARIES_SOURCE,
      "source-layer": "country_boundaries",
      filter: armeniaFilter,
      paint: {
        "line-color": "#8b5f3f",
        "line-opacity": 0.22,
        "line-blur": 3,
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5, 5,
          7, 7,
          10, 9,
        ],
      },
    });
  }

  if (!map.getLayer(ARMENIA_BORDER_LAYER)) {
    map.addLayer({
      id: ARMENIA_BORDER_LAYER,
      type: "line",
      slot: "middle",
      source: COUNTRY_BOUNDARIES_SOURCE,
      "source-layer": "country_boundaries",
      filter: armeniaFilter,
      paint: {
        "line-color": "#68462f",
        "line-opacity": 0.95,
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5, 1.8,
          7, 2.5,
          10, 3,
          13, 3.4,
        ],
      },
    });
  }
}

function emptyCollection() {
  return {
    type: "FeatureCollection" as const,
    features: [],
  };
}

function shouldRenderPriceMarker(_property: Property, zoom: number) {
  return zoom >= STANDARD_MARKER_MIN_ZOOM;
}

function compactNumber(value: number) {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${Number.isInteger(millions) ? millions : millions.toFixed(1)}m`;
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(Math.round(value));
}

function compactPrice(property: Property) {
  const value = Number(property.price);
  const symbol =
    property.currency === "dram"
      ? "\u058f"
      : property.currency === "euro"
        ? "\u20ac"
        : property.currency === "dollar"
          ? "$"
          : "\u20bd";

  return Number.isFinite(value) ? `${symbol}${compactNumber(value)}` : "\u2014";
}

function formatMarkerPrice(property: Property) {
  return compactPrice(property);
}

function createPropertyMarkerElement(property: Property, selected: boolean) {
  const marker = document.createElement("button");
  marker.type = "button";

  // Preserve the current regular marker design and existing state classes.
  marker.className = `rentora-property-marker-root ${selected ? "is-selected" : ""} ${property.boops ? "is-boosted" : ""
    } ${property.status === "archived"
      ? "is-archived"
      : property.publishing === "PENDING"
        ? "is-pending"
        : property.publishing === "REJECTED"
          ? "is-rejected"
          : ""
    }`;

  marker.setAttribute(
    "aria-label",
    `${selected ? "Selected property" : "View property"}: ${formatMarkerPrice(property)}${property.boops ? ", Boosted listing" : ""
    }`,
  );

  const content = document.createElement("span");
  content.className = "rentora-property-marker-content";

  const icon = document.createElement("span");
  icon.className = "rentora-property-marker-icon";
  icon.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" fill="currentColor"/></svg>';

  const price = document.createElement("span");
  price.className = "rentora-property-marker-price";
  price.textContent = formatMarkerPrice(property);

  const tail = document.createElement("span");
  tail.className = "rentora-property-marker-tail";

  content.append(icon, price);
  marker.append(content, tail);
  updateBoostMarkerAppearance(marker, property);

  return marker;
}

function updatePropertyMarkerState(
  element: HTMLElement,
  property: Property,
  selected: boolean,
  highlighted: boolean,
) {
  element.classList.toggle("is-selected", selected);
  element.classList.toggle("is-highlighted", highlighted);
  element.classList.toggle("is-archived", property.status === "archived");
  element.classList.toggle(
    "is-pending",
    property.status !== "archived" && property.publishing === "PENDING",
  );
  element.classList.toggle(
    "is-rejected",
    property.status !== "archived" && property.publishing === "REJECTED",
  );

  updateBoostMarkerAppearance(element, property);
}

/** Apply a compact gold treatment only to boosted properties. */
function updateBoostMarkerAppearance(element: HTMLElement, property: Property) {
  const boosted = Boolean(property.boops);
  element.classList.toggle("is-boosted", boosted);

  const content = element.querySelector<HTMLElement>(
    ".rentora-property-marker-content",
  );
  const icon = element.querySelector<HTMLElement>(".rentora-property-marker-icon");
  const price = element.querySelector<HTMLElement>(".rentora-property-marker-price");
  const tail = element.querySelector<HTMLElement>(".rentora-property-marker-tail");

  if (!content) return;

  let badge = element.querySelector<HTMLElement>(
    ".rentora-property-marker-boost-badge",
  );

  if (boosted && !badge) {
    badge = document.createElement("span");
    badge.className = "rentora-property-marker-boost-badge";
    badge.textContent = "✦";
    badge.setAttribute("aria-hidden", "true");

    Object.assign(badge.style, {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "14px",
      height: "14px",
      flex: "0 0 14px",
      marginInline: "3px 4px",
      borderRadius: "50%",
      background: "#8c5e26",
      color: "#fff4db",
      fontSize: "9px",
      fontWeight: "800",
      lineHeight: "1",
      boxSizing: "border-box",
    });

    const priceElement = content.querySelector(".rentora-property-marker-price");
    if (priceElement) content.insertBefore(badge, priceElement);
    else content.appendChild(badge);
  }

  if (!boosted) badge?.remove();

  // Regular marker styles are untouched. Only Boost listings receive these overrides.
  content.style.background = boosted
    ? "linear-gradient(135deg, #f3dca9 0%, #dfb66f 100%)"
    : "";
  content.style.border = boosted ? "1px solid #bd8c48" : "";
  content.style.boxShadow = boosted
    ? "0 4px 11px rgba(101, 67, 27, 0.23)"
    : "";
  content.style.color = boosted ? "#4d351f" : "";

  if (icon) icon.style.color = boosted ? "#684922" : "";
  if (price) {
    price.style.color = boosted ? "#3d2a18" : "";
    price.style.fontWeight = boosted ? "800" : "";
  }
  if (tail) {
    tail.style.backgroundColor = boosted ? "#dfb66f" : "";
    tail.style.borderColor = boosted ? "#bd8c48" : "";
  }
}