"use client";

import Link from "next/link";

import {
  BedDouble,
  Check,
  GitCompare,
  Heart,
  MapPin,
  Maximize2,
  MoveUpRight,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiMessage, userApi } from "@/lib/api";

import type { Property } from "@/types/models";

import { useAuth } from "@/context/auth-context";
import { useCompare } from "@/context/compare-context";
import { useI18n } from "@/context/i18n-context";

import {
  categoryLabels,
  cityOf,
  formatMoney,
  getListingLabel,
  priceOf,
} from "./property-presentation";

import styles from "./properties-catalog.module.css";
import { AgencyBadge } from "./agency-brand";

export const labels = categoryLabels;

export {
  cityOf,
  priceOf,
} from "./property-presentation";

type PropertyCardProps = {
  property: Property;
  onFavorite?: () => void;
};

export function PropertyCard({
  property,
  onFavorite,
}: PropertyCardProps) {
  const { user } = useAuth();

  const { t } = useI18n();

  const {
    toggleProperty,
    isSelected,
  } = useCompare();

  const router = useRouter();

  const [saved, setSaved] =
    useState(false);

  const [error, setError] =
    useState("");

  const image =
    property.images?.[0]?.url;

  const selected =
    isSelected(property.id);

  const pricePerSquareMeter =
    property.area > 0
      ? Math.round(
          Number(property.price) /
            property.area,
        )
      : undefined;

  const favorite = async (
    event: React.MouseEvent,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      router.push("/login");
      return;
    }

    try {
      setError("");

      const result =
        await userApi.toggleFavorite(
          property.id,
        );

      setSaved(
        result.status === "added",
      );

      onFavorite?.();
    } catch (reason) {
      setError(
        apiMessage(reason),
      );
    }
  };

  const compare = (
    event: React.MouseEvent,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    toggleProperty(property.id);
  };

  return (
    <article
      aria-label={`${t("common.viewProperty")}: ${property.title}`}
      className={styles.propertyCard}
    >
      <Link
        href={`/properties/${property.id}`}
        className={styles.propertyCardLink}
      >
        {/* ==============================
            IMAGE
        ============================== */}
        <div className={styles.propertyMedia}>
          {image ? (
            <img
              src={image}
              alt={property.title}
              className={styles.propertyImage}
            />
          ) : (
            <div
              className={styles.propertyPlaceholder}
            />
          )}

          <div
            className={styles.propertyImageShade}
            aria-hidden="true"
          />

          {/* Badges */}
          <div className={styles.propertyBadges}>
            <span
              className={styles.propertyTypeBadge}
            >
              {labels[property.category] ||
                property.category}
            </span>

            {property.listing && (
              <span
                className={
                  styles.propertyListingBadge
                }
              >
                {getListingLabel(
                  property.listing,
                )}
              </span>
            )}
          </div>

          {/* Price */}
          <div className={styles.propertyPriceLayer}>
            <div>
              <span
                className={
                  styles.propertyPriceLabel
                }
              >
                {t("common.price")}
              </span>

              <strong
                className={
                  styles.propertyPrice
                }
              >
                {priceOf(property)}
              </strong>

              {pricePerSquareMeter && (
                <span
                  className={
                    styles.propertySquarePrice
                  }
                >
                  {formatMoney(
                    pricePerSquareMeter,
                    property.currency,
                  )}{" "}
                  / m²
                </span>
              )}
            </div>

            <span
              className={
                styles.propertyOpenIndicator
              }
            >
              <MoveUpRight
                size={17}
              />
            </span>
          </div>
        </div>

        {/* ==============================
            BODY
        ============================== */}
        <div className={styles.propertyBody}>
          <div className={styles.propertyMainInfo}>
            <h3 className={styles.propertyTitle}>
              {property.title}
            </h3>

            <p
              className={
                styles.propertyLocation
              }
            >
              <MapPin
                size={14}
                aria-hidden="true"
              />

              {cityOf(property.city)}
            </p>

            {property.agency && <span className={styles.propertyAgency}><AgencyBadge agency={property.agency}/></span>}
          </div>

          <div className={styles.propertySpecs}>
            <span>
              <BedDouble
                size={15}
                aria-hidden="true"
              />

              <strong>
                {property.rooms}
              </strong>

              <small>
                {t("common.rooms")}
              </small>
            </span>

            <span>
              <Maximize2
                size={15}
                aria-hidden="true"
              />

              <strong>
                {property.area}
              </strong>

              <small>m²</small>
            </span>

            {property.bedrooms ? (
              <span>
                <BedDouble
                  size={15}
                  aria-hidden="true"
                />

                <strong>
                  {property.bedrooms}
                </strong>

                <small>
                  {t(
                    "property.bedrooms",
                  )}
                </small>
              </span>
            ) : (
              <span
                className={
                  styles.propertyExploreSpec
                }
              >
                <MoveUpRight
                  size={15}
                  aria-hidden="true"
                />

                <strong>
                  {t(
                    "common.viewProperty",
                  )}
                </strong>
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* ==============================
          ACTIONS
      ============================== */}
      <div
        className={
          styles.propertyActions
        }
      >
        <button
          type="button"
          onClick={compare}
          className={`${styles.propertyAction} ${
            selected
              ? styles.propertyActionActive
              : ""
          }`}
          aria-label={
            selected
              ? t(
                  "property.removeFromCompare",
                )
              : t(
                  "compare.compareProperties",
                )
          }
          aria-pressed={selected}
          data-tip={t(
            "property.compare",
          )}
        >
          {selected ? (
            <Check
              size={17}
              strokeWidth={3}
            />
          ) : (
            <GitCompare
              size={17}
            />
          )}
        </button>

        <button
          type="button"
          onClick={favorite}
          className={`${styles.propertyAction} ${
            saved
              ? styles.propertyFavoriteActive
              : ""
          }`}
          aria-label={t(
            "property.saveHome",
          )}
          aria-pressed={saved}
          data-tip={t(
            "property.saveHome",
          )}
        >
          <Heart
            size={17}
            className={
              saved
                ? styles.propertyHeartFilled
                : ""
            }
          />
        </button>
      </div>

      {error && (
        <p
          className={
            styles.propertyError
          }
        >
          {error}
        </p>
      )}
    </article>
  );
}

export function PropertySkeleton() {
  return (
    <div
      className={
        styles.propertySkeleton
      }
    >
      <div
        className={`${styles.skeletonPulse} ${styles.skeletonImage}`}
      />

      <div
        className={
          styles.skeletonBody
        }
      >
        <div
          className={`${styles.skeletonPulse} ${styles.skeletonTitle}`}
        />

        <div
          className={`${styles.skeletonPulse} ${styles.skeletonMeta}`}
        />

        <div
          className={`${styles.skeletonPulse} ${styles.skeletonSpecs}`}
        />
      </div>
    </div>
  );
}
