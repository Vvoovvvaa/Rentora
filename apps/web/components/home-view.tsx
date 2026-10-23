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
          CITY DISCOVERY — editorial city guide
      ===================================================== */}
      <section className="relative isolate overflow-hidden border-y border-[#e4d5c4] bg-[#f8f3eb] py-10 sm:py-14">
        {/* Subtle architectural background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-36 -top-40 h-[30rem] w-[30rem] rounded-full border border-[#c5a889]/25"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-[22rem] w-[22rem] rounded-full border border-[#c5a889]/20"
        />

        <div className="shell relative">
          <div className="mb-7 flex flex-col justify-between gap-5 md:mb-9 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="mb-3 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#926b48] sm:text-[11px]">
                <span className="grid h-7 w-7 place-items-center rounded-full border border-[#d9c4ac] bg-[#fffaf3]">
                  <MapPin size={13} aria-hidden="true" />
                </span>

                {t("home.cityDiscoveryEyebrow")}
              </p>

              <h2 className="max-w-xl text-[30px] font-bold leading-[1.04] tracking-[-0.06em] text-[#38271d] sm:text-[40px]">
                {t("home.cityDiscoveryTitle")}
              </h2>

              <p className="mt-3 max-w-xl text-[13px] leading-6 text-[#7f6d5b] sm:text-[14px]">
                {t("home.cityDiscoveryCopy")}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 pb-0.5">
              <Link
                href="/properties"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#4c3627] px-5 text-[12px] font-bold text-[#fff9f1] shadow-[0_5px_14px_rgba(64,43,28,0.12)] transition hover:-translate-y-0.5 hover:bg-[#37261c]"
              >
                {t("home.cityDiscoveryAllListings")}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>

              <Link
                href="/map"
                aria-label={t("home.cityDiscoveryViewMap")}
                className="grid h-11 w-11 place-items-center rounded-full border border-[#ddc9b4] bg-[#fffaf3] text-[#60452f] transition hover:border-[#b6916b] hover:bg-white"
              >
                <Map size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[
              {
                code: "YEREVAN",
                name: t("home.cityDiscoveryYerevan"),
                description: t("home.cityDiscoveryYerevanCaption"),
                number: "01",
                surface: "#f2e4d2",
                accent: "#956c48",
                ink: "#432f21",
                artwork: "city",
              },
              {
                code: "GYUMRI",
                name: t("home.cityDiscoveryGyumri"),
                description: t("home.cityDiscoveryGyumriCaption"),
                number: "02",
                surface: "#edddca",
                accent: "#815a3e",
                ink: "#432f22",
                artwork: "heritage",
              },
              {
                code: "VANADZOR",
                name: t("home.cityDiscoveryVanadzor"),
                description: t("home.cityDiscoveryVanadzorCaption"),
                number: "03",
                surface: "#f0e6d8",
                accent: "#937353",
                ink: "#443225",
                artwork: "hills",
              },
              {
                code: "DILIJAN",
                name: t("home.cityDiscoveryDilijan"),
                description: t("home.cityDiscoveryDilijanCaption"),
                number: "04",
                surface: "#e9dac6",
                accent: "#74583c",
                ink: "#3d2b20",
                artwork: "forest",
              },
              {
                code: "SEVAN",
                name: t("home.cityDiscoverySevan"),
                description: t("home.cityDiscoverySevanCaption"),
                number: "05",
                surface: "#f4eadc",
                accent: "#987653",
                ink: "#443225",
                artwork: "lake",
              },
              {
                code: "TSAGHKADZOR",
                name: t("home.cityDiscoveryTsaghkadzor"),
                description: t("home.cityDiscoveryTsaghkadzorCaption"),
                number: "06",
                surface: "#e5d2bc",
                accent: "#805a3b",
                ink: "#3c291d",
                artwork: "mountain",
              },
            ].map((city) => (
              <article
                key={city.code}
                className="group relative isolate flex min-h-[228px] min-w-0 flex-col overflow-hidden rounded-[20px] border p-4 shadow-[0_4px_16px_rgba(70,48,30,0.045)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(70,48,30,0.11)] sm:min-h-[238px] sm:p-5"
                style={{
                  background: `linear-gradient(135deg, ${city.surface} 0%, #f8f0e5 100%)`,
                  borderColor: `${city.accent}38`,
                }}
              >
                {/* Monochrome city artwork */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                  <div
                    className="absolute -right-9 -top-12 h-40 w-40 rounded-full border opacity-50"
                    style={{ borderColor: `${city.accent}55` }}
                  />

                  <div
                    className="absolute -right-1 -top-5 h-24 w-24 rounded-full border opacity-45"
                    style={{ borderColor: `${city.accent}55` }}
                  />

                  <svg
                    viewBox="0 0 220 150"
                    className="absolute right-0 top-2 h-[142px] w-[57%] opacity-[0.72] transition duration-500 group-hover:-translate-y-1 group-hover:scale-[1.035]"
                    fill="none"
                  >
                    {city.artwork === "lake" ? (
                      <>
                        <path
                          d="M0 99 Q34 82 68 97 T135 94 T220 83 V150 H0Z"
                          fill={city.accent}
                          fillOpacity=".12"
                        />
                        <path
                          d="M0 106 Q38 94 76 106 T150 102 T220 95 M0 121 Q38 109 76 121 T150 117 T220 110"
                          stroke={city.accent}
                          strokeOpacity=".58"
                          strokeWidth="1.4"
                        />
                        <path
                          d="M16 88 L65 42 L103 82 M68 86 L124 25 L182 84"
                          stroke={city.accent}
                          strokeOpacity=".72"
                          strokeWidth="1.7"
                        />
                      </>
                    ) : city.artwork === "forest" ? (
                      <>
                        <path
                          d="M0 111 Q54 86 101 110 T220 94 V150 H0Z"
                          fill={city.accent}
                          fillOpacity=".13"
                        />

                        {[22, 54, 85, 123, 157, 191].map((x, i) => (
                          <g
                            key={x}
                            opacity={i % 2 === 0 ? 0.76 : 0.48}
                          >
                            <path
                              d={`M${x} ${116 - (i % 3) * 11} l-13 23 h26 z`}
                              fill={city.accent}
                              fillOpacity=".18"
                              stroke={city.accent}
                              strokeOpacity=".68"
                            />
                            <path
                              d={`M${x} ${126 - (i % 3) * 11} v19`}
                              stroke={city.ink}
                              strokeOpacity=".45"
                              strokeWidth="1.5"
                            />
                          </g>
                        ))}
                      </>
                    ) : city.artwork === "mountain" ||
                      city.artwork === "hills" ? (
                      <>
                        <path
                          d="M0 125 L36 79 L61 96 L106 37 L150 91 L174 68 L220 119 V150 H0Z"
                          fill={city.accent}
                          fillOpacity=".14"
                        />
                        <path
                          d="M36 79 L48 91 L61 96 M106 37 L121 58 L133 70 M174 68 L191 88"
                          stroke={city.accent}
                          strokeOpacity=".78"
                          strokeWidth="1.7"
                        />
                        <path
                          d="M0 132 Q57 116 109 132 T220 126"
                          stroke={city.accent}
                          strokeOpacity=".46"
                        />
                      </>
                    ) : (
                      <>
                        <path
                          d="M9 103 V65 L33 45 L57 65 V103Z"
                          fill={city.accent}
                          fillOpacity=".1"
                          stroke={city.accent}
                          strokeOpacity=".65"
                          strokeWidth="1.3"
                        />
                        <path
                          d="M73 105 V28 H121 V105 M73 48 H121 M73 67 H121 M97 28 V105"
                          stroke={city.accent}
                          strokeWidth="1.4"
                          strokeOpacity=".67"
                        />
                        <path
                          d="M133 105 V57 L158 38 L183 57 V105 M133 75 H183 M151 57 V105 M167 57 V105"
                          fill={city.accent}
                          fillOpacity=".1"
                          stroke={city.accent}
                          strokeWidth="1.4"
                          strokeOpacity=".7"
                        />

                        {city.artwork === "heritage" && (
                          <path
                            d="M191 104 V73 L204 61 L217 73 V104 M191 82 H217"
                            stroke={city.accent}
                            strokeWidth="1.4"
                            strokeOpacity=".7"
                          />
                        )}
                      </>
                    )}
                  </svg>

                  <div
                    className="absolute inset-x-0 bottom-0 h-28"
                    style={{
                      background: `linear-gradient(to bottom, transparent, ${city.surface} 92%)`,
                    }}
                  />
                </div>

                <div className="relative z-10 flex items-center justify-between">
                  <span
                    className="text-[10px] font-extrabold tracking-[0.16em]"
                    style={{ color: city.accent }}
                  >
                    {city.number}
                    <span className="opacity-55"> / 06</span>
                  </span>

                  <span className="grid h-8 w-8 place-items-center rounded-full border border-[#fffaf3]/90 bg-[#fffaf3]/75 text-[#65482f] shadow-sm backdrop-blur-sm">
                    <MapPin size={14} aria-hidden="true" />
                  </span>
                </div>

                <div className="relative z-10 mt-auto pt-12">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: city.accent }}
                  >
                    {t("home.cityDiscoveryCollectionLabel")}
                  </p>

                  <h3
                    className="mt-1 text-[24px] font-bold leading-tight tracking-[-0.05em]"
                    style={{ color: city.ink }}
                  >
                    {city.name}
                  </h3>

                  <p className="mt-1.5 max-w-[88%] text-[11px] leading-4 text-[#786552]">
                    {city.description}
                  </p>
                </div>

                <div
                  className="relative z-10 mt-4 grid grid-cols-2 gap-2 border-t pt-3"
                  style={{ borderColor: `${city.accent}45` }}
                >
                  <Link
                    href={`/properties?city=${city.code}`}
                    aria-label={`${t("common.listings")} — ${city.name}`}
                    className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg bg-[#4c3627] px-2.5 text-[10px] font-bold text-[#fff9f1] transition hover:bg-[#35251b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#956c48]"
                  >
                    <ArrowRight size={12} aria-hidden="true" />
                    <span>{t("common.listings")}</span>
                  </Link>

                  <Link
                    href={`/map?city=${city.code}`}
                    aria-label={`${t("navigation.map")} — ${city.name}`}
                    className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-[#cdb79e] bg-[#fffaf3]/75 px-2.5 text-[10px] font-bold text-[#543d29] transition hover:bg-[#fffdf9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#956c48]"
                  >
                    <Map size={12} aria-hidden="true" />
                    <span>{t("navigation.map")}</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
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
          06 — RENTORA / SPACE, REIMAGINED
      ===================================================== */}
      <section className="relative isolate overflow-hidden bg-[#2c2019] py-16 text-[#fff4e7] sm:py-20 lg:py-24">
        {/* Atmospheric background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-[#bd8d5e]/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 right-0 h-[30rem] w-[30rem] rounded-full bg-[#e3c29b]/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(238,218,192,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(238,218,192,.3) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        <div className="shell relative grid items-center gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-8">
          {/* Editorial text */}
          <div className="relative z-10 max-w-xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d0a87e]/30 bg-white/[0.04] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#dfbd94]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#dfbd94]" />
              {t("home.architectureEyebrow")}
            </p>

            <h2 className="max-w-[530px] text-[40px] font-bold leading-[0.98] tracking-[-0.065em] sm:text-[52px] lg:text-[62px]">
              {t("home.architectureTitle")}
            </h2>

            <p className="mt-5 max-w-md text-[14px] leading-7 text-[#cdb8a2] sm:text-[15px]">
              {t("home.architectureCopy")}
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {[
                t("home.architectureTagLayout"),
                t("home.architectureTagLight"),
                t("home.architectureTagFlow"),
              ].map((label, index) => (
                <span
                  key={label}
                  className="rounded-full border border-[#e4c7a5]/20 px-3.5 py-2 text-[10px] font-semibold tracking-[0.06em] text-[#e7cfb3]"
                >
                  <span className="mr-2 text-[#b88d64]">
                    0{index + 1}
                  </span>
                  {label}
                </span>
              ))}
            </div>

            <Link
              href="/properties"
              className="group mt-8 inline-flex min-h-12 items-center gap-3 rounded-full bg-[#e8c79d] px-5 py-3 text-[13px] font-bold text-[#38271b] shadow-[0_8px_25px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#f3d9b7]"
            >
              {t("home.architectureCta")}

              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#513a28] text-[#fff5e8] transition-transform group-hover:translate-x-0.5">
                <ArrowRight size={14} aria-hidden="true" />
              </span>
            </Link>
          </div>

          {/* Signature illustration */}
          <div className="relative mx-auto w-full max-w-[760px] min-w-0">
            <div
              aria-hidden="true"
              className="absolute inset-[10%] rounded-full bg-[#cda477]/10 blur-3xl"
            />

            <div className="relative rounded-[28px] border border-[#e7c9a5]/20 bg-[#d8c1a5] p-3 shadow-[0_35px_100px_rgba(0,0,0,0.3)] sm:rounded-[36px] sm:p-5">
              <div
                className="relative overflow-hidden rounded-[22px] bg-[#e9dac6] p-2 sm:p-3"
                style={{
                  backgroundImage:
                    "radial-gradient(#8c6d4d 0.7px, transparent 0.7px)",
                  backgroundSize: "13px 13px",
                }}
              >
                <svg
                  viewBox="0 0 680 500"
                  role="img"
                  aria-labelledby="rentora-space-title rentora-space-desc"
                  className="block h-auto w-full"
                >
                  <title id="rentora-space-title">
                    {t("home.architectureSvgTitle")}
                  </title>
                  <desc id="rentora-space-desc">
                    {t("home.architectureSvgDescription")}
                  </desc>

                  <defs>
                    <linearGradient
                      id="rentora-wall-light"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#fff4e3" />
                      <stop offset="100%" stopColor="#d9c1a3" />
                    </linearGradient>

                    <linearGradient
                      id="rentora-wall-side"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#e2c8a7" />
                      <stop offset="100%" stopColor="#b69470" />
                    </linearGradient>

                    <filter
                      id="rentora-space-shadow"
                      x="-30%"
                      y="-30%"
                      width="160%"
                      height="180%"
                    >
                      <feDropShadow
                        dx="0"
                        dy="18"
                        stdDeviation="12"
                        floodColor="#5b4029"
                        floodOpacity=".2"
                      />
                    </filter>
                  </defs>

                  {/* Editorial heading */}
                  <text
                    x="34"
                    y="35"
                    fill="#987654"
                    fontSize="10"
                    fontWeight="700"
                    letterSpacing="2.6"
                  >
                    RENTORA / SPACE STUDY
                  </text>

                  <path
                    d="M34 49H646"
                    stroke="#ad8e6d"
                    strokeOpacity=".35"
                  />

                  {/* Ground shadow */}
                  <ellipse
                    cx="359"
                    cy="345"
                    rx="247"
                    ry="89"
                    fill="#8e6b49"
                    opacity=".17"
                  />

                  {/* Apartment model */}
                  <g filter="url(#rentora-space-shadow)">
                    {/* Ground floor */}
                    <path
                      d="M110 274 L352 135 L594 274 L352 416 Z"
                      fill="#b99875"
                    />

                    <path
                      d="M110 274 L352 135 L594 274 L352 404 Z"
                      fill="#f0e0c9"
                    />

                    {/* Left exterior wall */}
                    <path
                      d="M110 274 L110 174 L352 35 L352 135 Z"
                      fill="url(#rentora-wall-light)"
                      stroke="#77583e"
                      strokeWidth="2"
                    />

                    {/* Right exterior wall */}
                    <path
                      d="M352 135 L352 35 L594 174 L594 274 Z"
                      fill="url(#rentora-wall-side)"
                      stroke="#77583e"
                      strokeWidth="2"
                    />

                    {/* Left wall window */}
                    <path
                      d="M147 230 L147 187 L204 154 L204 197 Z"
                      fill="#b8d0cb"
                      stroke="#8e7255"
                      strokeWidth="3"
                    />
                    <path
                      d="M175 171 L175 214 M147 208 L204 175"
                      stroke="#fff2dc"
                      strokeWidth="2"
                    />

                    {/* Right wall window */}
                    <path
                      d="M443 187 L443 143 L510 181 L510 225 Z"
                      fill="#b8d0cb"
                      stroke="#8b6b4a"
                      strokeWidth="3"
                    />
                    <path
                      d="M477 162 L477 206 M443 165 L510 203"
                      stroke="#fff2dc"
                      strokeWidth="2"
                    />

                    {/* Interior floor zones */}
                    <path
                      d="M110 274 L232 204 L352 274 L231 345 Z"
                      fill="#e8d4b8"
                    />
                    <path
                      d="M232 204 L352 135 L474 204 L352 274 Z"
                      fill="#f4e7d5"
                    />
                    <path
                      d="M352 274 L474 204 L594 274 L472 344 Z"
                      fill="#ddc4a3"
                    />
                    <path
                      d="M231 345 L352 274 L472 344 L352 404 Z"
                      fill="#eddec9"
                    />

                    {/* Interior partition walls */}
                    <path
                      d="M232 204 L232 265 L352 335 L352 274"
                      fill="#c5a580"
                      stroke="#77583e"
                      strokeWidth="2"
                    />
                    <path
                      d="M352 274 L352 335 L472 405 L472 344"
                      fill="#b99570"
                      stroke="#77583e"
                      strokeWidth="2"
                    />

                    {/* Bed */}
                    <path
                      d="M381 196 L434 166 L510 210 L456 241 Z"
                      fill="#b29a7c"
                    />
                    <path
                      d="M386 191 L434 164 L504 204 L456 233 Z"
                      fill="#fbf3e8"
                    />
                    <path
                      d="M397 190 L423 175 L444 188 L418 203 Z"
                      fill="#d7c2a7"
                    />
                    <path
                      d="M428 208 L454 193 L476 206 L450 221 Z"
                      fill="#d7c2a7"
                    />
                    <path
                      d="M386 191 L456 233 L456 241 L386 200 Z"
                      fill="#c4a888"
                    />

                    {/* Living-room sofa */}
                    <path
                      d="M150 283 L201 254 L280 299 L229 329 Z"
                      fill="#75543b"
                    />
                    <path
                      d="M151 274 L201 246 L280 291 L230 320 Z"
                      fill="#a58665"
                    />
                    <path
                      d="M161 270 L201 248 L229 264 L189 287 Z"
                      fill="#d8c1a5"
                    />
                    <path
                      d="M202 293 L242 270 L270 286 L230 309 Z"
                      fill="#d8c1a5"
                    />

                    {/* Coffee table */}
                    <path
                      d="M261 309 L293 291 L329 312 L297 331 Z"
                      fill="#997553"
                    />
                    <path
                      d="M261 303 L293 285 L329 306 L297 325 Z"
                      fill="#f7ebda"
                      stroke="#9f7e5d"
                      strokeWidth="1.5"
                    />

                    {/* Kitchen cabinetry */}
                    <path
                      d="M171 214 L216 188 L270 219 L225 246 Z"
                      fill="#a47f59"
                    />
                    <path
                      d="M171 205 L216 179 L270 210 L225 237 Z"
                      fill="#fbf0df"
                      stroke="#8d6b49"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M189 196 L234 222 M207 186 L252 212"
                      stroke="#c5a887"
                      strokeWidth="1.5"
                    />

                    {/* Island */}
                    <path
                      d="M279 227 L316 206 L355 228 L318 249 Z"
                      fill="#8f6d4c"
                    />
                    <path
                      d="M279 219 L316 198 L355 220 L318 241 Z"
                      fill="#fff4e4"
                      stroke="#9b7957"
                      strokeWidth="1.5"
                    />

                    {/* Decorative plants */}
                    <path
                      d="M501 266 L512 248 L516 267 L527 252 L525 274 Z"
                      fill="#78907a"
                    />
                    <path
                      d="M499 269 L528 269 L523 286 L504 286 Z"
                      fill="#b18b64"
                    />

                    {/* Fine architectural guide lines */}
                    <path
                      d="M110 274 L352 416 L594 274 M232 204 L352 274 L474 204"
                      fill="none"
                      stroke="#7f6043"
                      strokeOpacity=".5"
                      strokeWidth="1.2"
                    />
                  </g>

                  <text
                    x="34"
                    y="464"
                    fill="#987654"
                    fontSize="9"
                    fontWeight="700"
                    letterSpacing="2"
                  >
                    {t("home.architectureDrawingCaption")}
                  </text>

                  <text
                    x="646"
                    y="464"
                    textAnchor="end"
                    fill="#987654"
                    fontSize="9"
                    letterSpacing="1"
                  >
                    01 — 03
                  </text>
                </svg>
              </div>

              {/* Floating editorial labels */}
              <div className="absolute right-5 top-5 rounded-2xl border border-white/70 bg-[#fff8ef]/95 px-3.5 py-3 shadow-[0_12px_28px_rgba(70,47,28,0.15)] backdrop-blur-sm sm:right-8 sm:top-8 sm:px-4">
                <p className="text-[8px] font-extrabold uppercase tracking-[0.17em] text-[#a18567]">
                  {t("home.architectureFloatTopLabel")}
                </p>
                <p className="mt-1 text-[12px] font-bold text-[#493424]">
                  {t("home.architectureFloatTopValue")}
                </p>
              </div>

              <div className="absolute bottom-6 left-5 flex items-center gap-3 rounded-2xl border border-white/70 bg-[#fff8ef]/95 px-3.5 py-3 shadow-[0_12px_28px_rgba(70,47,28,0.15)] backdrop-blur-sm sm:bottom-8 sm:left-8 sm:px-4">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#4d3526] text-[#efd2ae]">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 19V5h16v14M4 10h16M9 5v14M15 10v9"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-[8px] font-extrabold uppercase tracking-[0.16em] text-[#a18567]">
                    {t("home.architectureFloatBottomLabel")}
                  </p>
                  <p className="mt-1 text-[11px] font-bold text-[#493424]">
                    {t("home.architectureFloatBottomValue")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>
      )
    }


/* =========================================================
      HERO AI
      ========================================================= */

      function AiProductDemo({
        compact = false,
}: {
        compact ?: boolean;
}) {
  const {t} = useI18n();

      const criteria = [
      t("home.aiDemoCity"),
      t("home.aiDemoBedrooms"),
      t("home.aiDemoBudget"),
      t("home.aiDemoCentre"),
      t("home.aiDemoComfort"),
      ];

      return (
      <div
        className={`rentora-ai-product-demo ${compact
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
          className={`${extraStyles.ownerStatus} ${active
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
  const {t} = useI18n();

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
  const {t} = useI18n();

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