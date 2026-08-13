"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Archive, ArchiveRestore, BedDouble, CheckCircle2, Clock3, Eye, ExternalLink, LayoutGrid, Map, MapPin, Maximize2, Pencil, Plus, XCircle } from "lucide-react";
import { apiMessage, propertiesApi } from "@/lib/api";
import type { Property } from "@/types/models";
import { categoryLabels, cityOf, formatMoney, getListingLabel, priceOf } from "./property-presentation";

type OwnerFilter = "all" | "published" | "pending" | "rejected" | "archived";
type OwnerSort = "newest" | "oldest" | "price-desc" | "price-asc";

function listingState(property: Property) {
  if (property.status === "archived") return { key: "archived", label: "Archived", icon: Archive };
  if (property.publishing === "PENDING") return { key: "pending", label: "Pending review", icon: Clock3 };
  if (property.publishing === "REJECTED") return { key: "rejected", label: "Rejected", icon: XCircle };
  if (property.status === "sold") return { key: "published", label: "Sold", icon: CheckCircle2 };
  if (property.status === "rented") return { key: "published", label: "Rented", icon: CheckCircle2 };
  return { key: "published", label: "Published", icon: CheckCircle2 };
}

function matchesFilter(property: Property, filter: OwnerFilter) { return filter === "all" || listingState(property).key === filter; }

function sortListings(items: Property[], sort: OwnerSort) {
  return [...items].sort((first, second) => {
    if (sort === "price-asc") return Number(first.price) - Number(second.price);
    if (sort === "price-desc") return Number(second.price) - Number(first.price);
    const firstTime = first.createdAt ? new Date(first.createdAt).getTime() : 0;
    const secondTime = second.createdAt ? new Date(second.createdAt).getTime() : 0;
    return sort === "oldest" ? firstTime - secondTime : secondTime - firstTime;
  });
}

function OwnerPropertyCard({ property, onArchive, onRestore, actionBusy }: { property: Property; onArchive: (property: Property) => void; onRestore: (property: Property) => void; actionBusy: boolean }) {
  const image = property.images?.[0]?.url;
  const state = listingState(property);
  const StatusIcon = state.icon;
  const pricePerSquareMeter = property.area > 0 ? Math.round(Number(property.price) / property.area) : undefined;
  return <article className={`owner-property-card ${state.key === "archived" ? "is-archived" : ""}`}>
    <Link href={`/properties/${property.id}`} className="owner-property-image" aria-label={`View ${property.title}`}>
      {image ? <img src={image} alt={property.title}/> : <div className="owner-property-placeholder"/>}
      <div className="owner-property-image-top"><span>{categoryLabels[property.category] || property.category}</span>{property.listing && <span>{getListingLabel(property.listing)}</span>}</div>
      <span className={`owner-status-badge is-${state.key}`}><StatusIcon size={13}/>{state.label}</span>
      <div className="owner-property-price"><small>Price</small><strong>{priceOf(property)}</strong>{pricePerSquareMeter && <span>{formatMoney(pricePerSquareMeter, property.currency)} / m²</span>}</div>
    </Link>
    <div className="owner-property-content">
      <Link href={`/properties/${property.id}`} className="owner-property-title"><h2>{property.title}</h2><p><MapPin size={14}/>{cityOf(property.city)}</p></Link>
      <div className="owner-property-facts"><span><BedDouble size={15}/>{property.rooms} rooms</span><span><Maximize2 size={15}/>{property.area} m²</span><span><Eye size={15}/>{property.views} views</span></div>
    </div>
    <footer className="owner-property-actions">
      <Link href={`/properties/${property.id}`} className="btn-primary"><ExternalLink size={15}/>View</Link>
      <Link href={`/properties/${property.id}/edit`} className="btn-secondary"><Pencil size={15}/>Edit</Link>
      {property.status === "archived" ? <button type="button" onClick={() => onRestore(property)} disabled={actionBusy} className="owner-restore-action"><ArchiveRestore size={15}/>{actionBusy ? "Restoring…" : "Restore listing"}</button> : <button type="button" onClick={() => onArchive(property)} disabled={actionBusy} className="owner-archive-action"><Archive size={15}/>{actionBusy ? "Archiving…" : "Archive"}</button>}
    </footer>
  </article>;
}

export function OwnerListingsPage() {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState<OwnerFilter>("all");
  const [sort, setSort] = useState<OwnerSort>("newest");
  const [archiveTarget, setArchiveTarget] = useState<Property | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  const load = () => {
    setLoading(true); setError("");
    propertiesApi.mine().then(setItems).catch((reason) => setError(apiMessage(reason))).finally(() => setLoading(false));
  };
  useEffect(() => { const timer = window.setTimeout(load, 0); return () => window.clearTimeout(timer); }, []);

  const counts = useMemo(() => ({
    all: items.length,
    published: items.filter((item) => matchesFilter(item, "published")).length,
    pending: items.filter((item) => matchesFilter(item, "pending")).length,
    rejected: items.filter((item) => matchesFilter(item, "rejected")).length,
    archived: items.filter((item) => matchesFilter(item, "archived")).length,
  }), [items]);
  const visibleItems = useMemo(() => sortListings(items.filter((item) => matchesFilter(item, filter)), sort), [filter, items, sort]);
  const filters: Array<{ key: OwnerFilter; label: string }> = [{ key: "all", label: "All" }, { key: "published", label: "Published" }, { key: "pending", label: "Pending review" }, { key: "rejected", label: "Rejected" }, { key: "archived", label: "Archived" }];

  const archive = async () => {
    if (!archiveTarget) return;
    setActionId(archiveTarget.id); setNotice("");
    try {
      await propertiesApi.archive(archiveTarget.id);
      setNotice(`“${archiveTarget.title}” has been archived.`);
      setArchiveTarget(null);
      load();
    } catch (reason) { setError(apiMessage(reason)); setArchiveTarget(null); }
    finally { setActionId(null); }
  };
  const restore = async (property: Property) => {
    setActionId(property.id); setNotice(""); setError("");
    try {
      await propertiesApi.restore(property.id);
      setNotice(`“${property.title}” has been restored.`);
      load();
    } catch (reason) { setError(apiMessage(reason)); }
    finally { setActionId(null); }
  };
  const emptyCopy: Record<Exclude<OwnerFilter, "all">, [string, string]> = {
    published: ["No published listings", "Published properties will appear here."],
    pending: ["No listings pending review", "Properties waiting for moderation will appear here."],
    rejected: ["No rejected listings", "You have no rejected properties right now."],
    archived: ["No archived listings yet", "Archived properties will appear here."],
  };

  return <main className="owner-listings-page"><div className="shell owner-listings-shell">
    <section className="owner-workspace-hero"><header className="owner-listings-intro"><div><p className="eyebrow">Owner workspace</p><h1>My listings</h1><p>Manage your properties, publishing status and visibility.</p></div><div className="owner-intro-actions"><Link href="/my-properties/map" className="btn-secondary"><Map size={16}/>Map view</Link><Link href="/properties/create" className="btn-primary"><Plus size={16}/>Create listing</Link></div></header>
    <div className="owner-summary-row"><span><b>All</b><strong>{loading ? "—" : counts.all}</strong></span><span><b>Published</b><strong>{loading ? "—" : counts.published}</strong></span><span><b>Pending review</b><strong>{loading ? "—" : counts.pending}</strong></span><span><b>Rejected</b><strong>{loading ? "—" : counts.rejected}</strong></span><span><b>Archived</b><strong>{loading ? "—" : counts.archived}</strong></span></div></section>
    <section className="owner-listings-section"><div className="owner-listings-section-head"><div><h2>Your listings</h2><p>{loading ? "Loading listings…" : `${visibleItems.length} ${visibleItems.length === 1 ? "property" : "properties"}`}</p></div><p>Manage publishing, visibility and property details.</p></div>
      <div className="owner-listing-toolbar"><div className="owner-filter-tabs" role="tablist" aria-label="Listing status">{filters.map((item) => <button key={item.key} type="button" role="tab" aria-selected={filter === item.key} className={filter === item.key ? "is-active" : ""} onClick={() => setFilter(item.key)}>{item.label}<span>{counts[item.key]}</span></button>)}</div><label className="owner-sort"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value as OwnerSort)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="price-desc">Price: high to low</option><option value="price-asc">Price: low to high</option></select></label></div>
      {notice && <p className="owner-listings-notice" role="status">{notice}</p>}{error && <div className="owner-listings-error" role="alert"><p>{error}</p><button type="button" onClick={load}>Try again</button></div>}
      {!error && <div className="owner-property-grid">{loading ? [1, 2, 3].map((item) => <div className="owner-property-skeleton" key={item}/>) : visibleItems.map((property) => <OwnerPropertyCard key={property.id} property={property} onArchive={setArchiveTarget} onRestore={restore} actionBusy={actionId === property.id}/>)}</div>}
      {!loading && !error && !items.length && <div className="owner-listings-empty"><LayoutGrid size={28}/><h2>No listings yet</h2><p>Create your first property and start reaching people looking for a home.</p><Link href="/properties/create" className="btn-primary"><Plus size={16}/>Create listing</Link></div>}
      {!loading && !error && items.length > 0 && !visibleItems.length && <div className="owner-listings-empty compact"><h2>{filter === "all" ? "No listings found" : emptyCopy[filter][0]}</h2><p>{filter === "all" ? "Try another status to see the rest of your properties." : emptyCopy[filter][1]}</p></div>}
    </section>
    {archiveTarget && <div className="owner-confirm-backdrop" role="presentation"><section className="owner-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="archive-title"><p className="eyebrow">Archive listing</p><h2 id="archive-title">Archive this listing?</h2><p>It will no longer be shown as an active property. This does not delete the listing.</p><div><button type="button" className="btn-secondary" disabled={actionId !== null} onClick={() => setArchiveTarget(null)}>Cancel</button><button type="button" className="owner-archive-action" disabled={actionId !== null} onClick={archive}>{actionId ? "Archiving…" : "Archive listing"}</button></div></section></div>}
  </div></main>;
}
