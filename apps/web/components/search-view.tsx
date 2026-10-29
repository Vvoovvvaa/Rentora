"use client";

import { ArrowDownUp, Filter, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiMessage, propertiesApi } from "@/lib/api";
import type { Property, PropertyFeature, PropertyListing, PropertySort } from "@/types/models";
import { applySearchState, searchParamKeys, searchRequestFromState, searchStateFromParams, type SearchFormState } from "@/lib/property-search";
import { Empty, ErrorBlock } from "./home-view";
import { PropertyCard, PropertySkeleton } from "./property-card";
import { CustomSelect } from "./custom-select";
import { categoryLabels, cityOf, getFeatureLabel, getListingLabel, getSortOptions, readableEnum } from "./property-presentation";
import { SearchForm } from "./search-form";
import { useI18n } from "@/context/i18n-context";

export function SearchView() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useSearchParams();
  const query = params.toString();
  const activeState = useMemo(() => searchStateFromParams(new URLSearchParams(query)), [query]);
  const [form, setForm] = useState<SearchFormState>(activeState);
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setForm(activeState), 0);
    return () => window.clearTimeout(timer);
  }, [activeState]);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      propertiesApi.search(searchRequestFromState(activeState)).then((result) => { if (active) setItems(result); }).catch((reason) => { if (active) setError(apiMessage(reason)); }).finally(() => { if (active) setLoading(false); });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [activeState, requestVersion]);

  const set = <Key extends keyof SearchFormState>(key: Key, value: SearchFormState[Key]) => setForm((current) => ({ ...current, [key]: value }));
  const navigate = (nextState: SearchFormState) => {
    const next = applySearchState(new URLSearchParams(), nextState);
    router.push(`/search${next.size ? `?${next.toString()}` : ""}`);
  };
  const remove = (key: keyof SearchFormState) => {
    const next = { ...activeState, [key]: "" } as SearchFormState;
    navigate(next);
  };
  const clear = () => router.push("/search");
  const updateSort = (value: string) => navigate({ ...activeState, sort: value as PropertySort | "" });
  const active = searchParamKeys.filter((key) => key !== "sort" && Boolean(activeState[key]));
  const labelFor = (key: keyof SearchFormState, value: string) => {
    if (key === "city") return cityOf(value);
    if (key === "category") return categoryLabels[value] || readableEnum(value);
    if (key === "listing") return getListingLabel(value as PropertyListing);
    if (key === "features") return getFeatureLabel(value as PropertyFeature);
    if (key === "rooms") return `${value} ${t("common.rooms")}`;
    if (key === "minPrice") return `${t("common.from")} ${value}`;
    if (key === "maxPrice") return `${t("common.to")} ${value}`;
    if (key === "area") return `${value} m²`;
    if (key === "constructionYear") return `${t("search.constructionYear")}: ${value}`;
    return `${readableEnum(key)}: ${value}`;
  };

  return <main className="search-page">
    <div className="shell search-page-shell">
      <section className="search-hero">
        <div className="search-page-intro"><p className="eyebrow">{t("search.properties")}</p><h1>{t("search.title")}</h1><p>{t("search.subtitle")}</p></div>
        <div className="search-hero-count" aria-live="polite"><strong>{loading ? "—" : items.length}</strong><span>{t("common.listings")}</span></div>
        <div className="search-hero-filters"><SearchForm compact state={form} onChange={set} onSubmit={navigate} /></div>
      </section>
      {active.length > 0 && <div className="active-filters"><span>{t("search.advancedFilters")}</span>{active.map((key) => <button type="button" key={key} onClick={() => remove(key)}>{labelFor(key, activeState[key])}<X size={14} /></button>)}<button type="button" className="clear-filters" onClick={clear}>{t("common.clearAll")}</button></div>}
      <section className="search-results-section">
        <header className="search-results-header"><div><p className="eyebrow">{t("search.availableHomes")}</p><h2>{loading ? t("common.loading") : t("search.listingsFound", { count: items.length })}</h2></div><label className="search-sort-control"><span><ArrowDownUp size={15} />{t("search.sortBy")}</span><CustomSelect value={activeState.sort} onChange={updateSort} placeholder={t("search.sortBy")} ariaLabel={t("search.sortBy")} options={getSortOptions()} /></label></header>
        {error ? <ErrorBlock message={error} retry={() => setRequestVersion((version) => version + 1)} /> : <div className="listing-grid search-results-grid">{loading ? [1, 2, 3, 4, 5, 6].map((item) => <PropertySkeleton key={item} />) : items.map((property) => <PropertyCard property={property} key={property.id} />)}</div>}
        {!loading && !error && !items.length && <div className="search-empty"><Filter size={25} /><Empty label={t("search.noListings")} /><p>{t("search.emptyHint")}</p><button type="button" onClick={clear} className="btn-secondary">{t("search.clearFilters")}</button></div>}
      </section>
    </div>
  </main>;
}
