"use client";

import Link from "next/link";

import {
  MapPin,
  Navigation,
} from "lucide-react";

import type { Property } from "@/types/models";

import {
  cityOf,
} from "./property-card";

import {
  RentoraMap,
  hasCoordinates,
} from "./rentora-map";

import {
  useI18n,
} from "@/context/i18n-context";

import styles from "./property-detail.module.css";

export function PropertyLocation({
  property,
}: {
  property: Property;
}) {
  const { t } =
    useI18n();

  const coordinates =
    hasCoordinates(
      property,
    )
      ? {
          latitude:
            Number(
              property.latitude,
            ),

          longitude:
            Number(
              property.longitude,
            ),
        }
      : null;

  const locationLabel =
    property.address ||
    cityOf(
      property.city,
    );

  return (
    <section
      className={`${styles.contentCard} ${styles.locationSection}`}
    >
      <div
        className={
          styles.locationHeader
        }
      >
        <div>
          <p
            className={
              styles.sectionEyebrow
            }
          >
            {t(
              "create.location",
            )}
          </p>

          <h2
            className={
              styles.sectionTitle
            }
          >
            {t(
              "property.address",
            )}
          </h2>

          <p
            className={
              styles.locationAddress
            }
          >
            <MapPin
              size={16}
            />

            {
              locationLabel
            }
          </p>
        </div>

        {coordinates && (
          <Link
            href={`/map?lat=${coordinates.latitude}&lng=${coordinates.longitude}&zoom=15&property=${property.id}`}
            className={
              styles.locationAction
            }
          >
            <Navigation
              size={16}
            />

            {t(
              "property.viewOnMap",
            )}
          </Link>
        )}
      </div>

      {coordinates ? (
        <div
          className={
            styles.locationMapWrap
          }
        >
          <div
            className={
              styles.locationMapTop
            }
          >
            <span>
              <MapPin
                size={13}
              />

              {cityOf(
                property.city,
              )}
            </span>

            <small>
              {coordinates.latitude.toFixed(
                4,
              )}
              ,{" "}
              {coordinates.longitude.toFixed(
                4,
              )}
            </small>
          </div>

          <RentoraMap
            preview
            marker={
              coordinates
            }
            initialCenter={
              coordinates
            }
            initialZoom={
              15.25
            }
            className={
              styles.locationMap
            }
          />
        </div>
      ) : (
        <div
          className={
            styles.locationFallback
          }
        >
          <span>
            <MapPin
              size={20}
            />
          </span>

          <div>
            <strong>
              {t(
                "property.noLocation",
              )}
            </strong>

            <p>
              {t(
                "map.noMappedListingsCopy",
              )}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}