"use client";

import Link from "next/link";
import { Check, GitCompare, MapPin, Minus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useCompare } from "@/context/compare-context";
import { apiMessage, propertiesApi } from "@/lib/api";
import type { ComparedProperty, PropertyFeature } from "@/types/models";
import { ErrorBlock } from "./home-view";
import { featureGroups } from "./property-form-options";
import { featureGroupLabels } from "./property-highlights";
import { buildingLabels, cityOf, conditionLabels, formatMoney, getCategoryLabel, getFeatureLabel, heatingLabels, priceOf, readableEnum } from "./property-presentation";

const parseId = (value: string | null) => value && /^\d+$/.test(value) && Number(value) > 0 ? Number(value) : undefined;
const isPair = (first?: number, second?: number): first is number => Boolean(first && second && first !== second);
const numeric = (value: unknown) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : undefined; };
const dash = "—";

function pricePerSquareMeter(property: ComparedProperty) {
  const price = numeric(property.pricePerSquareMeter);
  return price === undefined ? dash : `${formatMoney(Math.round(price), property.currency)} / m²`;
}

function propertyValue(property: ComparedProperty, key: "area" | "rooms" | "bedrooms" | "bathrooms" | "floor" | "ceilingHeight" | "constructionYear" | "buildingType" | "condition" | "heatingType") {
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
  if (key === "heatingType") return heatingLabels[String(raw)] || readableEnum(String(raw));
  return String(raw);
}

function lowerHint(first: number | undefined, second: number | undefined, label: string) {
  if (first === undefined || second === undefined || first === second) return [undefined, undefined] as const;
  return first < second ? [label, undefined] as const : [undefined, label] as const;
}

function largerHint(first: number | undefined, second: number | undefined) {
  if (first === undefined || second === undefined || first === second) return [undefined, undefined] as const;
  return first > second ? ["Larger area", undefined] as const : [undefined, "Larger area"] as const;
}

function PropertySummary({ property, hint, priceHint, perSquareHint, onRemove }: { property: ComparedProperty; hint?: string; priceHint?: string; perSquareHint?: string; onRemove: () => void }) {
  const image = property.images?.[0]?.url;
  return <article className="compare-property-card">
    <div className="compare-summary-image">{image ? <img src={image} alt={property.title}/> : <div className="compare-image-placeholder"/>}<button className="compare-remove" type="button" onClick={onRemove} aria-label={`Remove ${property.title} from comparison`}><X size={15}/><span>Remove</span></button></div>
    <div className="compare-summary-content">
      <div className="compare-summary-meta"><span className="compare-category-badge">{getCategoryLabel(property.category)}</span><span><MapPin size={14}/>{cityOf(property.city)}</span></div>
      <h2>{property.title}</h2>
      <div className="compare-summary-prices"><div><strong>{priceOf(property)}</strong>{priceHint && <span className="compare-insight">{priceHint}</span>}</div><div><small>{pricePerSquareMeter(property)}</small>{perSquareHint && <span className="compare-insight">{perSquareHint}</span>}</div></div>
      {hint && <span className="sr-only">{hint}</span>}
      <Link href={`/properties/${property.id}`} className="compare-view-listing">View listing</Link>
    </div>
  </article>;
}

export function CompareView() {
  const router = useRouter();
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
    const grouped = featureGroups.map((group) => {
      const features = group.options.map((option) => option.value).filter((feature) => allFeatures.has(feature));
      features.forEach((feature) => remaining.delete(feature));
      return { label: featureGroupLabels[group.label] || group.label, features };
    }).filter((group) => group.features.length > 0);
    if (remaining.size) grouped.push({ label: "Other features", features: Array.from(remaining) });
    return grouped;
  }, [result]);

  const removeProperty = (id: number) => { remove(id); router.push("/compare"); };
  const clearComparison = () => { clear(); router.push("/compare"); };

  if (authLoading) return <div className="shell page-space"><div className="skeleton h-72"/></div>;
  if (!user) return <div className="shell page-space text-center"><GitCompare className="mx-auto text-[#a77d54]" size={38}/><h1 className="mt-5 text-3xl font-bold">Sign in to compare homes</h1><p className="mt-2 text-stone-500">Your selected homes will remain ready for comparison after you sign in.</p><Link href="/login" className="btn-primary mt-6">Log in</Link></div>;

  if (!hasTwoIds) {
    const oneSelected = selectedIds.length === 1;
    return <div className="shell page-space compare-page"><div className="compare-empty"><GitCompare size={32}/><p className="eyebrow">COMPARE</p><h1>{oneSelected ? "One home selected" : "Compare homes side by side"}</h1><p>{oneSelected ? "Choose one more listing to start comparing." : "Select two listings to compare prices, property details and amenities."}</p><Link href="/search" className="btn-primary">Explore homes</Link></div></div>;
  }

  const properties = result ? [result.firstProperty, result.secondProperty] : [];
  const detailRows: Array<{ label: string; key: "area" | "rooms" | "bedrooms" | "bathrooms" | "floor" | "ceilingHeight" | "constructionYear" | "buildingType" | "condition" | "heatingType" }> = [
    { label: "Area", key: "area" }, { label: "Rooms", key: "rooms" }, { label: "Bedrooms", key: "bedrooms" }, { label: "Bathrooms", key: "bathrooms" }, { label: "Floor", key: "floor" }, { label: "Ceiling height", key: "ceilingHeight" }, { label: "Year built", key: "constructionYear" }, { label: "Building type", key: "buildingType" }, { label: "Condition", key: "condition" }, { label: "Heating", key: "heatingType" },
  ];

  const sameCurrency = result?.firstProperty.currency === result?.secondProperty.currency;
  const [firstPriceHint, secondPriceHint] = sameCurrency && result ? lowerHint(numeric(result.firstProperty.price), numeric(result.secondProperty.price), "Lower price") : [undefined, undefined];
  const [firstPerSquareHint, secondPerSquareHint] = sameCurrency && result ? lowerHint(numeric(result.firstProperty.pricePerSquareMeter), numeric(result.secondProperty.pricePerSquareMeter), "Lower price / m²") : [undefined, undefined];
  const [firstAreaHint, secondAreaHint] = result ? largerHint(numeric(result.firstProperty.area), numeric(result.secondProperty.area)) : [undefined, undefined];

  return <div className="shell page-space compare-page">
    <header className="compare-page-header"><div><p className="eyebrow">COMPARE</p><h1>Compare homes</h1><p>See the important differences side by side.</p></div><button type="button" onClick={clearComparison} className="btn-secondary compare-clear-page"><X size={16}/> Clear comparison</button></header>
    {loading && <div className="compare-summary-grid mt-10"><div className="skeleton h-96"/><div className="skeleton h-96"/><p className="sr-only">Loading comparison...</p></div>}
    {error && <div className="mt-8"><h2 className="mb-3 text-xl font-bold text-stone-900">Couldn&apos;t load comparison</h2><ErrorBlock message={error} retry={() => setRequestVersion((version) => version + 1)}/></div>}
    {result && <>
      <section className="compare-summary-grid" aria-label="Selected properties">
        <PropertySummary property={properties[0]} priceHint={firstPriceHint} perSquareHint={firstPerSquareHint} hint={firstAreaHint} onRemove={() => removeProperty(properties[0].id)}/>
        <PropertySummary property={properties[1]} priceHint={secondPriceHint} perSquareHint={secondPerSquareHint} hint={secondAreaHint} onRemove={() => removeProperty(properties[1].id)}/>
      </section>
      <section className="compare-table-section"><div className="compare-section-heading"><div><p className="eyebrow">SIDE BY SIDE</p><h2>Property details</h2></div></div><div className="compare-table" role="table"><div className="compare-table-head" role="row"><span>Details</span><strong>{properties[0].title}</strong><strong>{properties[1].title}</strong></div>{detailRows.map((row) => <div className={`compare-table-row ${row.key === "area" ? "compare-highlight-row" : ""}`} role="row" key={row.key}><span>{row.label}</span><strong>{propertyValue(properties[0], row.key)}{row.key === "area" && firstAreaHint && <em className="compare-insight">{firstAreaHint}</em>}</strong><strong>{propertyValue(properties[1], row.key)}{row.key === "area" && secondAreaHint && <em className="compare-insight">{secondAreaHint}</em>}</strong></div>)}</div></section>
      {featureSections.length > 0 && <section className="compare-table-section compare-features-section"><div className="compare-section-heading"><div><p className="eyebrow">AMENITIES</p><h2>Amenities &amp; features</h2></div></div><div className="compare-feature-groups">{featureSections.map((group) => <section className="compare-feature-group" key={group.label}><h3>{group.label}</h3><div className="compare-table" role="table"><div className="compare-table-head" role="row"><span>Feature</span><strong>{properties[0].title}</strong><strong>{properties[1].title}</strong></div>{group.features.map((feature) => <div className="compare-table-row compare-feature-row" role="row" key={feature}><span>{getFeatureLabel(feature)}</span><strong>{properties[0].features?.includes(feature) ? <Check aria-label="Available" size={17}/> : <Minus aria-label="Not available" size={17}/>}</strong><strong>{properties[1].features?.includes(feature) ? <Check aria-label="Available" size={17}/> : <Minus aria-label="Not available" size={17}/>}</strong></div>)}</div></section>)}</div></section>}
    </>}
  </div>;
}
