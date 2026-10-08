"use client";

import Link from "next/link";

import {
  ArrowLeft,
  Bath,
  BedDouble,
  Check,
  Eye,
  GitCompare,
  Heart,
  MapPin,
  Maximize2,
  MessageCircle,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { useAuth } from "@/context/auth-context";
import { useCompare } from "@/context/compare-context";
import { useI18n } from "@/context/i18n-context";

import {
  apiMessage,
  chatApi,
  propertiesApi,
  userApi,
} from "@/lib/api";

import type { Property } from "@/types/models";

import { ErrorBlock } from "./home-view";

import { PropertyGallery } from "./property-gallery";

import {
  PropertyCharacteristics,
  PropertyHighlights,
} from "./property-highlights";

import { PropertyLocation } from "./property-location";

import { PropertyReportDialog } from "./property-report-dialog";

import {
  PriceHistoryTrigger,
  PropertyPriceHistory,
  usePropertyPriceHistory,
} from "./property-price-history";

import {
  categoryLabels,
  cityOf,
  formatMoney,
  getListingLabel,
  isPublicProperty,
  priceOf,
} from "./property-presentation";

import styles from "./property-detail.module.css";
import { AgencyCompact } from "./agency-brand";

type DetailFact = {
  icon: typeof BedDouble;
  label: string;
  value: string;
};

function PropertyDetailSkeleton() {
  return (
    <main className={styles.detailShell}>
      <div
        className={`shell ${styles.detailPage}`}
        aria-busy="true"
      >
        <div
          className={`${styles.skeletonPulse} ${styles.skeletonBack}`}
        />

        <div
          className={`${styles.skeletonPulse} ${styles.skeletonGallery}`}
        />

        <div className={styles.skeletonLayout}>
          <div>
            <div
              className={`${styles.skeletonPulse} ${styles.skeletonSummary}`}
            />

            <div
              className={`${styles.skeletonPulse} ${styles.skeletonSection}`}
            />

            <div
              className={`${styles.skeletonPulse} ${styles.skeletonSection}`}
            />
          </div>

          <div
            className={`${styles.skeletonPulse} ${styles.skeletonOwner}`}
          />
        </div>
      </div>
    </main>
  );
}

export function PropertyDetailView({
  id,
}: {
  id: string;
}) {
  const router = useRouter();

  const {
    t,
    formatDate,
  } = useI18n();

  const { user } = useAuth();

  const compare =
    useCompare();

  const [
    property,
    setProperty,
  ] =
    useState<Property | null>(
      null,
    );

  const [
    loadError,
    setLoadError,
  ] =
    useState("");

  const [
    actionError,
    setActionError,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saved,
    setSaved,
  ] =
    useState(false);

  const [
    descriptionExpanded,
    setDescriptionExpanded,
  ] =
    useState(false);

  const [
    priceHistoryExpanded,
    setPriceHistoryExpanded,
  ] =
    useState(false);

  const priceHistory =
    usePropertyPriceHistory(
      id,
    );

  const load = () => {
    setLoading(true);

    setLoadError("");

    propertiesApi
      .one(id)
      .then(setProperty)
      .catch(
        (reason) =>
          setLoadError(
            apiMessage(
              reason,
            ),
          ),
      )
      .finally(
        () =>
          setLoading(
            false,
          ),
      );
  };

  useEffect(() => {
    const timer =
      window.setTimeout(
        load,
        0,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [id]);

  const contact =
    async () => {
      if (!property) {
        return;
      }

      if (!user) {
        router.push(
          "/login",
        );

        return;
      }

      try {
        setActionError(
          "",
        );

        const room =
          await chatApi.createRoom(
            property.id,
          );

        router.push(
          `/messages?room=${room.id}`,
        );
      } catch (reason) {
        setActionError(
          apiMessage(
            reason,
          ),
        );
      }
    };

  const favorite =
    async () => {
      if (!property) {
        return;
      }

      if (!user) {
        router.push(
          "/login",
        );

        return;
      }

      try {
        setActionError(
          "",
        );

        const result =
          await userApi.toggleFavorite(
            property.id,
          );

        setSaved(
          result.status ===
            "added",
        );
      } catch (reason) {
        setActionError(
          apiMessage(
            reason,
          ),
        );
      }
    };

  const facts =
    useMemo<
      DetailFact[]
    >(() => {
      if (!property) {
        return [];
      }

      return [
        {
          icon:
            BedDouble,

          label:
            t(
              "property.rooms",
            ),

          value:
            `${property.rooms}`,
        },

        {
          icon:
            Maximize2,

          label:
            t(
              "property.area",
            ),

          value:
            `${property.area} m²`,
        },

        property.bedrooms
          ? {
              icon:
                BedDouble,

              label:
                t(
                  "property.bedrooms",
                ),

              value:
                `${property.bedrooms}`,
            }
          : null,

        property.bathrooms
          ? {
              icon:
                Bath,

              label:
                t(
                  "property.bathrooms",
                ),

              value:
                `${property.bathrooms}`,
            }
          : null,

        property.floor
          ? {
              icon:
                Maximize2,

              label:
                t(
                  "property.floor",
                ),

              value:
                property.totalFloors
                  ? `${property.floor}/${property.totalFloors}`
                  : `${property.floor}`,
            }
          : null,
      ].filter(
        (
          fact,
        ): fact is DetailFact =>
          Boolean(
            fact,
          ),
      );
    }, [
      property,
      t,
    ]);

  if (loading) {
    return (
      <PropertyDetailSkeleton />
    );
  }

  if (
    loadError ||
    !property
  ) {
    return (
      <div className="shell page-space">
        <ErrorBlock
          message={
            loadError ||
            t(
              "property.notFound",
            )
          }
          retry={load}
        />
      </div>
    );
  }

  if (
    !isPublicProperty(
      property,
    ) &&
    property.owner?.id !==
      user?.id
  ) {
    return (
      <div className="shell page-space">
        <ErrorBlock
          message={t(
            "property.notFound",
          )}
          retry={() =>
            router.push(
              "/properties",
            )
          }
        />
      </div>
    );
  }

  const hostName =
    property.owner?.name ||
    t(
      "property.listedBy",
    );

  const initials =
    hostName
      .split(/\s+/)
      .filter(Boolean)
      .slice(
        0,
        2,
      )
      .map(
        (part) =>
          part[0],
      )
      .join("")
      .toUpperCase();

  const pricePerSquareMeter =
    property.area > 0
      ? Math.round(
          Number(
            property.price,
          ) /
            property.area,
        )
      : undefined;

  const description =
    property.description?.trim() ||
    "";

  const shouldCollapseDescription =
    description.length >
    460;

  const visibleDescription =
    shouldCollapseDescription &&
    !descriptionExpanded
      ? `${description
          .slice(
            0,
            460,
          )
          .trimEnd()}…`
      : description;

  const publishedDate =
    property.createdAt
      ? formatDate(
          property.createdAt,
          {
            month:
              "short",

            year:
              "numeric",
          },
        )
      : null;

  const selected =
    compare.isSelected(
      property.id,
    );

  const locationLabel =
    property.address ||
    cityOf(
      property.city,
    );

  return (
    <main
      className={
        styles.detailShell
      }
    >
      <div
        className={`shell ${styles.detailPage}`}
      >
        {/* =========================
            BACK
        ========================= */}

        <div
          className={
            styles.backRow
          }
        >
          <Link
            href="/properties"
            className={
              styles.backLink
            }
          >
            <ArrowLeft
              size={16}
            />

            {t(
              "property.backToHomes",
            )}
          </Link>
        </div>

        {/* =========================
            GALLERY
        ========================= */}

        <PropertyGallery
          title={
            property.title
          }
          images={
            property.images ||
            []
          }
        />

        {/* =========================
            MAIN GRID
        ========================= */}

        <div
          className={
            styles.detailLayout
          }
        >
          <div
            className={
              styles.mainColumn
            }
          >
            {/* =====================
                SUMMARY
            ===================== */}

            <section
              className={
                styles.summaryCard
              }
              aria-labelledby="property-title"
            >
              <div
                className={
                  styles.summaryTopline
                }
              >
                <div
                  className={
                    styles.summaryBadges
                  }
                >
                  {property.listing && (
                    <span
                      className={
                        styles.summaryBadge
                      }
                    >
                      {getListingLabel(
                        property.listing,
                      )}
                    </span>
                  )}

                  <span
                    className={
                      styles.summaryBadgeSoft
                    }
                  >
                    {categoryLabels[
                      property.category
                    ] ||
                      property.category}
                  </span>

                  <span
                    className={
                      styles.summaryBadgeSoft
                    }
                  >
                    <MapPin
                      size={12}
                    />

                    {cityOf(
                      property.city,
                    )}
                  </span>
                </div>

                {property.views >
                  0 && (
                  <span
                    className={
                      styles.views
                    }
                  >
                    <Eye
                      size={14}
                    />

                    {
                      property.views
                    }

                    {t(
                      "common.views",
                    )}
                  </span>
                )}
              </div>

              <div
                className={
                  styles.summaryHeading
                }
              >
                <div
                  className={
                    styles.titleBlock
                  }
                >
                  <h1
                    id="property-title"
                    className={
                      styles.title
                    }
                  >
                    {
                      property.title
                    }
                  </h1>

                  <p
                    className={
                      styles.address
                    }
                  >
                    <MapPin
                      size={17}
                    />

                    {
                      locationLabel
                    }
                  </p>
                </div>

                <div
                  className={
                    styles.priceCard
                  }
                >
                  <span
                    className={
                      styles.priceLabel
                    }
                  >
                    {t(
                      "property.currentPrice",
                    )}
                  </span>

                  <strong
                    className={
                      styles.priceValue
                    }
                  >
                    {priceOf(
                      property,
                    )}
                  </strong>

                  {pricePerSquareMeter && (
                    <span
                      className={
                        styles.pricePerMeter
                      }
                    >
                      {t(
                        "property.pricePerSquareMeter",
                        {
                          price:
                            formatMoney(
                              pricePerSquareMeter,
                              property.currency,
                            ),
                        },
                      )}
                    </span>
                  )}

                  <PriceHistoryTrigger
                    property={
                      property
                    }
                    request={
                      priceHistory
                    }
                    expanded={
                      priceHistoryExpanded
                    }
                    onToggle={() =>
                      setPriceHistoryExpanded(
                        (
                          value,
                        ) =>
                          !value,
                      )
                    }
                  />
                </div>
              </div>

              <div
                className={
                  styles.facts
                }
                aria-label={t(
                  "property.details",
                )}
              >
                {facts.map(
                  ({
                    icon:
                      Icon,
                    label,
                    value,
                  }) => (
                    <div
                      className={
                        styles.factCard
                      }
                      key={
                        label
                      }
                    >
                      <span
                        className={
                          styles.factIcon
                        }
                      >
                        <Icon
                          size={17}
                        />
                      </span>

                      <span
                        className={
                          styles.factCopy
                        }
                      >
                        <small>
                          {
                            label
                          }
                        </small>

                        <strong>
                          {
                            value
                          }
                        </strong>
                      </span>
                    </div>
                  ),
                )}
              </div>
            </section>

            {/* =====================
                PRICE HISTORY
            ===================== */}

            <PropertyPriceHistory
              property={
                property
              }
              request={
                priceHistory
              }
              expanded={
                priceHistoryExpanded
              }
            />

            {/* =====================
                DESCRIPTION
            ===================== */}

            {description && (
              <section
                className={`${styles.contentCard} ${styles.descriptionCard}`}
              >
                <p
                  className={
                    styles.sectionEyebrow
                  }
                >
                  {t(
                    "property.overview",
                  )}
                </p>

                <h2
                  className={
                    styles.sectionTitle
                  }
                >
                  {t(
                    "property.about",
                  )}
                </h2>

                <p
                  className={
                    styles.descriptionText
                  }
                >
                  {
                    visibleDescription
                  }
                </p>

                {shouldCollapseDescription && (
                  <button
                    type="button"
                    className={
                      styles.showMore
                    }
                    onClick={() =>
                      setDescriptionExpanded(
                        (
                          expanded,
                        ) =>
                          !expanded,
                      )
                    }
                  >
                    {descriptionExpanded
                      ? t(
                          "common.showLess",
                        )
                      : t(
                          "common.showMore",
                        )}
                  </button>
                )}
              </section>
            )}

            {/* =====================
                DETAILS
            ===================== */}

            <PropertyCharacteristics
              property={
                property
              }
            />

            {/* =====================
                FEATURES
            ===================== */}

            <PropertyHighlights
              features={
                property.features
              }
            />

            {/* =====================
                LOCATION
            ===================== */}

            <PropertyLocation
              property={
                property
              }
            />
          </div>

          {/* =========================
              OWNER
          ========================= */}

          <aside
            className={
              styles.ownerColumn
            }
          >
            <div
              className={
                styles.ownerCard
              }
              aria-label={t(
                "property.listedBy",
              )}
            >
              <div
                className={
                  styles.ownerAccent
                }
                aria-hidden="true"
              />

              <div
                className={
                  styles.ownerHeader
                }
              >
                <p
                  className={
                    styles.ownerEyebrow
                  }
                >
                  {t(
                    "property.listedBy",
                  )}
                </p>

                <div
                  className={
                    styles.ownerProfile
                  }
                >
                  <div
                    className={
                      styles.ownerAvatar
                    }
                  >
                    {property.owner
                      ?.image
                      ?.url ? (
                      <img
                        src={
                          property
                            .owner
                            .image
                            .url
                        }
                        alt={
                          hostName
                        }
                      />
                    ) : (
                      initials || (
                        <UserRound
                          size={
                            20
                          }
                        />
                      )
                    )}
                  </div>

                  <div
                    className={
                      styles.ownerIdentity
                    }
                  >
                    <strong
                      className={
                        styles.ownerName
                      }
                    >
                      {
                        hostName
                      }
                    </strong>

                    {property.owner
                      ?.gmailStatus ===
                      "VERIFIED" && (
                      <span
                        className={
                          styles.verified
                        }
                      >
                        <ShieldCheck
                          size={
                            13
                          }
                        />

                        {t(
                          "property.verifiedEmail",
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {property.agency && (
                  <div className={styles.agencyListing}>
                    <p>{t("agency.listedBy")}</p>
                    <AgencyCompact agency={property.agency}/>
                    <span>{property.agency.description}</span>
                    <Link href={`/agency/${property.agency.id}`} className={styles.agencyLink}>{t("agency.view")}</Link>
                  </div>
                )}
              </div>

              <div
                className={
                  styles.ownerActions
                }
              >
                <button
                  type="button"
                  onClick={
                    contact
                  }
                  className={
                    styles.primaryAction
                  }
                >
                  <MessageCircle
                    size={18}
                  />

                  {t(
                    "property.messageOwner",
                  )}
                </button>

                {property.owner
                  ?.phone && (
                  <a
                    href={`tel:${property.owner.phone}`}
                    className={
                      styles.callAction
                    }
                  >
                    <Phone
                      size={17}
                    />

                    {t(
                      "property.callOwner",
                    )}
                  </a>
                )}

                <div
                  className={
                    styles.secondaryGrid
                  }
                >
                  <button
                    type="button"
                    onClick={
                      favorite
                    }
                    className={`${styles.secondaryAction} ${
                      saved
                        ? styles.secondarySelected
                        : ""
                    }`}
                  >
                    <Heart
                      size={17}
                      className={
                        saved
                          ? styles.heartFilled
                          : ""
                      }
                    />

                    {saved
                      ? t(
                          "property.savedHome",
                        )
                      : t(
                          "property.saveHome",
                        )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      compare.toggleProperty(
                        property.id,
                      )
                    }
                    className={`${styles.secondaryAction} ${
                      selected
                        ? styles.secondarySelected
                        : ""
                    }`}
                    aria-label={
                      selected
                        ? t(
                            "property.removeFromCompare",
                          )
                        : t(
                            "property.compare",
                          )
                    }
                    aria-pressed={
                      selected
                    }
                  >
                    {selected ? (
                      <Check
                        size={
                          17
                        }
                      />
                    ) : (
                      <GitCompare
                        size={
                          17
                        }
                      />
                    )}

                    {selected
                      ? t(
                          "property.addedToCompare",
                        )
                      : t(
                          "property.compare",
                        )}
                  </button>
                </div>
              </div>

              <div
                className={
                  styles.ownerMeta
                }
              >
                <span>
                  {t(
                    "property.listingId",
                  )}

                  <strong>
                    #
                    {
                      property.id
                    }
                  </strong>
                </span>

                {publishedDate && (
                  <span>
                    {t(
                      "property.listed",
                    )}

                    <strong>
                      {
                        publishedDate
                      }
                    </strong>
                  </span>
                )}
              </div>

              {property.owner
                ?.id !==
                user?.id && (
                <div
                  className={
                    styles.reportSlot
                  }
                >
                  <PropertyReportDialog
                    propertyId={
                      property.id
                    }
                  />
                </div>
              )}

              {actionError && (
                <p
                  className={
                    styles.actionError
                  }
                  role="status"
                >
                  {
                    actionError
                  }
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
