"use client";

import Link from "next/link";
import { BedDouble, Check, Eye, GitCompare, Heart, MapPin, Maximize2, MoveUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiMessage, userApi } from "@/lib/api";
import type { Property } from "@/types/models";
import { useAuth } from "@/context/auth-context";
import { useCompare } from "@/context/compare-context";
import { categoryLabels, cityOf, formatMoney, getListingLabel, priceOf } from "./property-presentation";
import { useI18n } from "@/context/i18n-context";

export const labels = categoryLabels;
export { cityOf, priceOf } from "./property-presentation";

export function PropertyCard({ property, onFavorite }: { property: Property; onFavorite?: () => void }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toggleProperty, isSelected } = useCompare();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const image = property.images?.[0]?.url;
  const selected = isSelected(property.id);
  const pricePerSquareMeter = property.area > 0 ? Math.round(Number(property.price) / property.area) : undefined;

  const favorite = async (event: React.MouseEvent) => {
    event.preventDefault(); event.stopPropagation();
    if (!user) { router.push("/login"); return; }
    try { const result = await userApi.toggleFavorite(property.id); setSaved(result.status === "added"); onFavorite?.(); }
    catch (reason) { setError(apiMessage(reason)); }
  };
  const compare = (event: React.MouseEvent) => { event.preventDefault(); event.stopPropagation(); toggleProperty(property.id); };

  return <article aria-label={`${t("common.viewProperty")}: ${property.title}`} className="property-card group relative flex h-full flex-col overflow-hidden rounded-[28px] bg-[#fffdfa] shadow-[0_8px_25px_rgba(54,39,26,.08)] ring-1 ring-stone-900/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_25px_50px_rgba(54,39,26,.18)]">
    <Link href={`/properties/${property.id}`} className="flex h-full flex-col">
      <div className="relative aspect-[1.18/1] overflow-hidden bg-[#44362b]">
        {image ? <img src={image} alt={property.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-110"/> : <div className="h-full w-full bg-[radial-gradient(circle_at_72%_18%,#d8b88e,transparent_25%),linear-gradient(135deg,#6c513b,#211b17)]"/>}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent"/>
        <div className="absolute left-4 top-4 flex flex-wrap gap-2 pr-24">
          <span className="property-card-badge rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-[#4e3d2e] backdrop-blur-md">{labels[property.category] || property.category}</span>
          {property.listing && <span className="property-card-badge rounded-full bg-[#38291e]/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-[#fae5c4] backdrop-blur-md">{getListingLabel(property.listing)}</span>}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/75 via-black/25 to-transparent px-5 pb-4 pt-12">
          <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/65">{t("common.price")}</p><p className="property-card-price mt-1 text-2xl font-black tracking-[-.06em] text-white drop-shadow">{priceOf(property)}</p>{pricePerSquareMeter && <p className="mt-0.5 text-[11px] font-semibold text-white/75">{t("property.pricePerSquareMeter", { price: formatMoney(pricePerSquareMeter, property.currency) })}</p>}</div>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-md transition group-hover:opacity-100"><MoveUpRight size={17}/></span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="min-w-0"><h3 className="property-card-title line-clamp-2 text-[17px] font-extrabold leading-6 tracking-[-.035em] text-[#29211b]">{property.title}</h3><p className="property-card-meta mt-2 flex items-center gap-1.5 text-sm font-medium text-stone-500"><MapPin size={15} className="text-[#a77d54]"/>{cityOf(property.city)}</p></div>
        <div className="property-card-specs mt-5 grid grid-cols-3 divide-x divide-stone-200 border-y border-stone-100 bg-[#faf6f0] py-3 text-center">
          <span className="grid gap-1 text-[11px] font-bold text-stone-500"><BedDouble className="mx-auto text-[#9c7654]" size={15}/>{property.rooms} {t("common.rooms")}</span>
          <span className="grid gap-1 text-[11px] font-bold text-stone-500"><Maximize2 className="mx-auto text-[#9c7654]" size={15}/>{property.area} m²</span>
          <span className="grid gap-1 text-[11px] font-bold text-stone-500"><Eye className="mx-auto text-[#9c7654]" size={15}/>{property.views} {t("common.views")}</span>
        </div>
        <div className="mt-4 flex items-center justify-between"><span className="text-xs font-bold text-stone-400">{t("property.details")}</span><span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#8a6442] transition group-hover:translate-x-1">{t("common.viewProperty")} <MoveUpRight size={14}/></span></div>
      </div>
    </Link>
    <div className="absolute right-4 top-4 flex gap-2">
      <button type="button" onClick={compare} className={`property-card-action-button grid h-10 w-10 place-items-center rounded-full border text-sm shadow-lg backdrop-blur-md transition ${selected ? "border-[#ebc99d] bg-[#513f30] text-[#f8e3c4]" : "border-white/40 bg-white/90 text-[#493a2e] hover:bg-[#fff7ed]"}`} aria-label={selected ? t("property.removeFromCompare") : t("compare.compareProperties")} aria-pressed={selected} title={selected ? t("compare.selectedForComparison") : t("property.compare")}>
        {selected ? <Check size={18} strokeWidth={3}/> : <GitCompare size={18}/>}<span className="sr-only">{selected ? t("compare.selectedForComparison") : t("property.compare")}</span>
      </button>
      <button type="button" onClick={favorite} className={`property-card-action-button grid h-10 w-10 place-items-center rounded-full border border-white/40 bg-white/90 shadow-lg backdrop-blur-md transition hover:bg-[#fff7ed] ${saved ? "text-rose-500" : "text-[#493a2e]"}`} aria-label={t("property.saveHome")} title={t("property.saveHome")}><Heart size={18} className={saved ? "fill-current" : ""}/></button>
    </div>
    {error && <p className="border-t border-rose-100 bg-rose-50 px-5 py-3 text-xs font-semibold text-rose-700">{error}</p>}
  </article>;
}

export function PropertySkeleton() { return <div className="overflow-hidden rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-stone-200"><div className="skeleton aspect-[1.18/1]"/><div className="skeleton mt-5 h-5 w-2/3"/><div className="skeleton mt-3 h-4 w-1/2"/><div className="skeleton mt-6 h-12 w-full"/></div>; }
