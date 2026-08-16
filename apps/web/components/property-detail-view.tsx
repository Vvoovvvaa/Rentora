"use client";

import Link from "next/link";
import { ArrowLeft, Bath, BedDouble, Check, Eye, GitCompare, Heart, MapPin, Maximize2, MessageCircle, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useCompare } from "@/context/compare-context";
import { apiMessage, chatApi, propertiesApi, userApi } from "@/lib/api";
import type { Property } from "@/types/models";
import { ErrorBlock } from "./home-view";
import { PropertyGallery } from "./property-gallery";
import { PropertyCharacteristics, PropertyHighlights } from "./property-highlights";
import { PropertyLocation } from "./property-location";
import { PropertyReportDialog } from "./property-report-dialog";
import { PriceHistoryTrigger, PropertyPriceHistory, usePropertyPriceHistory } from "./property-price-history";
import { categoryLabels, cityOf, formatMoney, getListingLabel, isPublicProperty, priceOf } from "./property-presentation";
import { useI18n } from "@/context/i18n-context";

type DetailFact = { icon: typeof BedDouble; label: string; value: string };

export function PropertyDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { t, formatDate } = useI18n();
  const { user } = useAuth();
  const compare = useCompare();
  const [property, setProperty] = useState<Property | null>(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [priceHistoryExpanded, setPriceHistoryExpanded] = useState(false);
  const priceHistory = usePropertyPriceHistory(id);

  const load = () => {
    setLoading(true);
    setLoadError("");
    propertiesApi.one(id).then(setProperty).catch((reason) => setLoadError(apiMessage(reason))).finally(() => setLoading(false));
  };
  useEffect(() => { const timer = window.setTimeout(load, 0); return () => window.clearTimeout(timer); }, [id]);

  const contact = async () => {
    if (!property) return;
    try { const room = await chatApi.createRoom(property.id); router.push(`/messages?room=${room.id}`); }
    catch (reason) { setActionError(apiMessage(reason)); }
  };
  const favorite = async () => {
    if (!property) return;
    try { const result = await userApi.toggleFavorite(property.id); setSaved(result.status === "added"); }
    catch (reason) { setActionError(apiMessage(reason)); }
  };

  const facts = useMemo<DetailFact[]>(() => {
    if (!property) return [];
    return [
      { icon: BedDouble, label: t("property.rooms"), value: `${property.rooms}` },
      { icon: Maximize2, label: t("property.area"), value: `${property.area} m²` },
      property.bedrooms ? { icon: BedDouble, label: t("property.bedrooms"), value: `${property.bedrooms}` } : null,
      property.bathrooms ? { icon: Bath, label: t("property.bathrooms"), value: `${property.bathrooms}` } : null,
      property.floor ? { icon: Maximize2, label: t("property.floor"), value: property.totalFloors ? `${property.floor}/${property.totalFloors}` : `${property.floor}` } : null,
    ].filter((fact): fact is DetailFact => Boolean(fact));
  }, [property, t]);

  if (loading) return <div className="shell page-space"><div className="skeleton h-96"/></div>;
  if (loadError || !property) return <div className="shell page-space"><ErrorBlock message={loadError || t("property.notFound")} retry={load}/></div>;
  if (!isPublicProperty(property) && property.owner?.id !== user?.id) return <div className="shell page-space"><ErrorBlock message={t("property.notFound")} retry={() => router.push("/properties")}/></div>;

  const hostName = property.owner?.name || t("property.listedBy");
  const initials = hostName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const pricePerSquareMeter = property.area > 0 ? Math.round(Number(property.price) / property.area) : undefined;
  const description = property.description?.trim() || "";
  const shouldCollapseDescription = description.length > 460;
  const visibleDescription = shouldCollapseDescription && !descriptionExpanded ? `${description.slice(0, 460).trimEnd()}…` : description;
  const publishedDate = property.createdAt ? formatDate(property.createdAt, { month: "short", year: "numeric" }) : null;

  return <main className="property-detail-shell">
    <div className="shell property-detail-page">
      <Link href="/properties" className="back-link"><ArrowLeft size={16}/> {t("property.backToHomes")}</Link>
      <PropertyGallery title={property.title} images={property.images || []}/>

      <div className="property-detail-layout">
        <section className="property-summary" aria-labelledby="property-title">
          <div className="property-summary-topline"><p className="eyebrow">{[property.listing ? getListingLabel(property.listing) : null, categoryLabels[property.category] || property.category, cityOf(property.city)].filter(Boolean).join(" · ")}</p>{property.views > 0 && <span className="property-views"><Eye size={14}/>{property.views} {t("common.views")}</span>}</div>
          <div className="property-summary-heading"><div><h1 id="property-title">{property.title}</h1>{property.address && <p className="property-address"><MapPin size={17}/>{property.address}</p>}</div><div className="property-price"><strong>{priceOf(property)}</strong>{pricePerSquareMeter && <span>{t("property.pricePerSquareMeter", { price: formatMoney(pricePerSquareMeter, property.currency) })}</span>}<PriceHistoryTrigger property={property} request={priceHistory} expanded={priceHistoryExpanded} onToggle={() => setPriceHistoryExpanded((value) => !value)}/></div></div>
          <div className="property-facts" aria-label={t("property.details")}>{facts.map(({ icon: Icon, label, value }) => <div key={label}><Icon size={17}/><span><small>{label}</small><strong>{value}</strong></span></div>)}</div>
        </section>

        <PropertyPriceHistory property={property} request={priceHistory} expanded={priceHistoryExpanded}/>

        <aside className="property-owner-card" aria-label={t("property.listedBy")}>
          <div className="property-owner-heading"><p className="eyebrow">{t("property.listedBy")}</p><div className="property-owner-profile"><div className="host-avatar">{property.owner?.image?.url ? <img src={property.owner.image.url} alt={hostName} className="h-full w-full object-cover"/> : initials || <UserRound size={20}/>}</div><div className="min-w-0"><strong>{hostName}</strong>{property.owner?.gmailStatus === "VERIFIED" && <span className="verified-host"><ShieldCheck size={14}/> {t("property.verifiedEmail")}</span>}</div></div></div>
          <div className="property-owner-actions"><button type="button" onClick={contact} className="property-message-button"><MessageCircle size={18}/> {t("property.messageOwner")}</button>{property.owner?.phone && <a href={`tel:${property.owner.phone}`} className="property-call-button"><Phone size={17}/> {t("property.callOwner")}</a>}<div className="property-secondary-actions"><button type="button" onClick={favorite} className={saved ? "is-saved" : ""}><Heart size={17} className={saved ? "fill-current" : ""}/>{saved ? t("property.savedHome") : t("property.saveHome")}</button><button type="button" onClick={() => compare.toggleProperty(property.id)} className={compare.isSelected(property.id) ? "is-selected" : ""} aria-label={compare.isSelected(property.id) ? t("property.removeFromCompare") : t("property.compare")} aria-pressed={compare.isSelected(property.id)}>{compare.isSelected(property.id) ? <Check size={17}/> : <GitCompare size={17}/>} {compare.isSelected(property.id) ? t("property.addedToCompare") : t("property.compare")}</button></div></div>
          <div className="property-owner-footer"><div className="property-listing-meta"><span>{t("property.listingId")} <strong>#{property.id}</strong></span>{publishedDate && <span>{t("property.listed")} <strong>{publishedDate}</strong></span>}</div>{property.owner?.id !== user?.id && <PropertyReportDialog propertyId={property.id}/>}</div>
          {actionError && <p className="property-action-error" role="status">{actionError}</p>}
        </aside>

        <div className="property-detail-content">
          {description && <section className="property-description"><p className="eyebrow">{t("property.overview")}</p><h2>{t("property.about")}</h2><p>{visibleDescription}</p>{shouldCollapseDescription && <button type="button" className="property-show-more" onClick={() => setDescriptionExpanded((expanded) => !expanded)}>{descriptionExpanded ? t("common.showLess") : t("common.showMore")}</button>}</section>}
          <PropertyCharacteristics property={property}/>
          <PropertyHighlights features={property.features}/>
          <PropertyLocation property={property}/>
        </div>
      </div>
    </div>
  </main>;
}
