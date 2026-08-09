"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PropertyFeature, PropertyListing, PropertySort } from "@/types/models";
import { featureGroups, listingOptions } from "./property-form-options";
import { CustomSelect } from "./custom-select";
import { labels } from "./property-card";
import { getListingLabel } from "./property-presentation";

const cities = ["YEREVAN", "GYUMRI", "VANADZOR", "DILIJAN", "TSAGHKADZOR", "SEVAN", "JERMUK"];
const readable = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const featureOptions = featureGroups.flatMap((group) => group.options.map((option) => ({ value: option.value, label: readable(option.value) })));
const sortOptions: Array<{ value: PropertySort; label: string }> = [{ value: "NEWEST", label: "Newest first" }, { value: "OLDEST", label: "Oldest first" }, { value: "PRICE_ASC", label: "Price: low to high" }, { value: "PRICE_DESC", label: "Price: high to low" }, { value: "MOST_VIEWED", label: "Most viewed" }];

export function SearchForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [city, setCity] = useState(""); const [category, setCategory] = useState(""); const [listing, setListing] = useState<PropertyListing | "">(""); const [rooms, setRooms] = useState("");
  const [bedrooms, setBedrooms] = useState(""); const [floor, setFloor] = useState(""); const [constructionYear, setConstructionYear] = useState(""); const [feature, setFeature] = useState<PropertyFeature | "">(""); const [sort, setSort] = useState<PropertySort | "">("");
  const go = (event: React.FormEvent) => {
    event.preventDefault(); const params = new URLSearchParams();
    [["city", city], ["category", category], ["listing", listing], ["rooms", rooms], ["bedrooms", bedrooms], ["floor", floor], ["constructionYear", constructionYear], ["features", feature], ["sort", sort]].forEach(([key, value]) => { if (value) params.set(key, value); });
    router.push(`/search?${params.toString()}`);
  };
  const primary = <><CustomSelect value={city} onChange={setCity} placeholder="Any city" ariaLabel="City" options={cities.map((item) => ({ value: item, label: item[0] + item.slice(1).toLowerCase() }))}/><CustomSelect value={category} onChange={setCategory} placeholder="Any home type" ariaLabel="Home type" options={Object.entries(labels).map(([value, label]) => ({ value, label }))}/><CustomSelect value={listing} onChange={(value) => setListing(value as PropertyListing | "")} placeholder="Sale or rent" ariaLabel="Sale or rent" options={listingOptions.map((item) => ({ ...item, label: getListingLabel(item.value) }))}/><CustomSelect value={rooms} onChange={setRooms} placeholder="Any rooms" ariaLabel="Rooms" options={[1, 2, 3, 4, 5].map((number) => ({ value: String(number), label: `${number} ${number === 1 ? "room" : "rooms"}` }))}/></>;
  if (!compact) return <form onSubmit={go} className="hero-search rounded-3xl border border-white/15 bg-white/5 p-4 shadow-2xl shadow-black/20 backdrop-blur-md">{primary}<button className="btn-primary gap-2"><Search size={18}/> Search homes</button></form>;
  return <form onSubmit={go} className="compact-search"><div className="compact-search-primary">{primary}</div><div className="compact-search-advanced"><label className="field compact-number"><SlidersHorizontal size={15}/><input value={bedrooms} onChange={(event) => setBedrooms(event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Bedrooms"/></label><label className="field compact-number"><SlidersHorizontal size={15}/><input value={floor} onChange={(event) => setFloor(event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Floor"/></label><label className="field compact-number"><SlidersHorizontal size={15}/><input value={constructionYear} onChange={(event) => setConstructionYear(event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Year built"/></label><CustomSelect value={feature} onChange={(value) => setFeature(value as PropertyFeature | "")} placeholder="Any feature" ariaLabel="Feature" options={featureOptions}/><CustomSelect value={sort} onChange={(value) => setSort(value as PropertySort | "")} placeholder="Sort listings" ariaLabel="Sort listings" options={sortOptions}/><button className="btn-primary gap-2"><Search size={18}/> Search</button></div></form>;
}
