"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  ChevronDown,
  CircleDollarSign,
  LoaderCircle,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  apiMessage,
  propertiesApi,
} from "@/lib/api";

import type {
  Currency,
  Property,
  PropertyPriceHistoryEntry,
} from "@/types/models";

import {
  useI18n,
} from "@/context/i18n-context";

import {
  formatMoney,
} from "./property-presentation";

import styles from "./property-detail.module.css";

type PropertyPrice =
  Pick<
    Property,
    | "id"
    | "price"
    | "currency"
  >;

type TimelineEntry =
  PropertyPriceHistoryEntry & {
    numericPrice:
      number;

    previous?:
      PropertyPriceHistoryEntry;
  };

export type PriceHistoryRequest = {
  propertyId:
    string;

  history:
    PropertyPriceHistoryEntry[] |
    null;

  error:
    string;
};

type HistoryStats = {
  entries:
    TimelineEntry[];

  original:
    TimelineEntry;

  latest:
    TimelineEntry;

  current: {
    price:
      | string
      | number;

    currency:
      Currency;

    numericPrice:
      number;
  };

  sameCurrency:
    boolean;

  difference:
    number | null;

  percentage:
    number | null;

  hasMismatch:
    boolean;
};

const numericPrice = (
  value:
    | string
    | number,
) => {
  const parsed =
    Number(
      value,
    );

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : null;
};

const dateKey = (
  value: string,
) =>
  new Date(
    value,
  )
    .toISOString()
    .slice(
      0,
      10,
    );

function getHistoryStats(
  property:
    PropertyPrice,

  history:
    PropertyPriceHistoryEntry[] |
    null,
): HistoryStats | null {
  const entries =
    (history || [])
      .map(
        (
          entry,
        ) => ({
          ...entry,

          numericPrice:
            numericPrice(
              entry.price,
            ),
        }),
      )
      .filter(
        (
          entry,
        ): entry is TimelineEntry =>
          entry.numericPrice !==
          null,
      )
      .sort(
        (
          a,
          b,
        ) =>
          new Date(
            a.createdAt,
          ).getTime() -
          new Date(
            b.createdAt,
          ).getTime(),
      )
      .map(
        (
          entry,
          index,
          sorted,
        ) => ({
          ...entry,

          previous:
            sorted[
              index -
                1
            ],
        }),
      );

  if (!entries.length) {
    return null;
  }

  const original =
    entries[0];

  const latest =
    entries[
      entries.length -
        1
    ];

  const propertyPrice =
    numericPrice(
      property.price,
    );

  const hasMismatch =
    propertyPrice !==
      null &&
    (propertyPrice !==
      latest.numericPrice ||
      property.currency !==
        latest.currency);

  const current =
    hasMismatch &&
    propertyPrice !== null
      ? {
          price:
            property.price,

          currency:
            property.currency,

          numericPrice:
            propertyPrice,
        }
      : {
          price:
            latest.price,

          currency:
            latest.currency,

          numericPrice:
            latest.numericPrice,
        };

  const sameCurrency =
    entries.every(
      (
        entry,
      ) =>
        entry.currency ===
        original.currency,
    ) &&
    current.currency ===
      original.currency;

  const difference =
    sameCurrency
      ? current.numericPrice -
        original.numericPrice
      : null;

  const percentage =
    difference !== null &&
    original.numericPrice >
      0
      ? (difference /
          original.numericPrice) *
        100
      : null;

  return {
    entries,
    original,
    latest,
    current,
    sameCurrency,
    difference,
    percentage,
    hasMismatch,
  };
}

export function usePropertyPriceHistory(
  propertyId:
    string | number,
): PriceHistoryRequest {
  const key =
    String(
      propertyId,
    );

  const [
    request,
    setRequest,
  ] =
    useState<PriceHistoryRequest>(
      () => ({
        propertyId:
          key,

        history:
          null,

        error:
          "",
      }),
    );

  const state =
    request.propertyId ===
    key
      ? request
      : {
          propertyId:
            key,

          history:
            null,

          error:
            "",
        };

  useEffect(() => {
    let active =
      true;

    propertiesApi
      .priceHistory(
        propertyId,
      )
      .then(
        (
          history,
        ) => {
          if (
            active
          ) {
            setRequest({
              propertyId:
                key,

              history,

              error:
                "",
            });
          }
        },
      )
      .catch(
        (
          reason,
        ) => {
          if (
            active
          ) {
            setRequest({
              propertyId:
                key,

              history:
                null,

              error:
                apiMessage(
                  reason,
                ),
            });
          }
        },
      );

    return () => {
      active =
        false;
    };
  }, [
    key,
    propertyId,
  ]);

  return state;
}

function formatPercentage(
  percentage:
    number,
) {
  return new Intl.NumberFormat(
    undefined,
    {
      maximumFractionDigits:
        1,
    },
  ).format(
    Math.abs(
      percentage,
    ),
  );
}

function Percentage({
  percentage,
  decrease,
}: {
  percentage:
    number;

  decrease:
    boolean;
}) {
  return (
    <>
      {decrease
        ? "↓"
        : "↑"}{" "}

      {formatPercentage(
        percentage,
      )}
      %
    </>
  );
}

export function PriceHistoryTrigger({
  property,
  request,
  expanded,
  onToggle,
}: {
  property:
    PropertyPrice;

  request:
    PriceHistoryRequest;

  expanded:
    boolean;

  onToggle:
    () => void;
}) {
  const { t } =
    useI18n();

  const stats =
    useMemo(
      () =>
        getHistoryStats(
          property,
          request.history,
        ),
      [
        property,
        request.history,
      ],
    );

  if (
    request.history &&
    !stats
  ) {
    return null;
  }

  const hasChanges =
    Boolean(
      stats &&
        stats.entries
          .length >
          1,
    );

  const decrease =
    Boolean(
      stats?.difference &&
        stats.difference <
          0,
    );

  const showPercentage =
    hasChanges &&
    stats?.sameCurrency &&
    stats.percentage !==
      null &&
    stats.difference !==
      0;

  const loading =
    request.history ===
      null &&
    !request.error;

  return (
    <button
      type="button"
      className={
        styles.historyTrigger
      }
      onClick={
        onToggle
      }
      aria-expanded={
        expanded
      }
      aria-controls="price-history-panel"
      disabled={
        loading
      }
    >
      <span
        className={
          styles.historyTriggerIcon
        }
      >
        {loading ? (
          <LoaderCircle
            size={15}
          />
        ) : (
          <ChartNoAxesCombined
            size={15}
          />
        )}
      </span>

      <span
        className={
          styles.historyTriggerCopy
        }
      >
        <strong>
          {t(
            "property.priceHistoryTitle",
          )}
        </strong>

        <small>
          {request.error
            ? t(
                "property.priceHistoryUnavailable",
              )
            : showPercentage
              ? (
                <Percentage
                  percentage={
                    stats?.percentage ||
                    0
                  }
                  decrease={
                    decrease
                  }
                />
              )
              : t(
                  "property.noPriceChanges",
                )}
        </small>
      </span>

      <ChevronDown
        size={16}
        className={
          expanded
            ? styles.historyChevronOpen
            : ""
        }
      />
    </button>
  );
}

function PriceHistoryChart({
  entries,
  sameDay,
}: {
  entries:
    TimelineEntry[];

  sameDay:
    boolean;
}) {
  const {
    formatDate,
    t,
  } = useI18n();

  const width =
    680;

  const height =
    205;

  const padding = {
    top: 20,
    right: 22,
    bottom: 30,
    left: 22,
  };

  const prices =
    entries.map(
      (
        entry,
      ) =>
        entry.numericPrice,
    );

  const min =
    Math.min(
      ...prices,
    );

  const max =
    Math.max(
      ...prices,
    );

  const range =
    max - min ||
    Math.max(
      max * 0.08,
      1,
    );

  const chartWidth =
    width -
    padding.left -
    padding.right;

  const chartHeight =
    height -
    padding.top -
    padding.bottom;

  const points =
    entries.map(
      (
        entry,
        index,
      ) => ({
        entry,

        x:
          padding.left +
          (index /
            Math.max(
              entries.length -
                1,
              1,
            )) *
            chartWidth,

        y:
          padding.top +
          ((max -
            entry.numericPrice) /
            range) *
            chartHeight,
      }),
    );

  const pointDate = (
    value:
      string,
  ) =>
    formatDate(
      value,
      sameDay
        ? {
            day:
              "numeric",

            month:
              "short",

            year:
              "numeric",

            hour:
              "2-digit",

            minute:
              "2-digit",
          }
        : {
            day:
              "numeric",

            month:
              "short",

            year:
              "numeric",
          },
    );

  return (
    <div
      className={
        styles.historyChart
      }
      aria-label={t(
        "property.priceHistoryChart",
      )}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t(
          "property.priceHistoryChart",
        )}
        preserveAspectRatio="none"
      >
        {[
          0,
          0.5,
          1,
        ].map(
          (
            position,
          ) => (
            <line
              key={
                position
              }
              x1={
                padding.left
              }
              x2={
                width -
                padding.right
              }
              y1={
                padding.top +
                chartHeight *
                  position
              }
              y2={
                padding.top +
                chartHeight *
                  position
              }
              className={
                styles.historyGrid
              }
            />
          ),
        )}

        <polyline
          points={points
            .map(
              ({
                x,
                y,
              }) =>
                `${x},${y}`,
            )
            .join(
              " ",
            )}
          className={
            styles.historyLine
          }
        />

        {points.map(
          ({
            x,
            y,
            entry,
          },
          index,
        ) => (
          <circle
            key={
              entry.id
            }
            cx={x}
            cy={y}
            r={
              index ===
              points.length -
                1
                ? 5
                : 3.8
            }
            className={`${styles.historyPoint} ${
              index ===
              points.length -
                1
                ? styles.historyPointCurrent
                : ""
            }`}
          >
            <title>
              {`${pointDate(
                entry.createdAt,
              )} · ${formatMoney(
                entry.price,
                entry.currency,
              )}`}
            </title>
          </circle>
        ))}

        <text
          x={
            padding.left
          }
          y={
            height - 8
          }
          className={
            styles.historyAxis
          }
        >
          {sameDay
            ? formatDate(
                entries[0]
                  .createdAt,
                {
                  hour:
                    "2-digit",

                  minute:
                    "2-digit",
                },
              )
            : formatDate(
                entries[0]
                  .createdAt,
                {
                  day:
                    "numeric",

                  month:
                    "short",
                },
              )}
        </text>

        <text
          x={
            width -
            padding.right
          }
          y={
            height - 8
          }
          textAnchor="end"
          className={
            styles.historyAxis
          }
        >
          {sameDay
            ? formatDate(
                entries[
                  entries.length -
                    1
                ].createdAt,
                {
                  hour:
                    "2-digit",

                  minute:
                    "2-digit",
                },
              )
            : formatDate(
                entries[
                  entries.length -
                    1
                ].createdAt,
                {
                  day:
                    "numeric",

                  month:
                    "short",
                },
              )}
        </text>
      </svg>
    </div>
  );
}

function TimelineChange({
  current,
  previous,
}: {
  current:
    TimelineEntry;

  previous?:
    PropertyPriceHistoryEntry;
}) {
  const { t } =
    useI18n();

  if (!previous) {
    return (
      <span
        className={
          styles.historyOriginal
        }
      >
        <CircleDollarSign
          size={14}
        />

        {t(
          "property.originalListingPrice",
        )}
      </span>
    );
  }

  if (
    previous.currency !==
    current.currency
  ) {
    return (
      <span
        className={
          styles.historyNeutral
        }
      >
        <Minus
          size={14}
        />

        {t(
          "property.currencyChangedHistory",
        )}
      </span>
    );
  }

  const previousPrice =
    numericPrice(
      previous.price,
    );

  if (
    previousPrice ===
    null
  ) {
    return null;
  }

  const difference =
    current.numericPrice -
    previousPrice;

  if (
    difference === 0
  ) {
    return (
      <span
        className={
          styles.historyNeutral
        }
      >
        <Minus
          size={14}
        />

        {t(
          "property.priceUnchanged",
        )}
      </span>
    );
  }

  const decrease =
    difference < 0;

  const Icon =
    decrease
      ? ArrowDownRight
      : ArrowUpRight;

  return (
    <span
      className={`${styles.historyChange} ${
        decrease
          ? styles.historyDown
          : styles.historyUp
      }`}
    >
      <Icon
        size={14}
      />

      {decrease
        ? "−"
        : "+"}

      {formatMoney(
        Math.abs(
          difference,
        ),
        current.currency,
      )}
    </span>
  );
}

export function PropertyPriceHistory({
  property,
  request,
  expanded,
}: {
  property:
    PropertyPrice;

  request:
    PriceHistoryRequest;

  expanded:
    boolean;
}) {
  const {
    formatDate,
    t,
  } = useI18n();

  const stats =
    useMemo(
      () =>
        getHistoryStats(
          property,
          request.history,
        ),
      [
        property,
        request.history,
      ],
    );

  const sameDay =
    Boolean(
      stats &&
        new Set(
          stats.entries.map(
            (
              entry,
            ) =>
              dateKey(
                entry.createdAt,
              ),
          ),
        ).size <
          stats.entries
            .length,
    );

  useEffect(() => {
    if (
      stats?.hasMismatch
    ) {
      console.warn(
        "Price history latest entry does not match the property current price.",
        {
          propertyId:
            property.id,
        },
      );
    }
  }, [
    property.id,
    stats?.hasMismatch,
  ]);

  if (!expanded) {
    return null;
  }

  if (
    request.error
  ) {
    return (
      <section
        id="price-history-panel"
        className={`${styles.historyCard} ${styles.historyCompact}`}
        role="region"
        aria-labelledby="price-history-title"
      >
        <div>
          <p
            className={
              styles.sectionEyebrow
            }
          >
            {t(
              "property.priceHistoryEyebrow",
            )}
          </p>

          <h2
            id="price-history-title"
            className={
              styles.sectionTitle
            }
          >
            {t(
              "property.priceHistoryTitle",
            )}
          </h2>
        </div>

        <p
          className={
            styles.historyStatus
          }
        >
          {t(
            "property.priceHistoryUnavailable",
          )}
        </p>
      </section>
    );
  }

  if (
    !request.history ||
    !stats
  ) {
    return null;
  }

  const {
    entries,
    original,
    latest,
    current,
    sameCurrency,
    difference,
    percentage,
  } = stats;

  const hasChange =
    difference !== null &&
    difference !== 0;

  const decrease =
    Boolean(
      difference &&
        difference <
          0,
    );

  const newestFirst =
    [
      ...entries,
    ].reverse();

  if (
    entries.length ===
    1
  ) {
    return (
      <section
        id="price-history-panel"
        className={
          styles.historyCard
        }
        role="region"
        aria-labelledby="price-history-title"
      >
        <div
          className={
            styles.historyHeading
          }
        >
          <div>
            <p
              className={
                styles.sectionEyebrow
              }
            >
              {t(
                "property.priceHistoryEyebrow",
              )}
            </p>

            <h2
              id="price-history-title"
              className={
                styles.sectionTitle
              }
            >
              {t(
                "property.priceHistoryTitle",
              )}
            </h2>
          </div>
        </div>

        <div
          className={
            styles.historySingle
          }
        >
          <span>
            {t(
              "property.originalListingPrice",
            )}
          </span>

          <strong>
            {formatMoney(
              original.price,
              original.currency,
            )}
          </strong>

          <time
            dateTime={
              original.createdAt
            }
          >
            {formatDate(
              original.createdAt,
              {
                day:
                  "numeric",

                month:
                  "short",

                year:
                  "numeric",
              },
            )}
          </time>
        </div>

        <p
          className={
            styles.historyStatus
          }
        >
          {t(
            "property.noPriceChanges",
          )}
        </p>
      </section>
    );
  }

  return (
    <section
      id="price-history-panel"
      className={
        styles.historyCard
      }
      role="region"
      aria-labelledby="price-history-title"
    >
      <div
        className={
          styles.historyHeading
        }
      >
        <div>
          <p
            className={
              styles.sectionEyebrow
            }
          >
            {t(
              "property.priceHistoryEyebrow",
            )}
          </p>

          <h2
            id="price-history-title"
            className={
              styles.sectionTitle
            }
          >
            {t(
              "property.priceHistoryTitle",
            )}
          </h2>

          <p
            className={
              styles.historyCopy
            }
          >
            {t(
              "property.priceHistoryCopy",
            )}
          </p>
        </div>

        {sameCurrency &&
          hasChange && (
          <span
            className={`${styles.historyDirection} ${
              decrease
                ? styles.historyDown
                : styles.historyUp
            }`}
          >
            {decrease ? (
              <TrendingDown
                size={15}
              />
            ) : (
              <TrendingUp
                size={15}
              />
            )}

            {decrease
              ? t(
                  "property.priceReduced",
                )
              : t(
                  "property.priceIncreased",
                )}

            <Percentage
              percentage={
                percentage ||
                0
              }
              decrease={
                decrease
              }
            />
          </span>
        )}
      </div>

      <div
        className={
          styles.historySummary
        }
      >
        <div>
          <small>
            {t(
              "property.originalPrice",
            )}
          </small>

          <strong>
            {formatMoney(
              original.price,
              original.currency,
            )}
          </strong>
        </div>

        <div>
          <small>
            {t(
              "property.currentPrice",
            )}
          </small>

          <strong>
            {formatMoney(
              current.price,
              current.currency,
            )}
          </strong>
        </div>

        {sameCurrency &&
          hasChange && (
          <div
            className={
              decrease
                ? styles.historyDown
                : styles.historyUp
            }
          >
            <small>
              {t(
                "property.priceChange",
              )}
            </small>

            <strong>
              {decrease
                ? "−"
                : "+"}

              {formatMoney(
                Math.abs(
                  difference ||
                    0,
                ),
                current.currency,
              )}
            </strong>

            <span>
              <Percentage
                percentage={
                  percentage ||
                  0
                }
                decrease={
                  decrease
                }
              />
            </span>
          </div>
        )}

        <div>
          <small>
            {t(
              "property.priceUpdates",
            )}
          </small>

          <strong>
            {t(
              "property.priceHistoryUpdates",
              {
                count:
                  entries.length -
                  1,
              },
            )}
          </strong>
        </div>
      </div>

      {!sameCurrency && (
        <p
          className={
            styles.historyCurrencyAlert
          }
        >
          <Minus
            size={15}
          />

          {t(
            "property.currencyChangedHistory",
          )}
        </p>
      )}

      {sameCurrency &&
        !stats.hasMismatch && (
        <PriceHistoryChart
          entries={
            entries
          }
          sameDay={
            sameDay
          }
        />
      )}

      <ol
        className={
          styles.historyTimeline
        }
      >
        {newestFirst.map(
          (
            entry,
          ) => (
            <li
              key={
                entry.id
              }
              className={
                entry.id ===
                latest.id
                  ? styles.historyTimelineCurrent
                  : ""
              }
            >
              <span
                className={
                  styles.historyDot
                }
                aria-hidden="true"
              />

              <div
                className={
                  styles.historyEntry
                }
              >
                <time
                  dateTime={
                    entry.createdAt
                  }
                >
                  {formatDate(
                    entry.createdAt,
                    sameDay
                      ? {
                          day:
                            "numeric",

                          month:
                            "short",

                          year:
                            "numeric",

                          hour:
                            "2-digit",

                          minute:
                            "2-digit",
                        }
                      : {
                          day:
                            "numeric",

                          month:
                            "short",

                          year:
                            "numeric",
                        },
                  )}
                </time>

                <strong>
                  {formatMoney(
                    entry.price,
                    entry.currency,
                  )}
                </strong>

                <TimelineChange
                  current={
                    entry
                  }
                  previous={
                    entry.previous
                  }
                />
              </div>
            </li>
          ),
        )}
      </ol>
    </section>
  );
}