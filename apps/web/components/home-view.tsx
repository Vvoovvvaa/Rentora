"use client";

import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  GitCompare,
  Map,
  MapPin,
  MessageCircle,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useI18n } from "@/context/i18n-context";
import { apiMessage, propertiesApi } from "@/lib/api";
import type { Property } from "@/types/models";

import { RentoraMap } from "./rentora-map";
import { SearchForm } from "./search-form";
import { RentoraAiHeroSearch } from "./rentora-ai-hero-search";
import {
  cityOf,
  getListingLabel,
  isPublicProperty,
  priceOf,
} from "./property-presentation";

type DiscoveryMode = "ai" | "manual";

export function HomeView() {
  const { t } = useI18n();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [discoveryMode, setDiscoveryMode] = useState<DiscoveryMode>("ai");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    propertiesApi
      .all()
      .then((items) => setProperties(items.filter(isPublicProperty)))
      .catch((reason) => setError(apiMessage(reason)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Home listings are public. They must not wait on the optional session check,
    // otherwise an unavailable /user/me request can leave the product preview empty.
    void Promise.resolve().then(load);
  }, [load]);

  const primaryProperty = properties[0];
  const secondaryProperty = properties[1];
  const featuredProperties = properties.slice(0, 3);

  return (
    <main className="rentora-home">
      <section className="rentora-home-hero">
        <div className="shell rentora-home-hero-shell">
          <div className="rentora-home-hero-copy">
            <p className="rentora-home-kicker">
              <Sparkles size={14} aria-hidden="true" />
              {t("home.heroProductEyebrow")}
            </p>

            <h1>{t("home.heroProductTitle")}</h1>
            <p className="rentora-home-hero-intro">{t("home.heroProductCopy")}</p>

            <div className="rentora-home-discovery" aria-label={t("home.discoveryLabel")}>
              <div className="rentora-home-discovery-tabs" role="tablist" aria-label={t("home.discoveryLabel")}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={discoveryMode === "ai"}
                  className={discoveryMode === "ai" ? "is-active" : ""}
                  onClick={() => setDiscoveryMode("ai")}
                >
                  <Sparkles size={15} />
                  {t("home.askAi")}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={discoveryMode === "manual"}
                  className={discoveryMode === "manual" ? "is-active" : ""}
                  onClick={() => setDiscoveryMode("manual")}
                >
                  <SlidersHorizontal size={15} />
                  {t("home.searchManually")}
                </button>
              </div>

              <div className="rentora-home-discovery-body">
                {discoveryMode === "ai" ? (
                  <RentoraAiHeroSearch />
                ) : (
                  <SearchForm />
                )}
              </div>
            </div>
          </div>

          <HeroProductPreview property={primaryProperty} secondaryProperty={secondaryProperty} />
        </div>
      </section>

      <section className="rentora-home-trust-strip" aria-label={t("home.productToolsTitle")}>
        <div className="shell">
          <span><Map size={17} aria-hidden="true" />{t("home.mapSearch")}</span>
          <span><GitCompare size={17} aria-hidden="true" />{t("home.compareProperties")}</span>
          <span><MessageCircle size={17} aria-hidden="true" />{t("home.talkDirectly")}</span>
          <span><MapPin size={17} aria-hidden="true" />{t("home.builtForArmenia")}</span>
        </div>
      </section>

      <section className="rentora-home-featured">
        <div className="shell">
          <div className="rentora-home-section-heading">
            <div>
              <p className="rentora-home-kicker">{t("home.freshListings")}</p>
              <h2>{t("home.homesWorthSeeing")}</h2>
            </div>
            <div>
              <p>{t("home.freshListingsCopy")}</p>
              <Link href="/properties" className="rentora-home-text-action">
                {t("home.seeAllHomes")}<ArrowRight size={17} />
              </Link>
            </div>
          </div>

          {error ? <ErrorBlock message={error} retry={load} /> : (
            <FeaturedListings properties={featuredProperties} loading={loading} />
          )}
        </div>
      </section>

      <section className="rentora-home-map-section">
        <div className="shell rentora-home-map-layout">
          <div className="rentora-home-map-copy">
            <p className="rentora-home-kicker">{t("home.mapFirstEyebrow")}</p>
            <h2>{t("home.mapFirstTitle")}</h2>
            <p>{t("home.mapFirstCopy")}</p>
            <Link href="/map" className="rentora-home-dark-action">
              {t("home.openMap")}<ArrowRight size={17} />
            </Link>
          </div>

          <div className="rentora-home-live-map">
            <RentoraMap
              properties={properties}
              fitToProperties
              initialFitReady={!loading}
              className="rentora-home-map-canvas"
            />
            {primaryProperty && <MapListingOverlay property={primaryProperty} />}
          </div>
        </div>
      </section>

      <section className="rentora-home-journey">
        <div className="shell">
          <div className="rentora-home-journey-heading">
            <p className="rentora-home-kicker">{t("home.productToolsTitle")}</p>
            <h2>{t("home.journeyTitle")}</h2>
            <p>{t("home.journeyCopy")}</p>
          </div>

          <div className="rentora-home-journey-line" aria-label={t("home.journeyTitle")}>
            <JourneyPoint icon={Search} number="01" title={t("home.journeyFind")} text={t("home.journeyFindCopy")} />
            <JourneyPoint icon={GitCompare} number="02" title={t("home.journeyCompare")} text={t("home.journeyCompareCopy")} />
            <JourneyPoint icon={MessageCircle} number="03" title={t("home.journeyTalk")} text={t("home.journeyTalkCopy")} />
          </div>
        </div>
      </section>

      <section className="rentora-home-final">
        <div className="shell">
          <div className="rentora-home-final-inner">
            <div>
              <p className="rentora-home-kicker">{t("home.readyToList")}</p>
              <h2>{t("home.finalTitle")}</h2>
              <p>{t("home.finalCopy")}</p>
            </div>
            <div className="rentora-home-final-actions">
              <Link href="/properties" className="rentora-home-final-secondary">{t("home.exploreHomes")}</Link>
              <Link href="/properties/create" className="rentora-home-final-primary">
                {t("home.createListing")}<ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function HeroProductPreview({ property, secondaryProperty }: { property?: Property; secondaryProperty?: Property }) {
  const { t } = useI18n();
  const pins = [property, secondaryProperty].filter((item): item is Property => Boolean(item));

  return (
    <div className="rentora-home-product-preview" aria-label={t("home.productPreviewLabel")}>
      <div className="rentora-home-preview-map" aria-hidden="true">
        <span className="rentora-home-preview-map-label">{t("home.builtForArmenia")}</span>
        <span className="rentora-home-preview-road is-one" />
        <span className="rentora-home-preview-road is-two" />
        <span className="rentora-home-preview-road is-three" />
        {pins.map((item, index) => <span className={`rentora-home-preview-pin is-${index + 1}`} key={item.id}>{priceOf(item)}</span>)}
      </div>

      {property ? <ProductPreviewCard property={property} main /> : <div className="rentora-home-preview-skeleton" />}
      {secondaryProperty && <ProductPreviewCard property={secondaryProperty} />}
      <span className="rentora-home-preview-orbit is-one" aria-hidden="true" />
      <span className="rentora-home-preview-orbit is-two" aria-hidden="true" />
    </div>
  );
}

function ProductPreviewCard({ property, main = false }: { property: Property; main?: boolean }) {
  const { t } = useI18n();
  const image = property.images?.[0]?.url;
  return (
    <Link href={`/properties/${property.id}`} className={`rentora-home-preview-card ${main ? "is-main" : "is-secondary"}`}>
      <div className="rentora-home-preview-image">
        {image ? <img src={image} alt="" /> : <div />}
      </div>
      <div className="rentora-home-preview-card-copy">
        <strong>{priceOf(property)}</strong>
        <span>{cityOf(property.city)} · {property.rooms} {t("common.rooms")}</span>
      </div>
    </Link>
  );
}

function FeaturedListings({ properties, loading }: { properties: Property[]; loading: boolean }) {
  const { t } = useI18n();
  if (loading) return <div className="rentora-home-listing-loading" aria-busy="true"><span /><span /><span /></div>;
  if (!properties.length) return <Empty label={t("home.noActiveHomes")} />;

  return (
    <div className="rentora-home-featured-layout">
      {properties.map((property) => <FeatureListing property={property} key={property.id} />)}
    </div>
  );
}

function FeatureListing({ property }: { property: Property }) {
  const { t } = useI18n();
  const image = property.images?.[0]?.url;
  return (
    <Link href={`/properties/${property.id}`} className="rentora-home-featured-listing">
      <div className="rentora-home-featured-image">
        {image ? <img src={image} alt="" /> : <div />}
        <span>{property.listing ? getListingLabel(property.listing) : t("home.freshListings")}</span>
      </div>
      <div className="rentora-home-featured-copy">
        <p className="rentora-home-featured-price">{priceOf(property)}</p>
        <h3>{property.title}</h3>
        <p className="rentora-home-featured-location"><MapPin size={14} />{cityOf(property.city)}</p>
        <p className="rentora-home-featured-specs"><BedDouble size={14} />{property.rooms} {t("common.rooms")} · {property.area} m²</p>
      </div>
      <span className="rentora-home-featured-arrow"><ArrowRight size={18} /></span>
    </Link>
  );
}

function MapListingOverlay({ property }: { property: Property }) {
  const { t } = useI18n();
  const image = property.images?.[0]?.url;
  return (
    <Link href={`/properties/${property.id}`} className="rentora-home-map-overlay">
      <div>{image ? <img src={image} alt="" /> : <span />}</div>
      <p>{priceOf(property)}</p>
      <small>{cityOf(property.city)} · {property.rooms} {t("common.rooms")}</small>
    </Link>
  );
}

function JourneyPoint({ icon: Icon, number, title, text }: { icon: typeof Search; number: string; title: string; text: string }) {
  return <article>
    <div><span>{number}</span><Icon size={21} /></div>
    <h3>{title}</h3>
    <p>{text}</p>
  </article>;
}

export function Empty({ label }: { label: string }) {
  const { t } = useI18n();
  return <div className="rentora-home-empty"><p>{label}</p><span>{t("search.emptyHint")}</span></div>;
}

export function ErrorBlock({ message, retry }: { message: string; retry: () => void }) {
  const { t } = useI18n();
  return <div className="rentora-home-error"><p>{message}</p><button onClick={retry}>{t("common.tryAgain")}</button></div>;
}
