"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Eye,
  Heart,
  LockKeyhole,
  MessageCircle,
  Percent,
} from "lucide-react";

import {
  apiMessage,
  propertiesApi,
} from "@/lib/api";

import {
  analyticsApi,
} from "@/lib/analytics-api";

import type {
  Property,
  PropertyAnalytics,
  PropertyAnalyticsChartPoint,
} from "@/types/models";

import {
  categoryLabels,
  cityOf,
  priceOf,
} from "./property-presentation";

import { useI18n } from "@/context/i18n-context";
import { useSubscription } from "@/context/subscription-context";

type AnalyticsPeriodKey =
  | "today"
  | "week"
  | "month"
  | "total";

type ChartItem = {
  date: string;
  label: string;
  views: number;
};

function formatDate(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildChartData(
  chart: PropertyAnalyticsChartPoint[],
): ChartItem[] {
  const values = new Map(
    chart.map((item) => [
      String(item.date).slice(0, 10),
      Number(item.views),
    ]),
  );

  const formatter =
    new Intl.DateTimeFormat(
      undefined,
      {
        weekday: "short",
      },
    );

  return Array.from(
    {
      length: 7,
    },
    (_, index) => {
      const date = new Date();

      date.setHours(
        12,
        0,
        0,
        0,
      );

      date.setDate(
        date.getDate() -
          (6 - index),
      );

      const key =
        formatDate(date);

      return {
        date: key,
        label:
          formatter.format(date),
        views:
          values.get(key) ?? 0,
      };
    },
  );
}

function formatNumber(
  value: number,
) {
  return new Intl.NumberFormat(
    undefined,
  ).format(value);
}

function formatPercent(
  value: number,
) {
  return `${new Intl.NumberFormat(
    undefined,
    {
      maximumFractionDigits: 2,
    },
  ).format(value)}%`;
}

function AnalyticsSkeleton() {
  return (
    <main className="min-h-screen bg-[#f4efe8] pb-24 pt-8 sm:pt-10">
      <div className="shell">
        <div className="skeleton h-6 w-44 rounded-full" />

        <div className="skeleton mt-6 h-56 rounded-[32px]" />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="skeleton h-40 rounded-[24px]"
              />
            ),
          )}
        </div>

        <div className="skeleton mt-6 h-[380px] rounded-[28px]" />
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="rounded-[24px] border border-[#e3d8cc] bg-[#fffdf9] p-5 shadow-[0_14px_32px_rgba(62,43,29,.07)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[.16em] text-[#8b7665]">
            {label}
          </p>

          <strong className="mt-4 block text-3xl font-black tracking-[-.06em] text-[#30231b] sm:text-4xl">
            {value}
          </strong>
        </div>

        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#efe4d7] text-[#5a4332]">
          <Icon size={20} />
        </span>
      </div>

      <p className="mt-5 text-sm font-semibold text-[#88786c]">
        {hint}
      </p>
    </article>
  );
}

function ViewsChart({
  items,
}: {
  items: ChartItem[];
}) {
  const maxViews = Math.max(
    ...items.map(
      (item) => item.views,
    ),
    1,
  );

  const total = items.reduce(
    (sum, item) =>
      sum + item.views,
    0,
  );

  return (
    <section className="rounded-[28px] border border-[#e3d8cc] bg-[#fffdf9] p-5 shadow-[0_18px_42px_rgba(62,43,29,.07)] sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[.17em] text-[#927b68]">
            Views
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-[-.05em] text-[#30231b]">
            Last 7 days
          </h2>

          <p className="mt-2 text-sm text-[#8c7b6e]">
            Daily interest in this
            listing.
          </p>
        </div>

        <div className="rounded-2xl bg-[#f1e8dd] px-4 py-3 text-right">
          <span className="block text-[10px] font-black uppercase tracking-[.15em] text-[#927c6b]">
            7 day total
          </span>

          <strong className="mt-1 block text-2xl font-black tracking-[-.05em] text-[#3c2d23]">
            {formatNumber(total)}
          </strong>
        </div>
      </header>

      <div className="mt-10 h-[250px]">
        <div className="grid h-full grid-cols-7 items-end gap-2 sm:gap-4">
          {items.map((item) => {
            const percentage =
              item.views === 0
                ? 2
                : Math.max(
                    7,
                    (item.views /
                      maxViews) *
                      100,
                  );

            return (
              <div
                key={item.date}
                className="flex h-full min-w-0 flex-col justify-end"
              >
                <div className="mb-2 text-center text-xs font-black text-[#5a4332]">
                  {item.views}
                </div>

                <div className="flex h-[190px] items-end">
                  <div
                    title={`${item.date}: ${item.views} views`}
                    className="w-full rounded-t-[14px] bg-[#5a4332] transition-all duration-200 hover:bg-[#392a20]"
                    style={{
                      height: `${percentage}%`,
                      opacity:
                        item.views === 0
                          ? 0.18
                          : 1,
                    }}
                  />
                </div>

                <div className="mt-3 truncate text-center text-[11px] font-bold uppercase tracking-[.08em] text-[#948276]">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PerformanceTable({
  analytics,
}: {
  analytics: PropertyAnalytics;
}) {
  const periods: Array<{
    key: AnalyticsPeriodKey;
    label: string;
  }> = [
    {
      key: "today",
      label: "Today",
    },
    {
      key: "week",
      label: "7 days",
    },
    {
      key: "month",
      label: "30 days",
    },
    {
      key: "total",
      label: "All time",
    },
  ];

  return (
    <section className="rounded-[28px] border border-[#e3d8cc] bg-[#fffdf9] p-5 shadow-[0_18px_42px_rgba(62,43,29,.07)] sm:p-7">
      <header>
        <p className="text-[11px] font-black uppercase tracking-[.17em] text-[#927b68]">
          Performance
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-[-.05em] text-[#30231b]">
          Detailed statistics
        </h2>

        <p className="mt-2 text-sm leading-6 text-[#8c7b6e]">
          Compare listing performance
          across different periods.
        </p>
      </header>

      <div className="mt-7 overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[1.35fr_repeat(4,1fr)] border-b border-[#e7ddd3] pb-4 text-xs font-black uppercase tracking-[.12em] text-[#927f70]">
            <span>Metric</span>

            {periods.map(
              (period) => (
                <span
                  key={period.key}
                  className="text-right"
                >
                  {period.label}
                </span>
              ),
            )}
          </div>

          <AnalyticsRow
            label="Views"
            values={periods.map(
              (period) =>
                formatNumber(
                  analytics.views[
                    period.key
                  ],
                ),
            )}
          />

          <AnalyticsRow
            label="Favorites added"
            values={periods.map(
              (period) =>
                formatNumber(
                  analytics
                    .favorites[
                    period.key
                  ],
                ),
            )}
          />

          <AnalyticsRow
            label="Chats started"
            values={periods.map(
              (period) =>
                formatNumber(
                  analytics.chats[
                    period.key
                  ],
                ),
            )}
          />

          <AnalyticsRow
            label="Favorite conversion"
            values={periods.map(
              (period) =>
                formatPercent(
                  analytics
                    .conversion[
                    period.key
                  ].favorite,
                ),
            )}
          />

          <AnalyticsRow
            label="Chat conversion"
            values={periods.map(
              (period) =>
                formatPercent(
                  analytics
                    .conversion[
                    period.key
                  ].chat,
                ),
            )}
          />
        </div>
      </div>
    </section>
  );
}

function AnalyticsRow({
  label,
  values,
}: {
  label: string;
  values: string[];
}) {
  return (
    <div className="grid grid-cols-[1.35fr_repeat(4,1fr)] items-center border-b border-[#eee6de] py-5 last:border-b-0">
      <strong className="text-sm font-extrabold text-[#49372b]">
        {label}
      </strong>

      {values.map(
        (value, index) => (
          <span
            key={`${label}-${index}`}
            className="text-right text-sm font-bold text-[#655247]"
          >
            {value}
          </span>
        ),
      )}
    </div>
  );
}

export function PropertyAnalyticsView({
  id,
}: {
  id: string;
}) {
  const { t } = useI18n();
  const { subscription } = useSubscription();
  const [
    property,
    setProperty,
  ] =
    useState<Property | null>(
      null,
    );

  const [
    analytics,
    setAnalytics,
  ] =
    useState<PropertyAnalytics | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    locked,
    setLocked,
  ] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    setLocked(false);

    try {
      const properties = await propertiesApi.mine();

      const current =
        properties.find(
          (item) =>
            String(item.id) ===
            String(id),
        );

      if (!current) {
        setProperty(null);
        setAnalytics(null);
        setError(
          "This property was not found in your listings.",
        );

        return;
      }

      setProperty(current);

      if (subscription && !subscription.config.advancedAnalytics) {
        setLocked(true);
        return;
      }

      try {
        setAnalytics(await analyticsApi.property(id));
      } catch (reason) {
        const status = (reason as { response?: { status?: number } }).response?.status;

        if (status === 403) {
          setLocked(true);
          return;
        }

        throw reason;
      }
    } catch (reason) {
      setError(
        apiMessage(reason),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void load();
        },
        0,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [id, subscription]);

  const chart =
    useMemo(
      () =>
        buildChartData(
          analytics?.chart ??
            [],
        ),
      [analytics],
    );

  if (loading) {
    return (
      <AnalyticsSkeleton />
    );
  }

  if (locked && property) {
    return (
      <main className="min-h-screen bg-[#f4efe8] py-12">
        <div className="shell">
          <Link
            href="/my-properties"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-[#5a4332]"
          >
            <ArrowLeft size={16} />
            {t("myListings.backToListings")}
          </Link>

          <section className="analytics-locked-state">
            <span><LockKeyhole size={23} aria-hidden="true" /></span>
            <p className="eyebrow">{t("subscription.currentPlan")}</p>
            <h1>{t("subscription.analyticsLockedTitle")}</h1>
            <p>{t("subscription.analyticsLockedCopy")}</p>
            <Link href="/subscription" className="btn-primary">
              {t("subscription.analyticsLockedAction")}
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (
    error ||
    !property ||
    !analytics
  ) {
    return (
      <main className="min-h-screen bg-[#f4efe8] py-12">
        <div className="shell">
          <Link
            href="/my-properties"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-[#5a4332]"
          >
            <ArrowLeft size={16} />
            My properties
          </Link>

          <section className="mx-auto mt-16 max-w-xl rounded-[28px] border border-[#e3d8cc] bg-[#fffdf9] p-8 text-center shadow-[0_18px_42px_rgba(62,43,29,.08)]">
            <BarChart3
              size={34}
              className="mx-auto text-[#8c7767]"
            />

            <h1 className="mt-5 text-2xl font-black tracking-[-.04em] text-[#30231b]">
              Analytics unavailable
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#8b796d]">
              {error ||
                "We could not load analytics for this property."}
            </p>

            <button
              type="button"
              onClick={() =>
                void load()
              }
              className="mt-7 rounded-2xl bg-[#513d2e] px-5 py-3 text-sm font-black text-white transition hover:bg-[#34261d]"
            >
              Try again
            </button>
          </section>
        </div>
      </main>
    );
  }

  const image =
    property.images?.[0]?.url;

  return (
    <main className="min-h-screen bg-[#f4efe8] pb-24 pt-7 sm:pt-10">
      <div className="shell">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/my-properties"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-[#5a4332] transition hover:text-[#30231b]"
          >
            <ArrowLeft size={16} />
            My properties
          </Link>

          <Link
            href={`/properties/${property.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-[#d5c6b8] bg-[#fffaf4] px-4 py-2.5 text-sm font-extrabold text-[#513d2e] transition hover:bg-white"
          >
            View listing
            <ArrowUpRight
              size={15}
            />
          </Link>
        </div>

        <section className="relative mt-6 overflow-hidden rounded-[32px] bg-[#30231b] text-white shadow-[0_24px_58px_rgba(47,34,23,.2)]">
          <div className="grid md:grid-cols-[1fr_280px]">
            <div className="relative z-10 px-6 py-8 sm:px-9 sm:py-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-[#ebcfae]">
                <BarChart3
                  size={13}
                />
                Property analytics
              </div>

              <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-[-.06em] sm:text-5xl">
                {property.title}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold text-stone-300">
                <span>
                  {cityOf(
                    property.city,
                  )}
                </span>

                <span className="h-1 w-1 rounded-full bg-stone-500" />

                <span>
                  {categoryLabels[
                    property
                      .category
                  ] ||
                    property.category}
                </span>

                <span className="h-1 w-1 rounded-full bg-stone-500" />

                <strong className="text-[#f3d1a9]">
                  {priceOf(
                    property,
                  )}
                </strong>
              </div>

              <p className="mt-5 max-w-2xl text-sm leading-6 text-stone-400">
                Track views,
                favorites, chats and
                conversion for this
                listing.
              </p>
            </div>

            <div className="relative hidden overflow-hidden md:block">
              {image ? (
                <>
                  <img
                    src={image}
                    alt={property.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-r from-[#30231b] via-[#30231b]/35 to-transparent" />
                </>
              ) : (
                <div className="absolute inset-0 bg-[#473629]" />
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Eye}
            label="Total views"
            value={formatNumber(
              analytics.views.total,
            )}
            hint={`${formatNumber(
              analytics.views.today,
            )} today`}
          />

          <StatCard
            icon={Heart}
            label="Favorites"
            value={formatNumber(
              analytics
                .favorites.total,
            )}
            hint={`${formatNumber(
              analytics
                .favorites.today,
            )} added today`}
          />

          <StatCard
            icon={MessageCircle}
            label="Chats started"
            value={formatNumber(
              analytics.chats.total,
            )}
            hint={`${formatNumber(
              analytics.chats.today,
            )} today`}
          />

          <StatCard
            icon={Percent}
            label="Chat conversion"
            value={formatPercent(
              analytics
                .conversion.total
                .chat,
            )}
            hint={`${formatPercent(
              analytics
                .conversion.week
                .chat,
            )} over the last 7 days`}
          />
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
          <ViewsChart
            items={chart}
          />

          <section className="rounded-[28px] bg-[#3b2b21] p-6 text-white shadow-[0_20px_48px_rgba(57,40,28,.18)] sm:p-7">
            <p className="text-[11px] font-black uppercase tracking-[.17em] text-[#d9b991]">
              Engagement
            </p>

            <h2 className="mt-3 text-2xl font-black tracking-[-.05em]">
              How people react
              to your listing
            </h2>

            <p className="mt-3 text-sm leading-6 text-stone-400">
              Conversion shows
              how often a view
              turns into stronger
              interest.
            </p>

            <div className="mt-8 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[.06] p-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-bold text-stone-300">
                    Favorite
                    conversion
                  </span>

                  <strong className="text-2xl font-black tracking-[-.04em] text-[#f0c99b]">
                    {formatPercent(
                      analytics
                        .conversion
                        .total
                        .favorite,
                    )}
                  </strong>
                </div>

                <p className="mt-2 text-xs text-stone-500">
                  Favorites added
                  compared with
                  total views.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[.06] p-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-bold text-stone-300">
                    Chat conversion
                  </span>

                  <strong className="text-2xl font-black tracking-[-.04em] text-[#f0c99b]">
                    {formatPercent(
                      analytics
                        .conversion
                        .total.chat,
                    )}
                  </strong>
                </div>

                <p className="mt-2 text-xs text-stone-500">
                  New conversations
                  compared with
                  total views.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6">
          <PerformanceTable
            analytics={
              analytics
            }
          />
        </div>
      </div>
    </main>
  );
}
