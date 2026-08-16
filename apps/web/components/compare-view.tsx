"use client";

import Link from "next/link";
import { Check, GitCompare, MapPin, Minus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useCompare } from "@/context/compare-context";
import { apiMessage, propertiesApi } from "@/lib/api";
import type { ComparedProperty, PropertyFeature, PropertyListing } from "@/types/models";
import { ErrorBlock } from "./home-view";
import { getFeatureGroups } from "./property-form-options";
import { buildingLabels, cityOf, conditionLabels, formatMoney, getCategoryLabel, getFeatureLabel, getListingLabel, priceOf, readableEnum } from "./property-presentation";
import { useI18n } from "@/context/i18n-context";

const parseId = (value: string | null) => value && /^\d+$/.test(value) && Number(value) > 0 ? Number(value) : undefined;
const isPair = (first?: number, second?: number): first is number => Boolean(first && second && first !== second);
const numeric = (value: unknown) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : undefined; };
const dash = "—";

type DetailKey = "price" | "pricePerSquareMeter" | "city" | "category" | "listing" | "area" | "rooms" | "bedrooms" | "bathrooms" | "floor" | "totalFloors" | "ceilingHeight" | "constructionYear" | "buildingType" | "condition";

function pricePerSquareMeter(property: ComparedProperty) {
  const price = numeric(property.pricePerSquareMeter);
  return price === undefined ? dash : `${formatMoney(Math.round(price), property.currency)} / m²`;
}

function propertyValue(property: ComparedProperty, key: DetailKey) {
  if (key === "price") return priceOf(property);
  if (key === "pricePerSquareMeter") return pricePerSquareMeter(property);
  if (key === "city") return cityOf(property.city);
  if (key === "category") return getCategoryLabel(property.category);
  if (key === "listing") return property.listing ? getListingLabel(property.listing as PropertyListing) : dash;
  const raw = property[key];
  if (key === "floor") {
    const floor = property.floor;
    const totalFloors = property.totalFloors;
    if (floor === undefined || floor === null) return dash;
    return totalFloors === undefined || totalFloors === null ? String(floor) : `${floor} / ${totalFloors}`;
  }
  if (raw === undefined || raw === null || raw === "") return dash;
  if (key === "area") return `${raw} m²`;
  if (key === "ceilingHeight") return `${raw} m`;
  if (key === "buildingType") return buildingLabels[String(raw) as keyof typeof buildingLabels] || readableEnum(String(raw));
  if (key === "condition") return conditionLabels[String(raw) as keyof typeof conditionLabels] || readableEnum(String(raw));
  return String(raw);
}

function numberDifference(first: number | undefined, second: number | undefined, suffix = "") {
  if (first === undefined || second === undefined || first === second) return "";
  return `${Math.abs(first - second)}${suffix}`;
}

function moneyDifference(first: number | undefined, second: number | undefined, currency: ComparedProperty["currency"]) {
  if (first === undefined || second === undefined || first === second) return "";
  return formatMoney(Math.abs(first - second), currency);
}

function SummaryFact({ label, value }: { label: string; value: string }) {
  return <span><small>{label}</small><strong>{value === dash ? "—" : value}</strong></span>;
}

function PropertySummary({ property, index, onRemove }: { property: ComparedProperty; index: number; onRemove: () => void }) {
  const { t } = useI18n();
  const image = property.images?.[0]?.url;
  return <article className="compare-property-card">
    <div className="compare-summary-image">{image ? <img src={image} alt={property.title}/> : <div className="compare-image-placeholder"/>}<button className="compare-remove" type="button" onClick={onRemove} aria-label={t("compare.remove")}><X size={15}/><span>{t("compare.remove")}</span></button></div>
    <div className="compare-summary-content">
      <p className="compare-property-identity">{index === 0 ? t("compare.propertyA") : t("compare.propertyB")}</p>
      <div className="compare-summary-meta"><div><span className="compare-category-badge">{getCategoryLabel(property.category)}</span>{property.listing && <span className="compare-listing-badge">{getListingLabel(property.listing)}</span>}</div><span><MapPin size={14}/>{cityOf(property.city)}</span></div>
      <h2>{property.title}</h2>
      <div className="compare-summary-prices"><strong>{priceOf(property)}</strong><small>{pricePerSquareMeter(property)}</small></div>
      <div className="compare-summary-facts"><SummaryFact label={t("property.rooms")} value={propertyValue(property, "rooms")}/><SummaryFact label={t("property.area")} value={propertyValue(property, "area")}/><SummaryFact label={t("property.bedrooms")} value={propertyValue(property, "bedrooms")}/></div>
      <Link href={`/properties/${property.id}`} className="compare-view-listing">{t("common.viewProperty")}</Link>
    </div>
  </article>;
}

function ComparisonColumnsHeader({ properties }: { properties: ComparedProperty[] }) {
  const { t } = useI18n();
  return <div className="comparison-columns-header" role="row"><span>{t("compare.parameter")}</span>{properties.map((property, index) => <div key={property.id} className="comparison-property-column"><small>{index === 0 ? t("compare.propertyA") : t("compare.propertyB")}</small>{property.images?.[0]?.url && <img src={property.images[0].url} alt=""/>}<div><strong>{property.title}</strong><span>{cityOf(property.city)} · {priceOf(property)}</span></div></div>)}</div>;
}

export function CompareView() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { selectedIds, remove, clear } = useCompare();
  const urlFirst = parseId(params.get("first"));
  const urlSecond = parseId(params.get("second"));
  const hasCompareQuery = params.has("first") || params.has("second");
  const queryIsValid = isPair(urlFirst, urlSecond);
  const fallbackFirst = selectedIds.length === 2 ? selectedIds[0] : undefined;
  const fallbackSecond = selectedIds.length === 2 ? selectedIds[1] : undefined;
  const usingFallback = !hasCompareQuery && isPair(fallbackFirst, fallbackSecond);
  const firstId = queryIsValid ? urlFirst : usingFallback ? fallbackFirst : undefined;
  const secondId = queryIsValid ? urlSecond : usingFallback ? fallbackSecond : undefined;
  const hasTwoIds = isPair(firstId, secondId);
  const [result, setResult] = useState<{ firstProperty: ComparedProperty; secondProperty: ComparedProperty } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    if (!user || !hasTwoIds || !firstId || !secondId) return;
    const request = async () => {
      setLoading(true); setError("");
      try { setResult(await propertiesApi.compare(firstId, secondId)); }
      catch (reason) { setError(apiMessage(reason)); }
      finally { setLoading(false); }
    };
    void request();
  }, [firstId, hasTwoIds, requestVersion, secondId, user]);

  const featureSections = useMemo(() => {
    if (!result) return [];
    const allFeatures = new Set<PropertyFeature>([...(result.firstProperty.features || []), ...(result.secondProperty.features || [])]);
    const remaining = new Set(allFeatures);
    const grouped = getFeatureGroups((id) => t(`property.${id}`)).map((group) => {
      const features = group.options.map((option) => option.value).filter((feature) => allFeatures.has(feature)).sort((first, second) => {
        const firstShared = result.firstProperty.features?.includes(first) && result.secondProperty.features?.includes(first);
        const secondShared = result.firstProperty.features?.includes(second) && result.secondProperty.features?.includes(second);
        return Number(firstShared) - Number(secondShared);
      });
      features.forEach((feature) => remaining.delete(feature));
      return { label: group.label, features };
    }).filter((group) => group.features.length > 0);
    if (remaining.size) grouped.push({ label: t("property.otherFeatures"), features: Array.from(remaining) });
    return grouped;
  }, [result, t]);

  const removeProperty = (id: number) => { remove(id); router.push("/compare"); };
  const clearComparison = () => { clear(); router.push("/compare"); };

  if (authLoading) return <div className="shell page-space"><div className="skeleton h-72"/></div>;
  if (!user) return <div className="shell page-space text-center"><GitCompare className="mx-auto text-[#a77d54]" size={38}/><h1 className="mt-5 text-3xl font-bold">{t("compare.title")}</h1><p className="mt-2 text-stone-500">{t("compare.emptyCopy")}</p><Link href="/login" className="btn-primary mt-6">{t("navigation.logIn")}</Link></div>;

  if (!hasTwoIds) {
    const oneSelected = selectedIds.length === 1;
    return <div className="shell page-space compare-page"><div className="compare-empty"><GitCompare size={32}/><p className="eyebrow">{t("compare.title")}</p><h1>{oneSelected ? t("compare.oneSelected") : t("compare.emptyTitle")}</h1><p>{oneSelected ? t("compare.oneSelectedCopy") : t("compare.emptyCopy")}</p><Link href="/search" className="btn-primary">{t("home.exploreHomes")}</Link></div></div>;
  }

  const properties = result ? [result.firstProperty, result.secondProperty] : [];
  const detailRows: Array<{ label: string; key: DetailKey }> = [
    { label: t("common.price"), key: "price" }, { label: t("compare.pricePerSquareMeter"), key: "pricePerSquareMeter" }, { label: t("property.city"), key: "city" }, { label: t("property.category"), key: "category" }, { label: t("create.listingPurpose"), key: "listing" }, { label: t("property.area"), key: "area" }, { label: t("property.rooms"), key: "rooms" }, { label: t("property.bedrooms"), key: "bedrooms" }, { label: t("property.bathrooms"), key: "bathrooms" }, { label: t("property.floor"), key: "floor" }, { label: t("property.totalFloors"), key: "totalFloors" }, { label: t("property.ceilingHeight"), key: "ceilingHeight" }, { label: t("property.constructionYear"), key: "constructionYear" }, { label: t("property.buildingType"), key: "buildingType" }, { label: t("property.condition"), key: "condition" },
  ];
  const visibleDetailRows = result ? detailRows.filter((row) => !(propertyValue(properties[0], row.key) === dash && propertyValue(properties[1], row.key) === dash)) : [];
  const sameCurrency = result?.firstProperty.currency === result?.secondProperty.currency;
  const lowerNote = (first: number | undefined, second: number | undefined, amount: string, label: string) => {
    if (first === undefined || second === undefined || first === second) return undefined;
    return first < second ? { side: 0, text: `${label} · ${amount}` } : { side: 1, text: `${label} · ${amount}` };
  };
  const largerNote = (first: number | undefined, second: number | undefined, amount: string, label: string) => {
    if (first === undefined || second === undefined || first === second) return undefined;
    return first > second ? { side: 0, text: `${label} · ${amount}` } : { side: 1, text: `${label} · ${amount}` };
  };
  const keyDifferences = result ? [
    { label: t("common.price"), first: priceOf(properties[0]), second: priceOf(properties[1]), note: sameCurrency ? lowerNote(numeric(properties[0].price), numeric(properties[1].price), moneyDifference(numeric(properties[0].price), numeric(properties[1].price), properties[0].currency), t("compare.lowerPrice")) : undefined },
    { label: t("compare.pricePerSquareMeter"), first: pricePerSquareMeter(properties[0]), second: pricePerSquareMeter(properties[1]), note: sameCurrency ? lowerNote(numeric(properties[0].pricePerSquareMeter), numeric(properties[1].pricePerSquareMeter), moneyDifference(numeric(properties[0].pricePerSquareMeter), numeric(properties[1].pricePerSquareMeter), properties[0].currency), t("compare.lowerPricePerSquareMeter")) : undefined },
    { label: t("property.area"), first: propertyValue(properties[0], "area"), second: propertyValue(properties[1], "area"), note: largerNote(numeric(properties[0].area), numeric(properties[1].area), numberDifference(numeric(properties[0].area), numeric(properties[1].area), " m²"), t("compare.largerArea")) },
    { label: t("property.rooms"), first: propertyValue(properties[0], "rooms"), second: propertyValue(properties[1], "rooms"), note: largerNote(numeric(properties[0].rooms), numeric(properties[1].rooms), numberDifference(numeric(properties[0].rooms), numeric(properties[1].rooms)), t("compare.moreRooms")) },
    { label: t("property.bedrooms"), first: propertyValue(properties[0], "bedrooms"), second: propertyValue(properties[1], "bedrooms"), note: largerNote(numeric(properties[0].bedrooms), numeric(properties[1].bedrooms), numberDifference(numeric(properties[0].bedrooms), numeric(properties[1].bedrooms)), t("compare.moreRooms")) },
  ].filter((row) => row.first !== dash || row.second !== dash) : [];

  return <div className="shell page-space compare-page">
    <header className="compare-page-header"><div><p className="eyebrow">{t("compare.title")}</p><h1>{t("compare.title")}</h1><p>{t("compare.subtitle")}</p></div><div className="compare-header-actions"><span>{t("compare.homesSelected", { count: 2 })}</span><button type="button" onClick={clearComparison} className="btn-secondary compare-clear-page"><X size={16}/> {t("compare.clearComparison")}</button></div></header>
    {loading && <div className="compare-summary-grid mt-8"><div className="skeleton h-80"/><div className="skeleton h-80"/><p className="sr-only">{t("common.loading")}</p></div>}
    {error && <div className="mt-8"><ErrorBlock message={error} retry={() => setRequestVersion((version) => version + 1)}/></div>}
    {result && <>
      <section className="compare-summary-grid" aria-label={t("compare.selected", { count: 2 })}>
        <PropertySummary property={properties[0]} index={0} onRemove={() => removeProperty(properties[0].id)}/>
        <PropertySummary property={properties[1]} index={1} onRemove={() => removeProperty(properties[1].id)}/>
      </section>
      <section className="compare-key-differences"><div className="compare-section-heading"><p className="eyebrow">{t("compare.title")}</p><h2>{t("compare.keyDifferences")}</h2></div><div className="compare-table-scroll"><div className="comparison-matrix comparison-key-matrix" role="table"><ComparisonColumnsHeader properties={properties}/>{keyDifferences.map((row) => <div className={`comparison-matrix-row ${row.first !== row.second ? "is-different" : ""}`} role="row" key={row.label}><span>{row.label}</span><strong>{row.first === dash ? t("compare.notSpecified") : row.first}{row.note?.side === 0 && <em>{row.note.text}</em>}</strong><strong>{row.second === dash ? t("compare.notSpecified") : row.second}{row.note?.side === 1 && <em>{row.note.text}</em>}</strong></div>)}</div></div></section>
      <section className="compare-table-section"><div className="compare-section-heading"><p className="eyebrow">{t("compare.title")}</p><h2>{t("compare.details")}</h2></div><div className="compare-table-scroll"><div className="comparison-matrix" role="table"><ComparisonColumnsHeader properties={properties}/>{visibleDetailRows.map((row) => { const first = propertyValue(properties[0], row.key); const second = propertyValue(properties[1], row.key); return <div className={`comparison-matrix-row ${first !== second ? "is-different" : ""}`} role="row" key={row.key}><span>{row.label}</span><strong>{first === dash ? t("compare.notSpecified") : first}</strong><strong>{second === dash ? t("compare.notSpecified") : second}</strong></div>; })}</div></div></section>
      {featureSections.length > 0 && <section className="compare-table-section compare-features-section"><div className="compare-section-heading"><p className="eyebrow">{t("search.feature")}</p><h2>{t("compare.amenities")}</h2></div><div className="compare-feature-groups">{featureSections.map((group) => <section className="compare-feature-group" key={group.label}><h3>{group.label}</h3><div className="compare-table-scroll"><div className="comparison-matrix" role="table"><ComparisonColumnsHeader properties={properties}/>{group.features.map((feature) => <div className="comparison-matrix-row comparison-feature-row" role="row" key={feature}><span>{getFeatureLabel(feature)}</span><strong>{properties[0].features?.includes(feature) ? <Check aria-label={t("compare.available")} size={17}/> : <Minus aria-label={t("compare.notAvailable")} size={17}/>}</strong><strong>{properties[1].features?.includes(feature) ? <Check aria-label={t("compare.available")} size={17}/> : <Minus aria-label={t("compare.notAvailable")} size={17}/>}</strong></div>)}</div></div></section>)}</div></section>}
    </>}
  </div>;
}
