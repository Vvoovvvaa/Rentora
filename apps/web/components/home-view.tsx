"use client";

import Link from "next/link";

import {
  ArrowRight,
  Bot,
  Check,
  Eye,
  GitCompare,
  Heart,
  Languages,
  Map,
  MapPin,
  MessageCircle,
  Plus,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import { useState } from "react";

import { useI18n } from "@/context/i18n-context";

import { RentoraMap } from "./rentora-map";
import { RentoraAiHeroSearch } from "./rentora-ai-hero-search";
import { SearchForm } from "./search-form";

import mapStyles from "./home-map-showcase.module.css";
import decisionStyles from "./home-decision-showcase.module.css";
import extraStyles from "./home-extra-sections.module.css";

type DiscoveryMode = "ai" | "manual";

export function HomeView() {
  const { t } = useI18n();

  const [discoveryMode, setDiscoveryMode] =
    useState<DiscoveryMode>("ai");

  return (
    <main className="rentora-home rentora-home--redesign">
      {/* =====================================================
          01 — HERO
      ===================================================== */}
      <section className="rentora-home-hero">
        <div className="shell rentora-home-hero-shell">
          <div className="rentora-home-hero-copy">
            <p className="rentora-home-kicker">
              <Sparkles size={14} aria-hidden="true" />

              {t("home.heroProductEyebrow")}
            </p>

            <h1>{t("home.heroProductTitle")}</h1>

            <p className="rentora-home-hero-intro">
              {t("home.heroProductCopy")}
            </p>

            <div
              id="rentora-ai"
              className="rentora-home-discovery"
              aria-label={t("home.discoveryLabel")}
            >
              <div
                className="rentora-home-discovery-tabs"
                role="tablist"
                aria-label={t("home.discoveryLabel")}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={discoveryMode === "ai"}
                  className={
                    discoveryMode === "ai"
                      ? "is-active"
                      : ""
                  }
                  onClick={() => setDiscoveryMode("ai")}
                >
                  <Sparkles size={15} />

                  {t("home.askAi")}
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={discoveryMode === "manual"}
                  className={
                    discoveryMode === "manual"
                      ? "is-active"
                      : ""
                  }
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

          <AiProductDemo compact />
        </div>
      </section>

      {/* =====================================================
          PRODUCT STRIP
      ===================================================== */}
      <section
        className="rentora-home-trust-strip"
        aria-label={t("home.productToolsTitle")}
      >
        <div className="shell">
          <span>
            <Sparkles size={16} aria-hidden="true" />
            {t("home.askAi")}
          </span>

          <span>
            <Map size={16} aria-hidden="true" />
            {t("home.mapSearch")}
          </span>

          <span>
            <GitCompare size={16} aria-hidden="true" />
            {t("home.compareProperties")}
          </span>

          <span>
            <MessageCircle size={16} aria-hidden="true" />
            {t("home.talkDirectly")}
          </span>

          <span>
            <MapPin size={16} aria-hidden="true" />
            {t("home.builtForArmenia")}
          </span>
        </div>
      </section>

      {/* =====================================================
          02 — MAP DISCOVERY
      ===================================================== */}
      <section className={mapStyles.section}>
        <div
          className={mapStyles.backgroundGrid}
          aria-hidden="true"
        />

        <div className={`shell ${mapStyles.layout}`}>
          <div className={mapStyles.copy}>
            <p className={mapStyles.eyebrow}>
              <MapPin size={14} aria-hidden="true" />

              {t("home.mapFirstEyebrow")}
            </p>

            <h2 className={mapStyles.title}>
              {t("home.mapFirstTitle")}
            </h2>

            <p className={mapStyles.description}>
              {t("home.mapFirstCopy")}
            </p>

            <Link
              href="/map"
              className={mapStyles.action}
            >
              {t("home.openMap")}

              <ArrowRight size={17} />
            </Link>

            <div className={mapStyles.note}>
              <span className={mapStyles.noteDot} />

              <span>
                {t("home.builtForArmenia")}
              </span>
            </div>
          </div>

          <div className={mapStyles.visual}>
            <div
              className={mapStyles.backPanel}
              aria-hidden="true"
            />

            <div className={mapStyles.mapCard}>
              <div className={mapStyles.mapBadge}>
                <span className={mapStyles.mapBadgeDot} />

                <div>
                  <strong>Armenia</strong>

                  <small>
                    {t("home.mapSearch")}
                  </small>
                </div>
              </div>

              <div className={mapStyles.mapViewport}>
                <RentoraMap
                  preview
                  highlightArmenia
                  initialBounds={{
                    west: 43.55,
                    south: 38.85,
                    east: 46.55,
                    north: 41.25,
                  }}
                  className={mapStyles.map}
                />
              </div>
            </div>

            <div
              className={mapStyles.countryMark}
              aria-hidden="true"
            >
              AM
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          03 — WHY RENTORA
      ===================================================== */}
      <section className={extraStyles.whySection}>
        <div
          className={extraStyles.whyWord}
          aria-hidden="true"
        >
          RENTORA
        </div>

        <div className={`shell ${extraStyles.whyLayout}`}>
          <div className={extraStyles.whyIntro}>
            <p className={extraStyles.lightEyebrow}>
              {t("home.approach")}
            </p>

            <h2 className={extraStyles.whyTitle}>
              {t("home.storyWhyTitle")}
            </h2>

            <p className={extraStyles.whyCopy}>
              {t("home.storyWhyCopy")}
            </p>

            <Link
              href="/properties"
              className={extraStyles.textAction}
            >
              {t("home.exploreHomes")}

              <ArrowRight size={16} />
            </Link>
          </div>

          <div className={extraStyles.whyReasons}>
            <WhyReason
              number="01"
              icon={Sparkles}
              title={t("home.storyWhatTitle")}
              copy={t("home.storyWhatCopy")}
            />

            <WhyReason
              number="02"
              icon={MapPin}
              title={t("home.storyArmeniaTitle")}
              copy={t("home.storyArmeniaCopy")}
            />

            <WhyReason
              number="03"
              icon={Heart}
              title={t("home.storyAboutTitle")}
              copy={t("home.storyAboutCopy")}
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          04 — DECISION WORKSPACE
      ===================================================== */}
      <section className={decisionStyles.section}>
        <div
          className={decisionStyles.glow}
          aria-hidden="true"
        />

        <div
          className={decisionStyles.lines}
          aria-hidden="true"
        />

        <div className={`shell ${decisionStyles.layout}`}>
          <div className={decisionStyles.copy}>
            <p className={decisionStyles.eyebrow}>
              <span />

              {t("home.productToolsTitle")}
            </p>

            <h2 className={decisionStyles.title}>
              {t("home.savedTitle")}

              <span> → </span>

              {t("home.compareProperties")}

              <span> → </span>

              {t("home.messagesTitle")}
            </h2>

            <p className={decisionStyles.description}>
              {t("home.toolsCopy")}
            </p>

            <div className={decisionStyles.steps}>
              <DecisionStep
                number="01"
                href="/favorites"
                icon={Heart}
                title={t("home.savedTitle")}
                copy={t("home.savedCopy")}
              />

              <DecisionStep
                number="02"
                href="/compare"
                icon={GitCompare}
                title={t("home.compareProperties")}
                copy={t("home.comparePropertiesCopy")}
              />

              <DecisionStep
                number="03"
                href="/messages"
                icon={MessageCircle}
                title={t("home.messagesTitle")}
                copy={t("home.messagesCopy")}
              />
            </div>
          </div>

          <div className={decisionStyles.visual}>
            <div
              className={decisionStyles.visualHalo}
              aria-hidden="true"
            />

            <div className={decisionStyles.workspace}>
              <div className={decisionStyles.workspaceHeader}>
                <div className={decisionStyles.workspaceBrand}>
                  <span className={decisionStyles.workspaceMark}>
                    R
                  </span>

                  <div>
                    <strong>Rentora</strong>

                    <small>
                      {t("home.productToolsTitle")}
                    </small>
                  </div>
                </div>

                <div className={decisionStyles.workspaceStatus}>
                  <i />

                  <span>3</span>
                </div>
              </div>

              <div
                className={`${decisionStyles.panel} ${decisionStyles.savedPanel}`}
              >
                <div className={decisionStyles.panelHeader}>
                  <span className={decisionStyles.panelIcon}>
                    <Heart size={17} />
                  </span>

                  <div>
                    <strong>
                      {t("home.savedTitle")}
                    </strong>

                    <small>
                      {t("home.savedCopy")}
                    </small>
                  </div>

                  <span className={decisionStyles.count}>
                    3
                  </span>
                </div>

                <div className={decisionStyles.savedRows}>
                  <SavedRow
                    location={t("home.cityGyumri")}
                    price="$72k"
                    meta="68 m²"
                  />

                  <SavedRow
                    location={t("home.cityYerevan")}
                    price="$79k"
                    meta="74 m²"
                  />

                  <SavedRow
                    location={t("home.cityDilijan")}
                    price="$68k"
                    meta="71 m²"
                  />
                </div>
              </div>

              <div
                className={decisionStyles.flowConnector}
                aria-hidden="true"
              >
                <span />
              </div>

              <div
                className={`${decisionStyles.panel} ${decisionStyles.comparePanel}`}
              >
                <div className={decisionStyles.panelHeader}>
                  <span className={decisionStyles.panelIcon}>
                    <GitCompare size={17} />
                  </span>

                  <div>
                    <strong>
                      {t("home.compareProperties")}
                    </strong>

                    <small>
                      {t("home.comparePropertiesCopy")}
                    </small>
                  </div>
                </div>

                <div className={decisionStyles.compareGrid}>
                  <div className={decisionStyles.compareColumn}>
                    <span
                      className={decisionStyles.compareLetter}
                    >
                      A
                    </span>

                    <strong>$72k</strong>
                    <span>68 m²</span>
                    <span>2</span>
                  </div>

                  <div className={decisionStyles.compareDivider}>
                    <span>VS</span>
                  </div>

                  <div className={decisionStyles.compareColumn}>
                    <span
                      className={decisionStyles.compareLetter}
                    >
                      B
                    </span>

                    <strong>$79k</strong>
                    <span>74 m²</span>
                    <span>3</span>
                  </div>
                </div>

                <Link
                  href="/compare"
                  className={decisionStyles.panelAction}
                >
                  {t("home.compareProperties")}

                  <ArrowRight size={15} />
                </Link>
              </div>

              <Link
                href="/messages"
                className={decisionStyles.messageCard}
              >
                <span className={decisionStyles.messageIcon}>
                  <MessageCircle size={17} />
                </span>

                <div className={decisionStyles.messageContent}>
                  <strong>
                    {t("home.messagesTitle")}
                  </strong>

                  <div className={decisionStyles.chatLines}>
                    <span />
                    <span />
                  </div>
                </div>

                <ArrowRight size={16} />
              </Link>
            </div>

            <div
              className={decisionStyles.watermark}
              aria-hidden="true"
            >
              03
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          05 — FOR OWNERS
      ===================================================== */}
      <section className={extraStyles.ownerSection}>
        <div className={`shell ${extraStyles.ownerLayout}`}>
          <div className={extraStyles.ownerVisual}>
            <div
              className={extraStyles.ownerGlow}
              aria-hidden="true"
            />

            <div className={extraStyles.ownerDashboard}>
              <div className={extraStyles.ownerHeader}>
                <div>
                  <span className={extraStyles.ownerBrand}>
                    R
                  </span>

                  <div>
                    <strong>Rentora</strong>

                    <small>
                      {t("home.readyToList")}
                    </small>
                  </div>
                </div>

                <Link
                  href="/properties/create"
                  className={extraStyles.ownerAddMini}
                >
                  <Plus size={14} />

                  {t("home.createListing")}
                </Link>
              </div>

              <div className={extraStyles.ownerStats}>
                <div>
                  <Eye size={16} />
                  <strong>1,924</strong>
                </div>

                <div>
                  <MessageCircle size={16} />
                  <strong>12</strong>
                </div>

                <div>
                  <Heart size={16} />
                  <strong>38</strong>
                </div>
              </div>

              <div className={extraStyles.ownerList}>
                <OwnerListing
                  city={t("home.cityYerevan")}
                  status={t("myListings.published")}
                  views="1,284"
                  active
                />

                <OwnerListing
                  city={t("home.cityGyumri")}
                  status={t("myListings.published")}
                  views="640"
                  active
                />

                <OwnerListing
                  city={t("home.cityDilijan")}
                  status={t("myListings.pending")}
                  views="—"
                />
              </div>

              <div className={extraStyles.ownerChart}>
                <div className={extraStyles.ownerChartTop}>
                  <span>
                    <Eye size={14} />
                    7 days
                  </span>

                  <strong>+24%</strong>
                </div>

                <div className={extraStyles.bars}>
                  <i style={{ height: "32%" }} />
                  <i style={{ height: "47%" }} />
                  <i style={{ height: "41%" }} />
                  <i style={{ height: "66%" }} />
                  <i style={{ height: "58%" }} />
                  <i style={{ height: "78%" }} />
                  <i style={{ height: "92%" }} />
                </div>
              </div>
            </div>
          </div>

          <div className={extraStyles.ownerCopy}>
            <p className={extraStyles.darkEyebrow}>
              {t("home.readyToList")}
            </p>

            <h2 className={extraStyles.ownerTitle}>
              {t("home.listingCtaTitle")}
            </h2>

            <p className={extraStyles.ownerDescription}>
              {t("home.listingCtaCopy")}
            </p>

            <div className={extraStyles.ownerBenefits}>
              <span>
                <Check size={15} />
                {t("home.talkDirectly")}
              </span>

              <span>
                <Check size={15} />
                {t("home.builtForArmenia")}
              </span>

              <span>
                <Check size={15} />
                {t("home.mapSearch")}
              </span>
            </div>

            <Link
              href="/properties/create"
              className={extraStyles.ownerAction}
            >
              <Plus size={17} />

              {t("home.createListing")}

              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          06 — BUILT FOR ARMENIA
      ===================================================== */}
      <section className={extraStyles.armeniaSection}>
        <div
          className={extraStyles.armeniaRingOne}
          aria-hidden="true"
        />

        <div
          className={extraStyles.armeniaRingTwo}
          aria-hidden="true"
        />

        <div className={`shell ${extraStyles.armeniaLayout}`}>
          <div className={extraStyles.armeniaCopy}>
            <p className={extraStyles.armeniaEyebrow}>
              <MapPin size={14} />

              {t("home.builtForArmenia")}
            </p>

            <h2 className={extraStyles.armeniaTitle}>
              {t("home.storyArmeniaTitle")}
            </h2>

            <p className={extraStyles.armeniaDescription}>
              {t("home.storyArmeniaCopy")}
            </p>

            <Link
              href="/map"
              className={extraStyles.armeniaAction}
            >
              {t("home.openMap")}

              <ArrowRight size={16} />
            </Link>
          </div>

          <div className={extraStyles.armeniaVisual}>
            <span
              className={extraStyles.armeniaBigWord}
              aria-hidden="true"
            >
              ARMENIA
            </span>

            <div className={extraStyles.armeniaCenter}>
              <div className={extraStyles.armeniaLogo}>
                AM
              </div>

              <span>
                <Languages size={16} />

                Armenia
              </span>
            </div>

            <div
              className={`${extraStyles.armeniaChip} ${extraStyles.chipOne}`}
            >
              Հայերեն
            </div>

            <div
              className={`${extraStyles.armeniaChip} ${extraStyles.chipTwo}`}
            >
              Русский
            </div>

            <div
              className={`${extraStyles.armeniaChip} ${extraStyles.chipThree}`}
            >
              English
            </div>

            <div
              className={`${extraStyles.armeniaChip} ${extraStyles.chipFour}`}
            >
              AMD
            </div>

            <div
              className={`${extraStyles.armeniaChip} ${extraStyles.chipFive}`}
            >
              USD · EUR
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          07 — FINAL CTA
      ===================================================== */}
      <section className="rentora-home-final">
        <div className="shell">
          <div className="rentora-home-final-inner">
            <div>
              <p className="rentora-home-kicker">
                {t("home.readyToList")}
              </p>

              <h2>
                {t("home.finalTitle")}
              </h2>

              <p>
                {t("home.finalCopy")}
              </p>
            </div>

            <div className="rentora-home-final-actions">
              <Link
                href="/properties"
                className="rentora-home-final-primary"
              >
                {t("home.exploreHomes")}

                <ArrowRight size={17} />
              </Link>

              <a
                href="#rentora-ai"
                className="rentora-home-final-secondary"
              >
                {t("home.askAi")}
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   HERO AI
   ========================================================= */

function AiProductDemo({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { t } = useI18n();

  const criteria = [
    t("home.aiDemoCity"),
    t("home.aiDemoBedrooms"),
    t("home.aiDemoBudget"),
    t("home.aiDemoCentre"),
    t("home.aiDemoComfort"),
  ];

  return (
    <div
      className={`rentora-ai-product-demo ${
        compact
          ? "is-hero-demo"
          : ""
      }`}
      aria-label={t("home.aiExperienceEyebrow")}
    >
      <div
        className="rentora-ai-product-demo-glow"
        aria-hidden="true"
      />

      <div className="rentora-ai-demo-topline">
        <span>
          <Sparkles size={15} aria-hidden="true" />
          Rentora AI
        </span>

        <i aria-hidden="true" />
      </div>

      <p className="rentora-ai-demo-label">
        {t("home.aiDemoPrompt")}
      </p>

      <p className="rentora-ai-demo-query">
        “{t("home.aiDemoQuery")}
        <span
          className="rentora-ai-demo-cursor"
          aria-hidden="true"
        />
        ”
      </p>

      <div className="rentora-ai-demo-reading">
        <span
          className="rentora-ai-demo-scan"
          aria-hidden="true"
        />

        <Bot size={16} aria-hidden="true" />

        {t("home.aiDemoReading")}
      </div>

      <div className="rentora-ai-demo-criteria">
        {criteria.map((criterion, index) => (
          <span
            key={`${criterion}-${index}`}
            style={{
              animationDelay:
                `${300 + index * 120}ms`,
            }}
          >
            <Check size={14} aria-hidden="true" />

            {criterion}
          </span>
        ))}
      </div>

      <Link
        href="/properties"
        className="rentora-ai-demo-action"
      >
        {t("home.exploreHomes")}

        <ArrowRight size={16} />
      </Link>
    </div>
  );
}

/* =========================================================
   WHY RENTORA
   ========================================================= */

function WhyReason({
  number,
  icon: Icon,
  title,
  copy,
}: {
  number: string;
  icon: typeof Sparkles;
  title: string;
  copy: string;
}) {
  return (
    <article className={extraStyles.whyReason}>
      <span className={extraStyles.whyNumber}>
        {number}
      </span>

      <span className={extraStyles.whyIcon}>
        <Icon size={18} />
      </span>

      <div>
        <h3>{title}</h3>
        <p>{copy}</p>
      </div>

      <ArrowRight
        size={17}
        className={extraStyles.whyArrow}
      />
    </article>
  );
}

/* =========================================================
   DECISION
   ========================================================= */

function DecisionStep({
  number,
  href,
  icon: Icon,
  title,
  copy,
}: {
  number: string;
  href: string;
  icon: typeof Heart;
  title: string;
  copy: string;
}) {
  return (
    <Link
      href={href}
      className={decisionStyles.step}
    >
      <span className={decisionStyles.stepNumber}>
        {number}
      </span>

      <span className={decisionStyles.stepIcon}>
        <Icon size={17} />
      </span>

      <span className={decisionStyles.stepContent}>
        <strong>{title}</strong>
        <small>{copy}</small>
      </span>

      <ArrowRight
        className={decisionStyles.stepArrow}
        size={16}
      />
    </Link>
  );
}

function SavedRow({
  location,
  price,
  meta,
}: {
  location: string;
  price: string;
  meta: string;
}) {
  return (
    <div className={decisionStyles.savedRow}>
      <span className={decisionStyles.propertyMark}>
        <MapPin size={14} />
      </span>

      <div>
        <strong>{location}</strong>
        <small>{meta}</small>
      </div>

      <span className={decisionStyles.price}>
        {price}
      </span>
    </div>
  );
}

/* =========================================================
   OWNER
   ========================================================= */

function OwnerListing({
  city,
  status,
  views,
  active = false,
}: {
  city: string;
  status: string;
  views: string;
  active?: boolean;
}) {
  return (
    <div className={extraStyles.ownerListing}>
      <span className={extraStyles.ownerPropertyIcon}>
        <MapPin size={14} />
      </span>

      <div className={extraStyles.ownerListingCopy}>
        <strong>{city}</strong>
        <small>{status}</small>
      </div>

      <span
        className={`${extraStyles.ownerStatus} ${
          active
            ? extraStyles.ownerStatusActive
            : ""
        }`}
      >
        <i />
        {active ? "●" : "○"}
      </span>

      <span className={extraStyles.ownerViews}>
        <Eye size={13} />
        {views}
      </span>
    </div>
  );
}

/* =========================================================
   EXISTING HELPERS
   ========================================================= */

export function Empty({
  label,
}: {
  label: string;
}) {
  const { t } = useI18n();

  return (
    <div className="rentora-home-empty">
      <p>{label}</p>

      <span>
        {t("search.emptyHint")}
      </span>
    </div>
  );
}

export function ErrorBlock({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="rentora-home-error">
      <p>{message}</p>

      <button
        type="button"
        onClick={retry}
      >
        {t("common.tryAgain")}
      </button>
    </div>
  );
}