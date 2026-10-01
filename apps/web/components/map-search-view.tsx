"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, List, Map as MapIcon, MapPin, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { propertiesApi } from "@/lib/api";
import type { Property, PropertyMapBounds } from "@/types/models";
import { cityOf, labels, priceOf } from "./property-card";
import { RentoraMap } from "./rentora-map";
import { MapFilterPanel } from "./map-filter-panel";
import { applySearchState, searchRequestFromState, searchStateFromParams, type SearchFormState } from "@/lib/property-search";
import { StatusBadge } from "./status-badge";
import { useI18n } from "@/context/i18n-context";

const defaultBounds: PropertyMapBounds = { north: 41.3, south: 38.8, east: 46.7, west: 43.3 };
const sameBounds = (first: PropertyMapBounds, second: PropertyMapBounds) => Math.abs(first.north - second.north) < .0005 && Math.abs(first.south - second.south) < .0005 && Math.abs(first.east - second.east) < .0005 && Math.abs(first.west - second.west) < .0005;
const cityMapCenters: Record<string, { latitude: number; longitude: number }> = {
  YEREVAN: { latitude: 40.1872, longitude: 44.5152 },
  GYUMRI: { latitude: 40.7894, longitude: 43.8475 },
  VANADZOR: { latitude: 40.8128, longitude: 44.4939 },
  DILIJAN: { latitude: 40.7417, longitude: 44.8639 },
  TSAGHKADZOR: { latitude: 40.5326, longitude: 44.7202 },
  SEVAN: { latitude: 40.5473, longitude: 44.9533 },
  JERMUK: { latitude: 39.8417, longitude: 45.6694 },
};

export function MapSearchView({ scope = "public" }: { scope?: "public" | "mine" }) {
  const { t } = useI18n();
  const isMyMap = scope === "mine";
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const mapTarget = useMemo(() => targetFromParams(params), [params]);
  const query = params.toString();
  const activeFilters = useMemo(() => searchStateFromParams(new URLSearchParams(query)), [query]);
  const cityTarget = activeFilters.city ? cityMapCenters[activeFilters.city] || null : null;
  const requestedCenter = mapTarget || cityTarget;
  const hasExplicitBounds = Boolean(boundsFromParams(params));
  const [filterForm, setFilterForm] = useState<SearchFormState>(activeFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const initialBounds = useMemo(() => boundsFromParams(params) || (requestedCenter ? boundsAround(requestedCenter) : defaultBounds), [params, requestedCenter]);
  const [items, setItems] = useState<Property[]>([]);
  const [bounds, setBounds] = useState<PropertyMapBounds>(initialBounds);
  const [pendingBounds, setPendingBounds] = useState<PropertyMapBounds | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(() => parseId(params.get("property")));
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [mobileMode, setMobileMode] = useState<"map" | "list">("map");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const loadedBoundsRef = useRef<PropertyMapBounds | null>(null);
  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  useEffect(() => {
    const timer = window.setTimeout(() => setFilterForm(activeFilters), 0);
    return () => window.clearTimeout(timer);
  }, [activeFilters]);

  useEffect(() => {
    if (!isFullscreen) return;
    const exitOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFullscreen(false);
    };
    document.documentElement.dataset.mapFullscreen = "true";
    window.addEventListener("keydown", exitOnEscape);
    return () => {
      delete document.documentElement.dataset.mapFullscreen;
      window.removeEventListener("keydown", exitOnEscape);
    };
  }, [isFullscreen]);

  const searchArea = useCallback(async (nextBounds: PropertyMapBounds, filters = activeFilters) => {
    setLoading(true);
    setHasError(false);
    try {
      const result = await (isMyMap
        ? propertiesApi.myMap(nextBounds, searchRequestFromState(filters))
        : propertiesApi.map(nextBounds, searchRequestFromState(filters)));
      setItems(result);
      loadedBoundsRef.current = nextBounds;
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, [activeFilters, isMyMap]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void searchArea(initialBounds); }, 0);
    return () => window.clearTimeout(timer);
  }, [initialBounds, searchArea]);

  const updateBounds = (next: PropertyMapBounds, userInitiated = false) => {
    setBounds(next);
    if (userInitiated && loadedBoundsRef.current && !sameBounds(next, loadedBoundsRef.current)) setPendingBounds(next);
  };

  const commitArea = async () => {
    if (!pendingBounds) return;
    const next = applySearchState(new URLSearchParams(), activeFilters);
    next.set("south", pendingBounds.south.toFixed(5));
    next.set("north", pendingBounds.north.toFixed(5));
    next.set("west", pendingBounds.west.toFixed(5));
    next.set("east", pendingBounds.east.toFixed(5));
    if (selectedId) next.set("property", String(selectedId));
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    setPendingBounds(null);
    await searchArea(pendingBounds);
  };

  const selectProperty = (id: number) => {
    setSelectedId(id);
    const next = new URLSearchParams(params.toString());
    next.set("property", String(id));
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    window.requestAnimationFrame(() => document.querySelector(`[data-map-property-id="${id}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  };

  const setFilter = <Key extends keyof SearchFormState>(key: Key, value: SearchFormState[Key]) => setFilterForm((current) => ({ ...current, [key]: value }));

  const applyFilters = async () => {
    const next = applySearchState(new URLSearchParams(params.toString()), filterForm);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    setFiltersOpen(false);
    const searchBounds = pendingBounds || bounds;
    setPendingBounds(null);
    await searchArea(searchBounds, filterForm);
  };

  const selected = items.find((property) => property.id === selectedId);
  const title = isMyMap ? t("myListings.myMapTitle") : t("map.title");
  const eyebrow = isMyMap ? t("myListings.eyebrow") : t("map.eyebrow");
  const description = isMyMap ? t("myListings.myMapCopy") : t("map.copy");
  const countLabel = isMyMap ? t("common.listings") : t("common.homes");
  const shouldFitInitialResults = !mapTarget && !cityTarget && !selectedId && !hasExplicitBounds;

  return <main className={`map-search-page ${isFullscreen ? "is-fullscreen" : ""}`}>
    <header className="map-search-header">
      <div className="map-search-title"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>
      <button type="button" className="map-filter-link" onClick={() => setFiltersOpen((current) => !current)} aria-expanded={filtersOpen}>
        <SlidersHorizontal size={16}/> <span>{t("map.advancedFilters")}</span>{activeFilterCount > 0 && <b>{activeFilterCount}</b>}
      </button>
    </header>
    {filtersOpen && <div className="map-filter-popover"><MapFilterPanel state={filterForm} onChange={setFilter} onApply={() => void applyFilters()} onClose={() => setFiltersOpen(false)}/></div>}
    <div className="map-mobile-tabs" role="tablist">
      <button type="button" role="tab" aria-selected={mobileMode === "map"} className={mobileMode === "map" ? "is-active" : ""} onClick={() => setMobileMode("map")}><MapIcon size={16}/> {t("map.map")}</button>
      <button type="button" role="tab" aria-selected={mobileMode === "list"} className={mobileMode === "list" ? "is-active" : ""} onClick={() => setMobileMode("list")}><List size={16}/> {items.length} {countLabel}</button>
    </div>
    <div className={`map-search-workspace show-${mobileMode}`}>
      <aside className="map-results-panel" aria-label={t("map.list")}>
        <div className="map-results-heading">
          <div><strong>{loading ? t("map.loadingListings") : t(isMyMap ? "map.listingsInArea" : "map.homesInArea", { count: items.length })}</strong><span>{isMyMap ? t("myListings.myMapCopy") : t("map.liveListingHint")}</span></div>
          {activeFilterCount > 0 && <em>{t("map.filtersActive", { count: activeFilterCount })}</em>}
        </div>
        {hasError ? <div className="map-results-empty map-results-failure"><MapPin size={24}/><strong>{t("map.resultsUnavailable")}</strong><button type="button" onClick={() => void searchArea(bounds)}>{t("common.tryAgain")}</button></div>
          : loading ? <MapResultsSkeleton />
            : items.length ? <div className="map-result-list">{items.map((property) => <MapPropertyRow property={property} key={property.id} selected={property.id === selectedId} highlighted={property.id === hoveredId} owned={isMyMap} onSelect={() => selectProperty(property.id)} onHighlight={setHoveredId}/>)}</div>
              : <div className="map-results-empty"><MapPin size={25}/><strong>{t(isMyMap ? "map.noMappedListings" : "map.noHomes")}</strong><p>{t(isMyMap ? "map.noMappedListingsCopy" : "map.noHomesCopy")}</p></div>}
      </aside>
      <section className="map-canvas-panel">
        <RentoraMap properties={items} initialCenter={requestedCenter} initialZoom={mapTarget ? 14 : cityTarget ? 11 : undefined} selectedId={selectedId} highlightedId={hoveredId} onHighlightProperty={setHoveredId} onSelectProperty={selectProperty} onBoundsChange={updateBounds} fitToProperties={shouldFitInitialResults} initialFitReady={!loading} fullscreen={isFullscreen} onToggleFullscreen={() => setIsFullscreen((current) => !current)} fullscreenLabel={t("map.fullscreen")} exitFullscreenLabel={t("map.exitFullscreen")} twoDLabel={t("map.twoD")} threeDLabel={t("map.threeD")} myLocationLabel={t("map.myLocation")} className="global-rentora-map"/>
        {pendingBounds && <button type="button" className="search-this-area" onClick={() => void commitArea()} disabled={loading}>{loading ? t("map.searching") : t("map.searchThisArea")}</button>}
        {selected && <SelectedPropertyPreview property={selected} onClose={() => setSelectedId(null)}/>}
      </section>
    </div>
  </main>;
}

function MapPropertyRow({ property, selected, highlighted, owned, onSelect, onHighlight }: { property: Property; selected: boolean; highlighted: boolean; owned: boolean; onSelect: () => void; onHighlight: (id: number | null) => void }) {
  const { t } = useI18n();
  return <button type="button" data-map-property-id={property.id} onClick={onSelect} onMouseEnter={() => onHighlight(property.id)} onMouseLeave={() => onHighlight(null)} onFocus={() => onHighlight(property.id)} onBlur={() => onHighlight(null)} className={`map-property-row ${selected ? "is-selected" : ""} ${highlighted ? "is-highlighted" : ""}`}>
    <div className="map-property-thumbnail">{property.images?.[0]?.url ? <img src={property.images[0].url} alt=""/> : <MapPin size={19}/>}</div>
    <div className="map-property-copy"><div className="map-property-price">{priceOf(property)}</div><strong>{property.title}</strong><span>{cityOf(property.city)} · {labels[property.category] || property.category}</span><small>{property.rooms} {t("common.rooms")} · {property.area} m²</small>{owned && <div className="map-owned-statuses"><StatusBadge value={property.publishing} kind="publishing"/><StatusBadge value={property.status} kind="property"/></div>}</div>
    <ChevronRight className="map-property-row-arrow" size={16}/>
  </button>;
}

function MapResultsSkeleton() {
  return <div className="map-result-list map-result-skeletons" aria-label="Loading"><div/><div/><div/><div/></div>;
}

function SelectedPropertyPreview({ property, onClose }: { property: Property; onClose: () => void }) {
  const { t } = useI18n();
  return <div className="map-selected-preview"><button type="button" onClick={onClose} aria-label={t("map.closePreview")}><ChevronLeft size={17}/></button><div>{property.images?.[0]?.url && <img src={property.images[0].url} alt=""/>}<div><span>{cityOf(property.city)}</span><strong>{property.title}</strong><b>{priceOf(property)}</b></div></div><Link href={`/properties/${property.id}`}>{t("common.viewListing")}</Link></div>;
}

function parseId(value: string | null) { const id = Number(value); return Number.isSafeInteger(id) && id > 0 ? id : null; }
function boundsFromParams(params: URLSearchParams): PropertyMapBounds | null { const values = [params.get("south"), params.get("north"), params.get("west"), params.get("east")]; if (values.some((value) => value === null || value === "")) return null; const [south, north, west, east] = values.map(Number); return [south, north, west, east].every(Number.isFinite) && south <= north && west <= east ? { south, north, west, east } : null; }
function targetFromParams(params: URLSearchParams) { const rawLatitude = params.get("lat"); const rawLongitude = params.get("lng"); if (rawLatitude === null || rawLatitude === "" || rawLongitude === null || rawLongitude === "") return null; const latitude = Number(rawLatitude); const longitude = Number(rawLongitude); return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : null; }
function boundsAround(point: { latitude: number; longitude: number }): PropertyMapBounds { const delta = .075; return { south: point.latitude - delta, north: point.latitude + delta, west: point.longitude - delta, east: point.longitude + delta }; }
