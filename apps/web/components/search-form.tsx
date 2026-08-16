"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Currency, PropertyFeature, PropertyListing } from "@/types/models";
import { currencyOptions, getFeatureGroups, getListingOptions } from "./property-form-options";
import { CustomSelect } from "./custom-select";
import { categoryLabels, cityOf, getFeatureLabel } from "./property-presentation";
import { applySearchState, searchStateFromParams, type SearchFormState } from "@/lib/property-search";
import { useI18n } from "@/context/i18n-context";

const cities = ["YEREVAN", "GYUMRI", "VANADZOR", "DILIJAN", "TSAGHKADZOR", "SEVAN", "JERMUK"];

type SearchFormProps = {
  compact?: boolean;
  state?: SearchFormState;
  onChange?: <Key extends keyof SearchFormState>(key: Key, value: SearchFormState[Key]) => void;
  onSubmit?: (state: SearchFormState) => void;
};

/** Shared search controls for the landing, catalogue and results experiences. */
export function SearchForm({ compact = false, state, onChange, onSubmit }: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const query = searchParams.toString();
  const urlState = useMemo(() => searchStateFromParams(new URLSearchParams(query)), [query]);
  const [localForm, setLocalForm] = useState<SearchFormState>(urlState);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const form = state ?? localForm;

  useEffect(() => {
    if (state) return;
    const timer = window.setTimeout(() => setLocalForm(urlState), 0);
    return () => window.clearTimeout(timer);
  }, [state, urlState]);

  const set = <Key extends keyof SearchFormState>(key: Key, value: SearchFormState[Key]) => {
    if (onChange) onChange(key, value);
    else setLocalForm((current) => ({ ...current, [key]: value }));
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (onSubmit) {
      onSubmit(form);
      return;
    }
    const params = applySearchState(new URLSearchParams(), form);
    router.push(`/search${params.size ? `?${params.toString()}` : ""}`);
  };
  const primary = <>
    <CustomSelect value={form.city} onChange={(value) => set("city", value)} placeholder={t("search.anyCity")} ariaLabel={t("property.city")} options={cities.map((city) => ({ value: city, label: cityOf(city) }))}/>
    <CustomSelect value={form.category} onChange={(value) => set("category", value)} placeholder={t("search.anyHomeType")} ariaLabel={t("search.anyHomeType")} options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))}/>
    <CustomSelect value={form.listing} onChange={(value) => set("listing", value as PropertyListing | "")} placeholder={t("search.saleOrRent")} ariaLabel={t("search.saleOrRent")} options={getListingOptions()}/>
    <CustomSelect value={form.rooms} onChange={(value) => set("rooms", value)} placeholder={t("search.anyRooms")} ariaLabel={t("property.rooms")} options={[1, 2, 3, 4, 5].map((rooms) => ({ value: String(rooms), label: `${rooms} ${t("common.rooms")}` }))}/>
  </>;
  const numberInput = <Key extends "minPrice" | "maxPrice" | "bedrooms" | "floor" | "constructionYear" | "area">(key: Key, label: string) => <label className="field property-search-number"><span>{label}</span><input value={form[key]} onChange={(event) => set(key, event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder={t("common.any")}/></label>;
  const featureOptions = getFeatureGroups((id) => t(`property.${id}`)).flatMap((group) => group.options.map((option) => ({ value: option.value, label: getFeatureLabel(option.value) })));

  if (!compact) return <form onSubmit={submit} className="hero-search rounded-3xl border border-white/15 bg-white/5 p-4 shadow-2xl shadow-black/20 backdrop-blur-md">{primary}<button className="btn-primary gap-2"><Search size={18}/> {t("search.searchHomes")}</button></form>;

  return <form onSubmit={submit} className="property-search-panel">
    <div className="property-search-primary">{primary}</div>
    <div className="property-search-secondary">
      {numberInput("minPrice", t("search.priceFrom"))}
      {numberInput("maxPrice", t("search.priceTo"))}
      <button type="button" onClick={() => setAdvancedOpen((open) => !open)} className={`property-search-advanced-toggle ${advancedOpen ? "is-active" : ""}`} aria-expanded={advancedOpen}><SlidersHorizontal size={16}/>{advancedOpen ? t("search.hideAdvancedFilters") : t("search.advancedFilters")}</button>
      <button className="property-search-submit"><Search size={18}/> {t("search.searchHomes")}</button>
    </div>
    {advancedOpen && <div className="property-search-advanced">
      <div className="property-search-advanced-grid">
        {numberInput("bedrooms", t("property.bedrooms"))}
        {numberInput("floor", t("property.floor"))}
        {numberInput("constructionYear", t("search.constructionYear"))}
        {numberInput("area", t("search.exactArea"))}
        <CustomSelect value={form.currency} onChange={(value) => set("currency", value as Currency | "")} placeholder={t("search.anyCurrency")} ariaLabel={t("search.anyCurrency")} options={currencyOptions}/>
        <CustomSelect value={form.features} onChange={(value) => set("features", value as PropertyFeature | "")} placeholder={t("search.anyFeature")} ariaLabel={t("search.anyFeature")} options={featureOptions}/>
      </div>
    </div>}
  </form>;
}
