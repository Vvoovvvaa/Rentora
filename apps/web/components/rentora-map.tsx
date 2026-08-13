"use client";

import { Box, LocateFixed, MapPinned } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Property, PropertyMapBounds } from "@/types/models";
import { hasValidCoordinates } from "@/lib/geocoding";

type Coordinates = { latitude: number; longitude: number };
type RentoraMapProps = {
  properties?: Property[];
  marker?: Coordinates | null;
  initialCenter?: Coordinates | null;
  selectedId?: number | null;
  interactiveMarker?: boolean;
  className?: string;
  onMarkerChange?: (coordinates: Coordinates) => void;
  onBoundsChange?: (bounds: PropertyMapBounds) => void;
  onSelectProperty?: (propertyId: number) => void;
  fitToProperties?: boolean;
};

const ARMENIA_CENTER: [number, number] = [44.5, 40.18];
const ARMENIA_ZOOM = 7;
const MAPBOX_STYLE = "mapbox://styles/mapbox/standard";
const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export const hasCoordinates = hasValidCoordinates;

export function MapConfigurationNotice({ compact = false }: { compact?: boolean }) {
  return <div className={`map-configuration-notice ${compact ? "is-compact" : ""}`}><MapPinned size={compact ? 18 : 24}/><div><strong>Mapbox is not configured</strong><p>Add a public <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> to <code>apps/web/.env.local</code>, then restart the web app.</p></div></div>;
}

export function RentoraMap({ properties = [], marker, initialCenter, selectedId, interactiveMarker = false, className = "", onMarkerChange, onBoundsChange, onSelectProperty, fitToProperties = false }: RentoraMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("mapbox-gl").Map | null>(null);
  const mapboxRef = useRef<typeof import("mapbox-gl").default | null>(null);
  const markerRef = useRef<import("mapbox-gl").Marker | null>(null);
  const propertyMarkerRefs = useRef<Map<number, import("mapbox-gl").Marker>>(new Map());
  const hasFittedPropertiesRef = useRef(false);
  const boundsCallbackRef = useRef(onBoundsChange);
  const selectCallbackRef = useRef(onSelectProperty);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [isThreeDimensional, setIsThreeDimensional] = useState(false);
  const markerLatitude = marker?.latitude;
  const markerLongitude = marker?.longitude;

  useEffect(() => { boundsCallbackRef.current = onBoundsChange; }, [onBoundsChange]);
  useEffect(() => { selectCallbackRef.current = onSelectProperty; }, [onSelectProperty]);

  useEffect(() => {
    if (!mapboxToken || !containerRef.current || mapRef.current) return;
    let disposed = false;
    const markerRegistry = propertyMarkerRefs.current;

    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (disposed || !containerRef.current) return;
      mapboxgl.accessToken = mapboxToken;
      mapboxRef.current = mapboxgl;
      const centerPoint = marker && hasCoordinates(marker) ? marker : initialCenter && hasCoordinates(initialCenter) ? initialCenter : null;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: MAPBOX_STYLE,
        center: centerPoint ? [centerPoint.longitude, centerPoint.latitude] : ARMENIA_CENTER,
        zoom: centerPoint ? 14 : ARMENIA_ZOOM,
        pitch: 0,
        attributionControl: false,
        config: { basemap: { lightPreset: "day", show3dObjects: false } },
      });
      mapRef.current = map;
      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");
      map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

      map.on("load", () => {
        if (disposed) return;
        map.addSource("rentora-properties", { type: "geojson", data: emptyCollection(), cluster: true, clusterMaxZoom: 14, clusterRadius: 48 });
        map.addLayer({ id: "rentora-clusters", type: "circle", slot: "top", source: "rentora-properties", filter: ["has", "point_count"], paint: { "circle-color": "#513f30", "circle-radius": ["step", ["get", "point_count"], 18, 10, 23, 30, 28], "circle-stroke-width": 2, "circle-stroke-color": "#f8f1e7" } });
        map.addLayer({ id: "rentora-cluster-count", type: "symbol", slot: "top", source: "rentora-properties", filter: ["has", "point_count"], layout: { "text-field": "{point_count_abbreviated}", "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"], "text-size": 12 }, paint: { "text-color": "#ffffff" } });
        map.addLayer({ id: "rentora-single-property-fallback", type: "symbol", slot: "top", source: "rentora-properties", filter: ["!", ["has", "point_count"]], layout: { "text-field": ["get", "price"], "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"], "text-size": 11, "text-allow-overlap": true, "text-ignore-placement": true }, paint: { "text-opacity": 0 } });
        map.on("click", "rentora-clusters", (event) => {
          const feature = map.queryRenderedFeatures(event.point, { layers: ["rentora-clusters"] })[0] as { properties?: { cluster_id?: number }; geometry?: { coordinates?: unknown } } | undefined;
          const clusterId = feature?.properties?.cluster_id;
          const source = map.getSource("rentora-properties") as import("mapbox-gl").GeoJSONSource;
          if (clusterId === undefined || !feature || !source) return;
          source.getClusterExpansionZoom(clusterId, (error, zoom) => {
            const coordinates = feature.geometry?.coordinates;
            if (!error && typeof zoom === "number" && Array.isArray(coordinates)) map.easeTo({ center: coordinates as [number, number], zoom });
          });
        });
        ["rentora-clusters", "rentora-single-property-fallback"].forEach((layer) => {
          map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
          map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; });
        });
        map.on("moveend", () => {
          const bounds = map.getBounds();
          if (bounds) boundsCallbackRef.current?.({ north: bounds.getNorth(), south: bounds.getSouth(), east: bounds.getEast(), west: bounds.getWest() });
        });
        setReady(true);
      });
      map.on("error", (event) => {
        if (event.error?.message) setMapError("The Mapbox map could not be loaded. Check the public token and network connection.");
      });
    }).catch(() => setMapError("The Mapbox library could not be loaded."));

    return () => {
      disposed = true;
      markerRef.current?.remove();
      markerRef.current = null;
      markerRegistry.forEach((propertyMarker) => propertyMarker.remove());
      markerRegistry.clear();
      mapRef.current?.remove();
      mapRef.current = null;
      mapboxRef.current = null;
    };
  // The renderer is intentionally initialized once. Data and interactions synchronize in effects below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !map.getSource("rentora-properties")) return;
    const points = properties.filter((property) => hasCoordinates(property)).map((property) => ({ type: "Feature" as const, geometry: { type: "Point" as const, coordinates: [Number(property.longitude), Number(property.latitude)] }, properties: { id: property.id, price: compactPrice(property), selected: property.id === selectedId } }));
    (map.getSource("rentora-properties") as import("mapbox-gl").GeoJSONSource).setData({ type: "FeatureCollection", features: points });
    if (fitToProperties && !hasFittedPropertiesRef.current && points.length && mapboxRef.current) {
      const lib = mapboxRef.current;
      if (points.length === 1) map.flyTo({ center: points[0].geometry.coordinates as [number, number], zoom: 13, duration: 550, essential: true });
      else {
        const bounds = points.reduce((current, point) => current.extend(point.geometry.coordinates as [number, number]), new lib.LngLatBounds(points[0].geometry.coordinates as [number, number], points[0].geometry.coordinates as [number, number]));
        map.fitBounds(bounds, { padding: 64, maxZoom: 13, duration: 550 });
      }
      hasFittedPropertiesRef.current = true;
    }
  }, [fitToProperties, properties, ready, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    const mapboxgl = mapboxRef.current;
    if (!map || !mapboxgl || !ready) return;
    const markerRegistry = propertyMarkerRefs.current;
    const clearPropertyMarkers = () => {
      markerRegistry.forEach((propertyMarker) => propertyMarker.remove());
      markerRegistry.clear();
    };
    const syncPropertyMarkers = () => {
      clearPropertyMarkers();
      const visibleIds = new Set(map.queryRenderedFeatures({ layers: ["rentora-single-property-fallback"] }).map((feature) => Number((feature as unknown as { properties?: { id?: number } }).properties?.id)));
      properties.filter((property) => hasCoordinates(property) && (visibleIds.has(property.id) || property.id === selectedId)).forEach((property) => {
        const element = createPropertyMarkerElement(property, property.id === selectedId);
        element.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); selectCallbackRef.current?.(property.id); });
        const propertyMarker = new mapboxgl.Marker({ element, anchor: "bottom" }).setLngLat([Number(property.longitude), Number(property.latitude)]).addTo(map);
        markerRegistry.set(property.id, propertyMarker);
      });
    };
    syncPropertyMarkers();
    map.on("idle", syncPropertyMarkers);
    map.on("moveend", syncPropertyMarkers);
    return () => { map.off("idle", syncPropertyMarkers); map.off("moveend", syncPropertyMarkers); clearPropertyMarkers(); };
  }, [properties, ready, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !hasValidCoordinates({ latitude: markerLatitude, longitude: markerLongitude }) || !mapboxRef.current) return;
    const point = { latitude: Number(markerLatitude), longitude: Number(markerLongitude) };
    markerRef.current?.remove();
    const next = new mapboxRef.current.Marker({ color: "#513f30", draggable: interactiveMarker }).setLngLat([point.longitude, point.latitude]).addTo(map);
    if (interactiveMarker) next.on("dragend", () => {
      const position = next.getLngLat();
      onMarkerChange?.({ latitude: position.lat, longitude: position.lng });
    });
    markerRef.current = next;
    map.flyTo({ center: [point.longitude, point.latitude], zoom: Math.max(map.getZoom(), 14), essential: true });
    return () => { next.remove(); };
  }, [interactiveMarker, markerLatitude, markerLongitude, onMarkerChange, ready]);

  useEffect(() => {
    const property = properties.find((item) => item.id === selectedId);
    const map = mapRef.current;
    if (property && map && hasCoordinates(property)) map.flyTo({ center: [Number(property.longitude), Number(property.latitude)], zoom: Math.max(map.getZoom(), 13), essential: true });
  }, [properties, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    // Mapbox Standard exposes 3D buildings through its basemap configuration. The guard keeps 2D fully functional if a future style omits that option.
    const standardMap = map as unknown as { setConfigProperty?: (scope: string, property: string, value: unknown) => void };
    standardMap.setConfigProperty?.("basemap", "show3dObjects", isThreeDimensional);
    map.easeTo({ pitch: isThreeDimensional ? 52 : 0, bearing: isThreeDimensional ? map.getBearing() : 0, duration: 650, essential: true });
  }, [isThreeDimensional, ready]);

  const locateUser = () => navigator.geolocation?.getCurrentPosition(
    (position) => mapRef.current?.flyTo({ center: [position.coords.longitude, position.coords.latitude], zoom: 14, essential: true }),
    () => setMapError("Your location is unavailable. You can continue exploring the map manually."),
    { enableHighAccuracy: true, timeout: 10_000 },
  );

  if (!mapboxToken) return <div className={`rentora-map ${className}`}><MapConfigurationNotice/></div>;
  return <div className={`rentora-map ${className}`}><div ref={containerRef} className="rentora-map-canvas" aria-label="Property map"/><div className="map-utility-controls"><button type="button" onClick={() => setIsThreeDimensional((current) => !current)} aria-pressed={isThreeDimensional} aria-label={isThreeDimensional ? "Switch to 2D map" : "Switch to 3D map"} title={isThreeDimensional ? "2D map" : "3D map"}><Box size={17}/>{isThreeDimensional ? "2D" : "3D"}</button><button type="button" onClick={locateUser} aria-label="Use my location" title="Use my location"><LocateFixed size={17}/></button></div>{mapError && <div className="map-error">{mapError}</div>}</div>;
}

function emptyCollection() { return { type: "FeatureCollection" as const, features: [] }; }
function compactPrice(property: Property) { const value = Number(property.price); const symbol = property.currency === "dram" ? "֏" : property.currency === "euro" ? "€" : property.currency === "dollar" ? "$" : "₽"; return Number.isFinite(value) ? `${symbol}${value >= 1000 ? `${Math.round(value / 1000)}k` : Math.round(value)}` : "—"; }
function formatMarkerPrice(property: Property) {
  const value = Number(property.price);
  const symbol = property.currency === "dram" ? "\u058f" : property.currency === "euro" ? "\u20ac" : property.currency === "dollar" ? "$" : "\u20bd";
  return Number.isFinite(value) ? `${symbol}${value >= 1000 ? `${Math.round(value / 1000)}k` : Math.round(value)}` : "\u2014";
}

function createPropertyMarkerElement(property: Property, selected: boolean) {
  const marker = document.createElement("button");
  marker.type = "button";
  marker.className = `rentora-property-marker ${selected ? "is-selected" : ""} ${property.status === "archived" ? "is-archived" : property.publishing === "PENDING" ? "is-pending" : property.publishing === "REJECTED" ? "is-rejected" : ""}`;
  marker.setAttribute("aria-label", `${selected ? "Selected property" : "View property"}: ${formatMarkerPrice(property)}`);
  const icon = document.createElement("span"); icon.className = "rentora-property-marker-icon"; icon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" fill="currentColor"/></svg>';
  const price = document.createElement("span"); price.className = "rentora-property-marker-price"; price.textContent = formatMarkerPrice(property);
  const tail = document.createElement("span"); tail.className = "rentora-property-marker-tail";
  marker.append(icon, price, tail);
  return marker;
}
