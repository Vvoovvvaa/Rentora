"use client";

import Link from "next/link";
import { MapPin, Navigation } from "lucide-react";
import type { Property } from "@/types/models";
import { cityOf } from "./property-card";
import { RentoraMap, hasCoordinates } from "./rentora-map";
import { useI18n } from "@/context/i18n-context";

export function PropertyLocation({ property }: { property: Property }) {
  const { t } = useI18n();
  const coordinates = hasCoordinates(property) ? { latitude: Number(property.latitude), longitude: Number(property.longitude) } : null;
  return <section className="property-location-section"><div className="property-location-heading"><div><p className="eyebrow">{t("create.location")}</p><h2>{t("property.address")}</h2><p><MapPin size={16}/>{property.address || cityOf(property.city)}</p></div>{coordinates && <Link href={`/map?lat=${coordinates.latitude}&lng=${coordinates.longitude}&zoom=15&property=${property.id}`} className="location-map-link"><Navigation size={16}/>{t("property.viewOnMap")}</Link>}</div>{coordinates ? <RentoraMap marker={coordinates} properties={[property]} selectedId={property.id} className="property-location-map"/> : <div className="property-location-fallback"><MapPin size={20}/><div><strong>{t("property.noLocation")}</strong><p>{t("map.noMappedListingsCopy")}</p></div></div>}</section>;
}
