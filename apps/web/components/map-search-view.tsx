"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, List, LoaderCircle, Map as MapIcon, MapPin, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiMessage, propertiesApi } from "@/lib/api";
import type { Property, PropertyMapBounds } from "@/types/models";
import { cityOf, labels, priceOf } from "./property-card";
import { RentoraMap } from "./rentora-map";
import { MapFilterPanel } from "./map-filter-panel";
import { applySearchState, searchRequestFromState, searchStateFromParams, type SearchFormState } from "@/lib/property-search";
import { StatusBadge } from "./status-badge";
import { useI18n } from "@/context/i18n-context";

const defaultBounds: PropertyMapBounds = { north: 41.3, south: 38.8, east: 46.7, west: 43.3 };
const sameBounds = (first: PropertyMapBounds, second: PropertyMapBounds) => Math.abs(first.north - second.north) < .0005 && Math.abs(first.south - second.south) < .0005 && Math.abs(first.east - second.east) < .0005 && Math.abs(first.west - second.west) < .0005;

export function MapSearchView({ scope = "public" }: { scope?: "public" | "mine" }) {
  const { t } = useI18n();
  const isMyMap = scope === "mine";
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const mapTarget = useMemo(() => targetFromParams(params), [params]);
  const query = params.toString();
  const activeFilters = useMemo(() => searchStateFromParams(new URLSearchParams(query)), [query]);
  const [filterForm, setFilterForm] = useState<SearchFormState>(activeFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const initialBounds = useMemo(() => boundsFromParams(params) || (mapTarget ? boundsAround(mapTarget) : defaultBounds), [mapTarget, params]);
  const [items, setItems] = useState<Property[]>([]);
  const [bounds, setBounds] = useState<PropertyMapBounds>(initialBounds);
  const [pendingBounds, setPendingBounds] = useState<PropertyMapBounds | null>(initialBounds);
  const [selectedId, setSelectedId] = useState<number | null>(() => parseId(params.get("property")));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMode, setMobileMode] = useState<"map" | "list">("map");
  const loadedBoundsRef = useRef<PropertyMapBounds | null>(null);

  useEffect(() => { const timer = window.setTimeout(() => setFilterForm(activeFilters), 0); return () => window.clearTimeout(timer); }, [activeFilters]);
  const searchArea = useCallback(async (nextBounds: PropertyMapBounds, filters = activeFilters) => {
    setLoading(true); setError("");
    try { const result = await (isMyMap ? propertiesApi.myMap(nextBounds, searchRequestFromState(filters)) : propertiesApi.map(nextBounds, searchRequestFromState(filters))); setItems(result); loadedBoundsRef.current = nextBounds; }
    catch (reason) { setError(apiMessage(reason)); }
    finally { setLoading(false); }
  }, [activeFilters, isMyMap]);
  useEffect(() => { const timer = window.setTimeout(() => { void searchArea(initialBounds); }, 0); return () => window.clearTimeout(timer); }, [initialBounds, searchArea]);
  const updateBounds = (next: PropertyMapBounds) => { setBounds(next); if (!loadedBoundsRef.current || !sameBounds(next, loadedBoundsRef.current)) setPendingBounds(next); };
  const commitArea = async () => { if (!pendingBounds) return; const next = applySearchState(new URLSearchParams(), activeFilters); next.set("south", pendingBounds.south.toFixed(5)); next.set("north", pendingBounds.north.toFixed(5)); next.set("west", pendingBounds.west.toFixed(5)); next.set("east", pendingBounds.east.toFixed(5)); if (selectedId) next.set("property", String(selectedId)); router.replace(`${pathname}?${next.toString()}`, { scroll: false }); setPendingBounds(null); await searchArea(pendingBounds); };
  const selectProperty = (id: number) => { setSelectedId(id); const next = new URLSearchParams(params.toString()); next.set("property", String(id)); router.replace(`${pathname}?${next.toString()}`, { scroll: false }); };
  const setFilter = <Key extends keyof SearchFormState>(key: Key, value: SearchFormState[Key]) => setFilterForm((current) => ({ ...current, [key]: value }));
  const applyFilters = async () => { const next = applySearchState(new URLSearchParams(params.toString()), filterForm); router.replace(`${pathname}?${next.toString()}`, { scroll: false }); setFiltersOpen(false); const searchBounds = pendingBounds || bounds; setPendingBounds(null); await searchArea(searchBounds, filterForm); };
  const selected = items.find((property) => property.id === selectedId);
  const title = isMyMap ? t("myListings.myMapTitle") : t("map.title");
  const eyebrow = isMyMap ? t("myListings.eyebrow") : t("map.eyebrow");
  const description = isMyMap ? t("myListings.myMapCopy") : t("map.copy");
  const countLabel = isMyMap ? t("common.listings") : t("common.homes");
  return <main className="map-search-page"><header className="map-search-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div><button type="button" className="map-filter-link" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={16}/> {t("map.advancedFilters")}</button></header>{filtersOpen && <MapFilterPanel state={filterForm} onChange={setFilter} onApply={() => void applyFilters()} onClose={() => setFiltersOpen(false)}/>}<div className="map-mobile-tabs" role="tablist"><button type="button" role="tab" aria-selected={mobileMode === "map"} className={mobileMode === "map" ? "is-active" : ""} onClick={() => setMobileMode("map")}><MapIcon size={16}/> {t("map.map")}</button><button type="button" role="tab" aria-selected={mobileMode === "list"} className={mobileMode === "list" ? "is-active" : ""} onClick={() => setMobileMode("list")}><List size={16}/> {items.length} {countLabel}</button></div><div className={`map-search-workspace show-${mobileMode}`}><aside className="map-results-panel"><div className="map-results-heading"><div><strong>{loading ? t("map.loadingListings") : t(isMyMap ? "map.listingsInArea" : "map.homesInArea", { count: items.length })}</strong><span>{isMyMap ? t("myListings.myMapCopy") : t("map.liveListingHint")}</span></div></div>{error ? <div className="map-results-empty"><p>{error}</p><button type="button" onClick={() => void searchArea(bounds)}>{t("common.tryAgain")}</button></div> : loading ? <div className="map-loading"><LoaderCircle className="animate-spin" size={24}/> {t("map.loadingListings")}</div> : items.length ? <div className="map-result-list">{items.map((property) => <MapPropertyRow property={property} key={property.id} selected={property.id === selectedId} owned={isMyMap} onSelect={() => selectProperty(property.id)}/>)}</div> : <div className="map-results-empty"><MapPin size={25}/><strong>{t(isMyMap ? "map.noMappedListings" : "map.noHomes")}</strong><p>{t(isMyMap ? "map.noMappedListingsCopy" : "map.noHomesCopy")}</p></div>}</aside><section className="map-canvas-panel"><RentoraMap properties={items} initialCenter={mapTarget} selectedId={selectedId} onSelectProperty={selectProperty} onBoundsChange={updateBounds} fitToProperties={isMyMap} className="global-rentora-map"/>{pendingBounds && <button type="button" className="search-this-area" onClick={() => void commitArea()} disabled={loading}>{loading ? t("map.searching") : t("map.searchThisArea")}</button>}{selected && <SelectedPropertyPreview property={selected} onClose={() => setSelectedId(null)}/>}</section></div></main>;
}

function MapPropertyRow({ property, selected, owned, onSelect }: { property: Property; selected: boolean; owned: boolean; onSelect: () => void }) {
  const { t } = useI18n();
  return <button type="button" onClick={onSelect} className={`map-property-row ${selected ? "is-selected" : ""}`}><div className="map-property-thumbnail">{property.images?.[0]?.url ? <img src={property.images[0].url} alt=""/> : <MapPin size={19}/>}</div><div><div className="map-property-price">{priceOf(property)}</div><strong>{property.title}</strong><span>{cityOf(property.city)} · {labels[property.category] || property.category}</span><small>{property.rooms} {t("common.rooms")} · {property.area} m²</small>{owned && <div className="map-owned-statuses"><StatusBadge value={property.publishing} kind="publishing"/><StatusBadge value={property.status} kind="property"/></div>}</div><ChevronRight size={16}/></button>;
}
function SelectedPropertyPreview({ property, onClose }: { property: Property; onClose: () => void }) { const { t } = useI18n(); return <div className="map-selected-preview"><button type="button" onClick={onClose} aria-label={t("map.closePreview")}><ChevronLeft size={17}/></button><div>{property.images?.[0]?.url && <img src={property.images[0].url} alt=""/>}<div><span>{cityOf(property.city)}</span><strong>{property.title}</strong><b>{priceOf(property)}</b></div></div><Link href={`/properties/${property.id}`}>{t("common.viewListing")}</Link></div>; }
function parseId(value: string | null) { const id = Number(value); return Number.isSafeInteger(id) && id > 0 ? id : null; }
function boundsFromParams(params: URLSearchParams): PropertyMapBounds | null { const values = [params.get("south"), params.get("north"), params.get("west"), params.get("east")]; if (values.some((value) => value === null || value === "")) return null; const [south, north, west, east] = values.map(Number); return [south, north, west, east].every(Number.isFinite) && south <= north && west <= east ? { south, north, west, east } : null; }
function targetFromParams(params: URLSearchParams) { const rawLatitude = params.get("lat"); const rawLongitude = params.get("lng"); if (rawLatitude === null || rawLatitude === "" || rawLongitude === null || rawLongitude === "") return null; const latitude = Number(rawLatitude); const longitude = Number(rawLongitude); return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : null; }
function boundsAround(point: { latitude: number; longitude: number }): PropertyMapBounds { const delta = .075; return { south: point.latitude - delta, north: point.latitude + delta, west: point.longitude - delta, east: point.longitude + delta }; }
