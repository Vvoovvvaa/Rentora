"use client";

import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiMessage, propertiesApi } from "@/lib/api";
import type { ArmeniaCity, Currency, Property, PropertyFeature, PropertyListing, PropertySort, SearchParams } from "@/types/models";
import { Empty, ErrorBlock } from "./home-view";
import { PropertyCard, PropertySkeleton } from "./property-card";
import { CustomSelect } from "./custom-select";
import { currencyOptions, featureGroups, listingOptions } from "./property-form-options";
import { categoryLabels, cityOf, getFeatureLabel, getListingLabel, readableEnum, sortOptions } from "./property-presentation";

const cities = ["YEREVAN", "GYUMRI", "VANADZOR", "DILIJAN", "TSAGHKADZOR", "SEVAN", "JERMUK"];
type SearchFormState = { city: string; category: string; listing: PropertyListing | ""; currency: Currency | ""; rooms: string; minPrice: string; maxPrice: string; bedrooms: string; floor: string; constructionYear: string; area: string; features: PropertyFeature | ""; sort: PropertySort | "" };
const paramKeys = ["city", "category", "listing", "currency", "rooms", "minPrice", "maxPrice", "bedrooms", "floor", "constructionYear", "area", "features", "sort"] as const;
const blankState: SearchFormState = { city: "", category: "", listing: "", currency: "", rooms: "", minPrice: "", maxPrice: "", bedrooms: "", floor: "", constructionYear: "", area: "", features: "", sort: "" };

function stateFromParams(params: URLSearchParams): SearchFormState {
  return paramKeys.reduce((state, key) => ({ ...state, [key]: params.get(key) || "" }), blankState) as SearchFormState;
}

function requestFromState(state: SearchFormState): SearchParams {
  const request: SearchParams = {};
  if (state.city) request.city = state.city as ArmeniaCity;
  if (state.category) request.category = state.category as SearchParams["category"];
  if (state.listing) request.listing = state.listing;
  if (state.currency) request.currency = state.currency;
  (["rooms", "minPrice", "maxPrice", "bedrooms", "floor", "constructionYear", "area"] as const).forEach((key) => { if (state[key]) request[key] = Number(state[key]); });
  if (state.features) request.features = state.features;
  if (state.sort) request.sort = state.sort;
  return request;
}

export function SearchView() {
  const router = useRouter();
  const params = useSearchParams();
  const query = params.toString();
  const activeState = useMemo(() => stateFromParams(new URLSearchParams(query)), [query]);
  const [form, setForm] = useState<SearchFormState>(activeState);
  const [moreOpen, setMoreOpen] = useState(false);
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
      setLoading(true); setError("");
      propertiesApi.search(requestFromState(activeState)).then((result) => { if (active) setItems(result); }).catch((reason) => { if (active) setError(apiMessage(reason)); }).finally(() => { if (active) setLoading(false); });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [activeState, requestVersion]);

  const set = <Key extends keyof SearchFormState>(key: Key, value: SearchFormState[Key]) => setForm((current) => ({ ...current, [key]: value }));
  const apply = (event: React.FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams();
    paramKeys.forEach((key) => { if (form[key]) next.set(key, form[key]); });
    router.push(`/search${next.size ? `?${next.toString()}` : ""}`);
  };
  const remove = (key: keyof SearchFormState) => { const next = new URLSearchParams(query); next.delete(key); router.push(`/search${next.size ? `?${next.toString()}` : ""}`); };
  const clear = () => router.push("/search");
  const active = paramKeys.filter((key) => Boolean(activeState[key]));
  const labelFor = (key: keyof SearchFormState, value: string) => {
    if (key === "city") return cityOf(value); if (key === "category") return categoryLabels[value] || readableEnum(value); if (key === "listing") return getListingLabel(value as PropertyListing); if (key === "features") return getFeatureLabel(value as PropertyFeature); if (key === "sort") return sortOptions.find((item) => item.value === value)?.label || value;
    if (key === "rooms") return `${value} rooms`; if (key === "minPrice") return `From ${value}`; if (key === "maxPrice") return `Up to ${value}`; if (key === "area") return `${value} m²`; if (key === "constructionYear") return `Built ${value}`;
    return `${readableEnum(key)}: ${value}`;
  };

  return <div className="shell page-space search-page">
    <div className="page-heading"><div><p className="eyebrow">Find your place</p><h1>Search homes</h1></div><p className="max-w-md text-sm leading-6 text-stone-500">Use the filters that matter to you. Search links keep their exact settings for sharing and returning later.</p></div>
    <form onSubmit={apply} className="search-panel soft-card">
      <div className="search-primary-grid">
        <CustomSelect value={form.city} onChange={(value) => set("city", value)} placeholder="Any city" options={cities.map((value) => ({ value, label: cityOf(value) }))}/>
        <CustomSelect value={form.category} onChange={(value) => set("category", value)} placeholder="Any home type" options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))}/>
        <CustomSelect value={form.rooms} onChange={(value) => set("rooms", value)} placeholder="Any rooms" options={[1, 2, 3, 4, 5].map((value) => ({ value: String(value), label: `${value} ${value === 1 ? "room" : "rooms"}` }))}/>
        <label className="field search-number"><span>Price from</span><input value={form.minPrice} onChange={(event) => set("minPrice", event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Any"/></label>
        <label className="field search-number"><span>Price to</span><input value={form.maxPrice} onChange={(event) => set("maxPrice", event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Any"/></label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" onClick={() => setMoreOpen((open) => !open)} className={`btn-secondary gap-2 ${moreOpen ? "is-active" : ""}`}><SlidersHorizontal size={16}/> More filters</button><CustomSelect className="search-sort" value={form.listing} onChange={(value) => set("listing", value as PropertyListing | "")} placeholder="Sale or rent" options={listingOptions.map((item) => ({ ...item, label: getListingLabel(item.value) }))}/><CustomSelect className="search-sort" value={form.currency} onChange={(value) => set("currency", value as Currency | "")} placeholder="Any currency" options={currencyOptions}/><CustomSelect className="search-sort" value={form.sort} onChange={(value) => set("sort", value as PropertySort | "")} placeholder="Sort listings" options={sortOptions}/><button className="btn-primary ml-auto gap-2"><Search size={17}/> Apply filters</button></div>
      {moreOpen && <div className="search-more-panel">
        <div className="search-extra-grid">
          <label className="field search-number"><span>Bedrooms</span><input value={form.bedrooms} onChange={(event) => set("bedrooms", event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Any"/></label>
          <label className="field search-number"><span>Floor</span><input value={form.floor} onChange={(event) => set("floor", event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Any"/></label>
          <label className="field search-number"><span>Construction year</span><input value={form.constructionYear} onChange={(event) => set("constructionYear", event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Any"/></label>
          <label className="field search-number"><span>Exact area, m²</span><input value={form.area} onChange={(event) => set("area", event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Any"/></label>
        </div>
        <div className="search-features"><div><p className="eyebrow">Feature</p><h2>Select one feature</h2><p>The current API supports one feature filter at a time.</p></div><div className="search-feature-groups">{featureGroups.map((group, index) => <section key={index}><h3><group.icon size={16}/>{["Parking & building", "Security & access", "Outdoor space", "Comfort", "Kitchen & appliances", "Utilities & connectivity", "Bathroom & storage", "Windows & surroundings"][index]}</h3><div>{group.options.map((option) => <button type="button" key={option.value} onClick={() => set("features", form.features === option.value ? "" : option.value)} className={`feature-option ${form.features === option.value ? "is-selected" : ""}`}>{getFeatureLabel(option.value)}</button>)}</div></section>)}</div></div>
      </div>}
    </form>
    {active.length > 0 && <div className="active-filters"><span>Active filters</span>{active.map((key) => <button type="button" key={key} onClick={() => remove(key)}>{labelFor(key, activeState[key])}<X size={14}/></button>)}<button type="button" className="clear-filters" onClick={clear}>Clear all</button></div>}
    {error ? <ErrorBlock message={error} retry={() => setRequestVersion((version) => version + 1)}/> : <div className="listing-grid">{loading ? [1, 2, 3, 4, 5, 6].map((item) => <PropertySkeleton key={item}/>) : items.map((property) => <PropertyCard property={property} key={property.id}/>)}</div>}
    {!loading && !error && !items.length && <div className="search-empty"><Filter size={25}/><Empty label="No homes match your filters."/><p>Try removing some filters or changing the price range.</p><button type="button" onClick={clear} className="btn-secondary">Clear filters</button></div>}
  </div>;
}
