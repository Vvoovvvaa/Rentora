"use client";

import { Search, X } from "lucide-react";
import type { Currency, PropertyFeature, PropertyListing, PropertySort } from "@/types/models";
import type { SearchFormState } from "@/lib/property-search";
import { CustomSelect } from "./custom-select";
import { categoryLabels, cityOf, getFeatureLabel, getSortOptions } from "./property-presentation";
import { currencyOptions, getFeatureGroups, getListingOptions } from "./property-form-options";
import { useI18n } from "@/context/i18n-context";

const cities = ["YEREVAN", "GYUMRI", "VANADZOR", "DILIJAN", "TSAGHKADZOR", "SEVAN", "JERMUK"];

export function MapFilterPanel({ state, onChange, onApply, onClose }: { state: SearchFormState; onChange: <Key extends keyof SearchFormState>(key: Key, value: SearchFormState[Key]) => void; onApply: () => void; onClose: () => void }) {
  const { t } = useI18n();
  const numberField = <Key extends "minPrice" | "maxPrice" | "bedrooms" | "floor" | "constructionYear" | "area">(key: Key, label: string) => <label className="field search-number"><span>{label}</span><input value={state[key]} onChange={(event) => onChange(key, event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder={t("common.any")}/></label>;
  const featureOptions = getFeatureGroups((id) => t(`property.${id}`)).flatMap((group) => group.options.map((option) => ({ value: option.value, label: getFeatureLabel(option.value) })));
  return <form onSubmit={(event) => { event.preventDefault(); onApply(); }} className="map-filter-panel">
    <div className="map-filter-panel-head"><div><b>{t("map.filterTitle")}</b><span>{t("map.filterCopy")}</span></div><button type="button" onClick={onClose} aria-label={t("common.close")}><X size={17}/></button></div>
    <div className="map-filter-grid">
      <CustomSelect value={state.city} onChange={(value) => onChange("city", value)} placeholder={t("search.anyCity")} options={cities.map((value) => ({ value, label: cityOf(value) }))}/>
      <CustomSelect value={state.category} onChange={(value) => onChange("category", value)} placeholder={t("search.anyHomeType")} options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))}/>
      <CustomSelect value={state.listing} onChange={(value) => onChange("listing", value as PropertyListing | "")} placeholder={t("search.saleOrRent")} options={getListingOptions()}/>
      <CustomSelect value={state.currency} onChange={(value) => onChange("currency", value as Currency | "")} placeholder={t("search.anyCurrency")} options={currencyOptions}/>
      <CustomSelect value={state.rooms} onChange={(value) => onChange("rooms", value)} placeholder={t("search.anyRooms")} options={[1, 2, 3, 4, 5].map((value) => ({ value: String(value), label: `${value} ${t("common.rooms")}` }))}/>
      {numberField("minPrice", t("search.priceFrom"))}{numberField("maxPrice", t("search.priceTo"))}{numberField("bedrooms", t("property.bedrooms"))}{numberField("floor", t("property.floor"))}{numberField("constructionYear", t("search.constructionYear"))}{numberField("area", t("search.exactArea"))}
      <CustomSelect value={state.sort} onChange={(value) => onChange("sort", value as PropertySort | "")} placeholder={t("search.sortListings")} options={getSortOptions()}/>
      <CustomSelect value={state.features} onChange={(value) => onChange("features", value as PropertyFeature | "")} placeholder={t("search.anyFeature")} options={featureOptions}/>
    </div>
    <div className="map-filter-panel-actions"><button type="button" className="btn-secondary" onClick={onClose}>{t("common.cancel")}</button><button className="btn-primary"><Search size={16}/> {t("map.applyToMap")}</button></div>
  </form>;
}
