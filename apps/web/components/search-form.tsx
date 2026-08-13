"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Currency, PropertyFeature, PropertyListing, PropertySort } from "@/types/models";
import { currencyOptions, featureGroups, listingOptions } from "./property-form-options";
import { CustomSelect } from "./custom-select";
import { labels } from "./property-card";
import { getListingLabel } from "./property-presentation";
import { applySearchState, searchStateFromParams, type SearchFormState } from "@/lib/property-search";

const cities = ["YEREVAN", "GYUMRI", "VANADZOR", "DILIJAN", "TSAGHKADZOR", "SEVAN", "JERMUK"];
const readable = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const featureOptions = featureGroups.flatMap((group) => group.options.map((option) => ({ value: option.value, label: readable(option.value) })));
const sortOptions: Array<{ value: PropertySort; label: string }> = [{ value: "NEWEST", label: "Newest first" }, { value: "OLDEST", label: "Oldest first" }, { value: "PRICE_ASC", label: "Price: low to high" }, { value: "PRICE_DESC", label: "Price: high to low" }, { value: "MOST_VIEWED", label: "Most viewed" }];

export function SearchForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const urlState = useMemo(() => searchStateFromParams(new URLSearchParams(query)), [query]);
  const [form, setForm] = useState<SearchFormState>(urlState);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  useEffect(() => { setForm(urlState); }, [urlState]);
  const set = <Key extends keyof SearchFormState>(key: Key, value: SearchFormState[Key]) => setForm((current) => ({ ...current, [key]: value }));
  const go = (event: React.FormEvent) => {
    event.preventDefault();
    const params = applySearchState(new URLSearchParams(), form);
    router.push(`/search${params.size ? `?${params.toString()}` : ""}`);
  };
  const primary = <><CustomSelect value={form.city} onChange={(value) => set("city", value)} placeholder="Any city" ariaLabel="City" options={cities.map((item) => ({ value: item, label: item[0] + item.slice(1).toLowerCase() }))}/><CustomSelect value={form.category} onChange={(value) => set("category", value)} placeholder="Any home type" ariaLabel="Home type" options={Object.entries(labels).map(([value, label]) => ({ value, label }))}/><CustomSelect value={form.listing} onChange={(value) => set("listing", value as PropertyListing | "")} placeholder="Sale or rent" ariaLabel="Sale or rent" options={listingOptions.map((item) => ({ ...item, label: getListingLabel(item.value) }))}/><CustomSelect value={form.rooms} onChange={(value) => set("rooms", value)} placeholder="Any rooms" ariaLabel="Rooms" options={[1, 2, 3, 4, 5].map((number) => ({ value: String(number), label: `${number} ${number === 1 ? "room" : "rooms"}` }))}/></>;
  if (!compact) return <form onSubmit={go} className="hero-search rounded-3xl border border-white/15 bg-white/5 p-4 shadow-2xl shadow-black/20 backdrop-blur-md">{primary}<button className="btn-primary gap-2"><Search size={18}/> Search homes</button></form>;
  return <form onSubmit={go} className="compact-search">
    <div className="compact-search-primary">{primary}<label className="field compact-number"><span className="sr-only">Minimum price</span><input value={form.minPrice} onChange={(event) => set("minPrice", event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Price from"/></label><label className="field compact-number"><span className="sr-only">Maximum price</span><input value={form.maxPrice} onChange={(event) => set("maxPrice", event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Price to"/></label></div>
    <div className="compact-search-actions"><button type="button" onClick={() => setAdvancedOpen((open) => !open)} className={`btn-secondary gap-2 ${advancedOpen ? "is-active" : ""}`}><SlidersHorizontal size={16}/>{advancedOpen ? "Hide advanced filters" : "Advanced filters"}</button><button className="btn-primary gap-2"><Search size={18}/> Search</button></div>
    {advancedOpen && <div className="compact-search-advanced"><label className="field compact-number"><input value={form.bedrooms} onChange={(event) => set("bedrooms", event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Bedrooms"/></label><label className="field compact-number"><input value={form.floor} onChange={(event) => set("floor", event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Floor"/></label><label className="field compact-number"><input value={form.constructionYear} onChange={(event) => set("constructionYear", event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Year built"/></label><label className="field compact-number"><input value={form.area} onChange={(event) => set("area", event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Area, m²"/></label><CustomSelect value={form.currency} onChange={(value) => set("currency", value as Currency | "")} placeholder="Any currency" ariaLabel="Currency" options={currencyOptions}/><CustomSelect value={form.features} onChange={(value) => set("features", value as PropertyFeature | "")} placeholder="Any feature" ariaLabel="Feature" options={featureOptions}/><CustomSelect value={form.sort} onChange={(value) => set("sort", value as PropertySort | "")} placeholder="Sort listings" ariaLabel="Sort listings" options={sortOptions}/></div>}
  </form>;
}
