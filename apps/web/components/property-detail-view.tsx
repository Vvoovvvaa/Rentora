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
import { categoryLabels, cityOf, formatMoney, getListingLabel, isPublicProperty, priceOf } from "./property-presentation";

type DetailFact = { icon: typeof BedDouble; label: string; value: string };

export function PropertyDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const compare = useCompare();
  const [property, setProperty] = useState<Property | null>(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

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
      { icon: BedDouble, label: "Rooms", value: `${property.rooms}` },
      { icon: Maximize2, label: "Area", value: `${property.area} m²` },
      property.bedrooms ? { icon: BedDouble, label: "Bedrooms", value: `${property.bedrooms}` } : null,
      property.bathrooms ? { icon: Bath, label: "Bathrooms", value: `${property.bathrooms}` } : null,
      property.floor ? { icon: Maximize2, label: "Floor", value: property.totalFloors ? `${property.floor}/${property.totalFloors}` : `${property.floor}` } : null,
    ].filter((fact): fact is DetailFact => Boolean(fact));
  }, [property]);

  if (loading) return <div className="shell page-space"><div className="skeleton h-96"/></div>;
  if (loadError || !property) return <div className="shell page-space"><ErrorBlock message={loadError || "Property not found"} retry={load}/></div>;
  if (!isPublicProperty(property) && property.owner?.id !== user?.id) return <div className="shell page-space"><ErrorBlock message="This listing is not publicly available." retry={() => router.push("/properties")}/></div>;

  const hostName = property.owner?.name || "Property owner";
  const initials = hostName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const pricePerSquareMeter = property.area > 0 ? Math.round(Number(property.price) / property.area) : undefined;
  const description = property.description?.trim() || "";
  const shouldCollapseDescription = description.length > 460;
  const visibleDescription = shouldCollapseDescription && !descriptionExpanded ? `${description.slice(0, 460).trimEnd()}…` : description;
  const publishedDate = property.createdAt ? new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(property.createdAt)) : null;

  return <main className="property-detail-shell">
    <div className="shell property-detail-page">
      <Link href="/properties" className="back-link"><ArrowLeft size={16}/> Back to homes</Link>
      <PropertyGallery title={property.title} images={property.images || []}/>

      <div className="property-detail-layout">
        <section className="property-summary" aria-labelledby="property-title">
          <div className="property-summary-topline"><p className="eyebrow">{[property.listing ? getListingLabel(property.listing) : null, categoryLabels[property.category] || property.category, cityOf(property.city)].filter(Boolean).join(" · ")}</p>{property.views > 0 && <span className="property-views"><Eye size={14}/>{property.views} views</span>}</div>
          <div className="property-summary-heading"><div><h1 id="property-title">{property.title}</h1>{property.address && <p className="property-address"><MapPin size={17}/>{property.address}</p>}</div><div className="property-price"><strong>{priceOf(property)}</strong>{pricePerSquareMeter && <span>{formatMoney(pricePerSquareMeter, property.currency)} / m²</span>}</div></div>
          <div className="property-facts" aria-label="Property quick facts">{facts.map(({ icon: Icon, label, value }) => <div key={label}><Icon size={17}/><span><small>{label}</small><strong>{value}</strong></span></div>)}</div>
        </section>

        <aside className="property-owner-card" aria-label="Listing actions">
          <div className="property-owner-heading"><p className="eyebrow">Listed by</p><div className="property-owner-profile"><div className="host-avatar">{property.owner?.image?.url ? <img src={property.owner.image.url} alt={hostName} className="h-full w-full object-cover"/> : initials || <UserRound size={20}/>}</div><div className="min-w-0"><strong>{hostName}</strong>{property.owner?.gmailStatus === "VERIFIED" && <span className="verified-host"><ShieldCheck size={14}/> Verified email</span>}</div></div></div>
          <div className="property-owner-actions"><button type="button" onClick={contact} className="property-message-button"><MessageCircle size={18}/> Message owner</button>{property.owner?.phone && <a href={`tel:${property.owner.phone}`} className="property-call-button"><Phone size={17}/> Call owner</a>}<div className="property-secondary-actions"><button type="button" onClick={favorite} className={saved ? "is-saved" : ""}><Heart size={17} className={saved ? "fill-current" : ""}/>{saved ? "Saved" : "Save"}</button><button type="button" onClick={() => compare.toggleProperty(property.id)} className={compare.isSelected(property.id) ? "is-selected" : ""} aria-label={compare.isSelected(property.id) ? "Remove from comparison" : "Add to comparison"} aria-pressed={compare.isSelected(property.id)}>{compare.isSelected(property.id) ? <Check size={17}/> : <GitCompare size={17}/>} {compare.isSelected(property.id) ? "Added" : "Compare"}</button></div></div>
          <div className="property-owner-footer"><div className="property-listing-meta"><span>Listing ID <strong>#{property.id}</strong></span>{publishedDate && <span>Listed <strong>{publishedDate}</strong></span>}</div>{property.owner?.id !== user?.id && <PropertyReportDialog propertyId={property.id}/>}</div>
          {actionError && <p className="property-action-error" role="status">{actionError}</p>}
        </aside>

        <div className="property-detail-content">
          {description && <section className="property-description"><p className="eyebrow">Overview</p><h2>About this home</h2><p>{visibleDescription}</p>{shouldCollapseDescription && <button type="button" className="property-show-more" onClick={() => setDescriptionExpanded((expanded) => !expanded)}>{descriptionExpanded ? "Show less" : "Show more"}</button>}</section>}
          <PropertyCharacteristics property={property}/>
          <PropertyHighlights features={property.features}/>
          <PropertyLocation property={property}/>
        </div>
      </div>
    </div>
  </main>;
}
