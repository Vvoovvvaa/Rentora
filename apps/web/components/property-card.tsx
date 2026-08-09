"use client";

import Link from "next/link";
import { BedDouble, Check, Eye, GitCompare, Heart, MapPin, Maximize2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiMessage, userApi } from "@/lib/api";
import type { Property } from "@/types/models";
import { useAuth } from "@/context/auth-context";
import { useCompare } from "@/context/compare-context";
import { categoryLabels, cityOf, getListingLabel, priceOf } from "./property-presentation";

export const labels = categoryLabels;
export { cityOf, priceOf } from "./property-presentation";

export function PropertyCard({ property, onFavorite }: { property: Property; onFavorite?: () => void }) {
  const { user } = useAuth();
  const { toggleProperty, isSelected } = useCompare();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const image = property.images?.[0]?.url;
  const selected = isSelected(property.id);

  const favorite = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) { router.push("/login"); return; }
    try {
      const result = await userApi.toggleFavorite(property.id);
      setSaved(result.status === "added");
      onFavorite?.();
    } catch (reason) { setError(apiMessage(reason)); }
  };

  const compare = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    toggleProperty(property.id);
  };

  return <article className="group relative overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70">
    <Link href={`/properties/${property.id}`} className="block">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
        {image ? <img src={image} alt={property.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105"/> : <div className="h-full w-full bg-[radial-gradient(circle_at_70%_20%,#c7d2fe,transparent_28%),linear-gradient(135deg,#334155,#0f172a)]"/>}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2"><span className="rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-700 backdrop-blur">{labels[property.category] || property.category}</span>{property.listing && <span className="rounded-full bg-[#f8f0e5]/95 px-3 py-1.5 text-[11px] font-bold tracking-wide text-[#6e4e34] backdrop-blur">{getListingLabel(property.listing)}</span>}</div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3"><h3 className="line-clamp-1 text-[15px] font-bold text-slate-900">{property.title}</h3><p className="whitespace-nowrap text-base font-bold tracking-tight text-slate-900">{priceOf(property)}</p></div>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={14} className="text-slate-400"/>{cityOf(property.city)}</p>
        <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500"><span className="flex items-center gap-1.5"><BedDouble size={15}/>{property.rooms} rooms</span><span className="flex items-center gap-1.5"><Maximize2 size={14}/>{property.area} m²</span><span className="ml-auto flex items-center gap-1"><Eye size={14}/>{property.views}</span></div>
      </div>
    </Link>
    <div className="property-card-actions absolute right-4 top-4">
      <button type="button" onClick={compare} className={`property-card-action property-compare-action ${selected ? "is-selected" : ""}`} aria-label={selected ? "Remove from comparison" : "Add to comparison"} aria-pressed={selected}>
        <GitCompare size={17}/>{selected && <span className="property-compare-check"><Check size={10} strokeWidth={3}/></span>}<span className="property-card-tooltip" role="tooltip">{selected ? "Selected for comparison" : "Compare"}</span>
      </button>
      <button type="button" onClick={favorite} className="property-card-action property-favorite-action" aria-label="Save property"><Heart size={17} className={saved ? "fill-rose-500 text-rose-500" : ""}/></button>
    </div>
    {error && <p className="px-5 pb-4 text-xs font-medium text-rose-600">{error}</p>}
  </article>;
}

export function PropertySkeleton() { return <div className="overflow-hidden rounded-[22px] border border-slate-100 bg-white p-4"><div className="skeleton aspect-[4/3]"/><div className="skeleton mt-5 h-5 w-2/3"/><div className="skeleton mt-3 h-4 w-1/2"/></div>; }
