"use client";

import {
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  CarFront,
  ChefHat,
  Flame,
  Layers3,
  Mountain,
  PanelsTopLeft,
  PawPrint,
  Refrigerator,
  Ruler,
  ShieldCheck,
  Snowflake,
  Sofa,
  Sparkles,
  TreePine,
  WashingMachine,
  Wifi,
} from "lucide-react";

import type {
  LucideIcon,
} from "lucide-react";

import {
  useState,
} from "react";

import type {
  Property,
  PropertyFeature,
} from "@/types/models";

import {
  getFeatureGroups,
} from "./property-form-options";

import {
  buildingLabels,
  conditionLabels,
  getFeatureLabel,
  readableEnum,
} from "./property-presentation";

import {
  useI18n,
} from "@/context/i18n-context";

import styles from "./property-detail.module.css";

const featureIcons:
  Partial<
    Record<
      PropertyFeature,
      LucideIcon
    >
  > = {
  PARKING:
    CarFront,

  UNDERGROUND_PARKING:
    CarFront,

  COVERED_PARKING:
    CarFront,

  GARAGE:
    CarFront,

  EV_CHARGING:
    CarFront,

  ELEVATOR:
    Building2,

  FREIGHT_ELEVATOR:
    Building2,

  SECURITY:
    ShieldCheck,

  CCTV:
    ShieldCheck,

  INTERCOM:
    ShieldCheck,

  VIDEO_INTERCOM:
    ShieldCheck,

  CONCIERGE:
    ShieldCheck,

  GATED_ENTRANCE:
    ShieldCheck,

  GATED_YARD:
    ShieldCheck,

  ALARM_SYSTEM:
    ShieldCheck,

  FIRE_ALARM:
    ShieldCheck,

  SMOKE_DETECTOR:
    ShieldCheck,

  WHEELCHAIR_ACCESS:
    ShieldCheck,

  RAMP:
    ShieldCheck,

  BALCONY:
    TreePine,

  OPEN_BALCONY:
    TreePine,

  CLOSED_BALCONY:
    TreePine,

  LOGGIA:
    TreePine,

  TERRACE:
    TreePine,

  PRIVATE_YARD:
    TreePine,

  GARDEN:
    TreePine,

  ROOFTOP_ACCESS:
    TreePine,

  FURNISHED:
    Sofa,

  PARTIALLY_FURNISHED:
    Sofa,

  BUILT_IN_FURNITURE:
    Sofa,

  BUILT_IN_WARDROBE:
    Sofa,

  WALK_IN_CLOSET:
    Sofa,

  BUILT_IN_KITCHEN:
    ChefHat,

  AIR_CONDITIONER:
    Snowflake,

  FLOOR_HEATING:
    Flame,

  FIREPLACE:
    Flame,

  REFRIGERATOR:
    Refrigerator,

  FREEZER:
    Refrigerator,

  GAS_STOVE:
    ChefHat,

  ELECTRIC_STOVE:
    ChefHat,

  INDUCTION_STOVE:
    ChefHat,

  OVEN:
    ChefHat,

  MICROWAVE:
    ChefHat,

  DISHWASHER:
    ChefHat,

  KITCHEN_HOOD:
    ChefHat,

  WASHING_MACHINE:
    WashingMachine,

  DRYER:
    WashingMachine,

  HOT_WATER:
    Bath,

  GAS:
    Flame,

  WATER_24_7:
    Bath,

  WATER_TANK:
    Bath,

  WATER_FILTER:
    Bath,

  BACKUP_GENERATOR:
    PanelsTopLeft,

  SOLAR_PANELS:
    PanelsTopLeft,

  INTERNET:
    Wifi,

  WIFI:
    Wifi,

  FIBER_INTERNET:
    Wifi,

  CABLE_TV:
    PanelsTopLeft,

  TV:
    PanelsTopLeft,

  SMART_TV:
    PanelsTopLeft,

  BATHTUB:
    Bath,

  SHOWER:
    Bath,

  SHOWER_CABIN:
    Bath,

  BIDET:
    Bath,

  DOUBLE_GLAZED_WINDOWS:
    PanelsTopLeft,

  PANORAMIC_WINDOWS:
    PanelsTopLeft,

  SOUND_INSULATION:
    PanelsTopLeft,

  THERMAL_INSULATION:
    PanelsTopLeft,

  CITY_VIEW:
    Building2,

  MOUNTAIN_VIEW:
    Mountain,

  COURTYARD_VIEW:
    TreePine,

  STREET_VIEW:
    Building2,

  PETS_ALLOWED:
    PawPrint,

  CHILDREN_ALLOWED:
    Sparkles,
};

export function PropertyCharacteristics({
  property,
}: {
  property: Property;
}) {
  const { t } =
    useI18n();

  const detailItems = [
    {
      icon:
        BedDouble,

      label:
        t(
          "property.bedrooms",
        ),

      value:
        property.bedrooms,
    },

    {
      icon:
        Bath,

      label:
        t(
          "property.bathrooms",
        ),

      value:
        property.bathrooms,
    },

    {
      icon:
        Layers3,

      label:
        t(
          "property.floor",
        ),

      value:
        property.floor &&
        property.totalFloors
          ? `${property.floor}/${property.totalFloors}`
          : property.floor,
    },

    {
      icon:
        Ruler,

      label:
        t(
          "property.ceilingHeight",
        ),

      value:
        property.ceilingHeight
          ? `${property.ceilingHeight} m`
          : undefined,
    },

    {
      icon:
        CalendarDays,

      label:
        t(
          "property.constructionYear",
        ),

      value:
        property.constructionYear,
    },

    {
      icon:
        Building2,

      label:
        t(
          "property.buildingType",
        ),

      value:
        property.buildingType
          ? buildingLabels[
              property
                .buildingType
            ] ||
            readableEnum(
              property
                .buildingType,
            )
          : undefined,
    },

    {
      icon:
        Sparkles,

      label:
        t(
          "property.condition",
        ),

      value:
        property.condition
          ? conditionLabels[
              property
                .condition
            ] ||
            readableEnum(
              property
                .condition,
            )
          : undefined,
    },
  ];

  const items =
    detailItems.filter(
      (
        item,
      ): item is typeof item & {
        value:
          | string
          | number;
      } =>
        item.value !==
          undefined &&
        item.value !==
          null,
    );

  if (!items.length) {
    return null;
  }

  return (
    <section
      className={
        styles.contentCard
      }
      aria-labelledby="characteristics-title"
    >
      <div
        className={
          styles.sectionHeading
        }
      >
        <div>
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
            id="characteristics-title"
            className={
              styles.sectionTitle
            }
          >
            {t(
              "property.details",
            )}
          </h2>
        </div>

        <span
          className={
            styles.sectionCount
          }
        >
          {
            items.length
          }
        </span>
      </div>

      <div
        className={
          styles.characteristicsGrid
        }
      >
        {items.map(
          ({
            icon:
              Icon,
            label,
            value,
          }) => (
            <div
              className={
                styles.characteristicItem
              }
              key={
                label
              }
            >
              <span
                className={
                  styles.characteristicIcon
                }
              >
                <Icon
                  size={18}
                />
              </span>

              <span
                className={
                  styles.characteristicCopy
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
  );
}

export function PropertyHighlights({
  features = [],
}: {
  features?: PropertyFeature[];
}) {
  const [
    expanded,
    setExpanded,
  ] =
    useState(false);

  const { t } =
    useI18n();

  const featureGroups =
    getFeatureGroups(
      (id) =>
        t(
          `property.${id}`,
        ),
    );

  const knownFeatures =
    new Set(
      featureGroups.flatMap(
        (group) =>
          group.options.map(
            (
              option,
            ) =>
              option.value,
          ),
      ),
    );

  const selectedGroups =
    featureGroups
      .map(
        (
          group,
        ) => ({
          ...group,

          displayLabel:
            group.label,

          options:
            group.options.filter(
              (
                option,
              ) =>
                features.includes(
                  option.value,
                ),
            ),
        }),
      )
      .filter(
        (
          group,
        ) =>
          group.options
            .length >
          0,
      );

  const otherFeatures =
    features.filter(
      (
        feature,
      ) =>
        !knownFeatures.has(
          feature,
        ),
    );

  const groups =
    otherFeatures.length
      ? [
          ...selectedGroups,

          {
            label:
              t(
                "property.otherFeatures",
              ),

            displayLabel:
              t(
                "property.otherFeatures",
              ),

            icon:
              Sparkles,

            options:
              otherFeatures.map(
                (
                  value,
                ) => ({
                  value,

                  label:
                    getFeatureLabel(
                      value,
                    ),
                }),
              ),
          },
        ]
      : selectedGroups;

  if (!groups.length) {
    return null;
  }

  const totalFeatures =
    features.length;

  const limit =
    expanded
      ? Number.POSITIVE_INFINITY
      : 10;

  let remaining =
    limit;

  const visibleGroups =
    groups
      .map(
        (
          group,
        ) => {
          const options =
            group.options.slice(
              0,
              remaining,
            );

          remaining -=
            options.length;

          return {
            ...group,
            options,
          };
        },
      )
      .filter(
        (
          group,
        ) =>
          group.options
            .length >
          0,
      );

  return (
    <section
      className={
        styles.contentCard
      }
      aria-labelledby="property-highlights-title"
    >
      <div
        className={
          styles.sectionHeading
        }
      >
        <div>
          <p
            className={
              styles.sectionEyebrow
            }
          >
            {t(
              "search.feature",
            )}
          </p>

          <h2
            id="property-highlights-title"
            className={
              styles.sectionTitle
            }
          >
            {t(
              "property.offers",
            )}
          </h2>
        </div>

        <span
          className={
            styles.sectionCount
          }
        >
          {
            totalFeatures
          }
        </span>
      </div>

      <div
        className={
          styles.featureGroups
        }
      >
        {visibleGroups.map(
          ({
            displayLabel,
            icon:
              Icon,
            options,
          }) => (
            <section
              className={
                styles.featureGroup
              }
              key={
                displayLabel
              }
              aria-label={
                displayLabel
              }
            >
              <h3
                className={
                  styles.featureGroupTitle
                }
              >
                <span>
                  <Icon
                    size={16}
                  />
                </span>

                {
                  displayLabel
                }
              </h3>

              <div
                className={
                  styles.featureChips
                }
              >
                {options.map(
                  (
                    option,
                    index,
                  ) => {
                    const FeatureIcon =
                      featureIcons[
                        option.value
                      ] ||
                      Icon;

                    return (
                      <div
                        className={
                          styles.featureChip
                        }
                        key={`${option.value}-${index}`}
                      >
                        <FeatureIcon
                          size={
                            15
                          }
                        />

                        <span>
                          {getFeatureLabel(
                            option.value,
                          )}
                        </span>
                      </div>
                    );
                  },
                )}
              </div>
            </section>
          ),
        )}
      </div>

      {totalFeatures >
        10 && (
        <button
          type="button"
          onClick={() =>
            setExpanded(
              (
                value,
              ) =>
                !value,
            )
          }
          className={
            styles.showMore
          }
          aria-expanded={
            expanded
          }
        >
          {expanded
            ? t(
                "property.showFewerFeatures",
              )
            : `${t(
                "property.showAllFeatures",
              )} (${totalFeatures})`}
        </button>
      )}
    </section>
  );
}