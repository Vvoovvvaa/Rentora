"use client";

import Link from "next/link";
import { MapPin, Navigation } from "lucide-react";
import type { Property } from "@/types/models";
import { cityOf } from "./property-card";
import { RentoraMap, hasCoordinates } from "./rentora-map";

export function PropertyLocation({ property }: { property: Property }) {
  const coordinates = hasCoordinates(property) ? { latitude: Number(property.latitude), longitude: Number(property.longitude) } : null;
  return <section className="property-location-section"><div className="property-location-heading"><div><p className="eyebrow">Location</p><h2>Where this home is</h2><p><MapPin size={16}/>{property.address || cityOf(property.city)}</p></div>{coordinates && <Link href={`/map?lat=${coordinates.latitude}&lng=${coordinates.longitude}&zoom=15&property=${property.id}`} className="location-map-link"><Navigation size={16}/> View on map</Link>}</div>{coordinates ? <RentoraMap marker={coordinates} properties={[property]} selectedId={property.id} className="property-location-map"/> : <div className="property-location-fallback"><MapPin size={20}/><div><strong>Location details are not available yet</strong><p>The seller has not added a map location for this listing.</p></div></div>}</section>;
}
