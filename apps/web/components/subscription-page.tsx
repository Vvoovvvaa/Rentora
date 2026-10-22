"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Check,
  CheckCircle2,
  Crown,
  HousePlus,
  CalendarDays,
  LoaderCircle,
  SearchCheck,
  Sparkles,
} from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { useSubscription } from "@/context/subscription-context";
import { useI18n } from "@/context/i18n-context";
import { apiMessage, subscriptionApi } from "@/lib/api";
import type { SubscriptionPlan, SubscriptionPlanName } from "@/types/models";
import styles from "./subscription-page.module.css";

type PlanFeature = {
  icon: typeof HousePlus;
  label: string;
  included: boolean;
};

function planOrder(plan: SubscriptionPlan) {
  return { FREE: 0, PLUS: 1, PRO: 2 }[plan.plan];
}

function PlanCard({
  plan,
  currentPlan,
  busyPlan,
  isDevelopment,
  onSelect,
}: {
  plan: SubscriptionPlan;
  currentPlan?: SubscriptionPlanName;
  busyPlan: SubscriptionPlanName | null;
  isDevelopment: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
}) {
  const { t } = useI18n();
  const isCurrent = plan.plan === currentPlan;
  const isPlus = plan.plan === "PLUS";
  const isPro = plan.plan === "PRO";
  const isBusy = busyPlan === plan.plan;
  const isUnavailable = !isDevelopment && plan.price > 0;
  const features: PlanFeature[] = [
    {
      icon: HousePlus,
      label: t("subscription.activeListings", { count: plan.maxProperties }),
      included: true,
    },
    {
      icon: BarChart3,
      label: t("subscription.advancedAnalytics"),
      included: plan.advancedAnalytics,
    },
    {
      icon: Sparkles,
      label: t("subscription.listingBoosts", { count: plan.monthlyBumps }),
      included: plan.monthlyBumps > 0,
    },
    {
      icon: SearchCheck,
      label: t("subscription.prioritySearch"),
      included: plan.prioritySearch,
    },
  ];

  const cardClasses = [
    styles.planCard,
    isPlus ? styles.featured : "",
    isPro ? styles.premium : "",
    isCurrent ? styles.current : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={cardClasses}
      aria-label={t(`subscription.planNames.${plan.plan}`)}
      aria-current={isCurrent ? "true" : undefined}
    >
      {isPlus && (
        <span className={styles.planTag}>
          <Sparkles size={12} aria-hidden="true" />
          {t("subscription.recommended")}
        </span>
      )}

      <div className={styles.planHeading}>
        <div>
          <p className={styles.planEyebrow}>{t("subscription.plan")}</p>
          <h2>{t(`subscription.planNames.${plan.plan}`)}</h2>
        </div>
        <span className={styles.planSymbol} aria-hidden="true">
          {isPro ? <Crown size={19} /> : isPlus ? <Sparkles size={18} /> : <HousePlus size={18} />}
        </span>
      </div>

      <div className={styles.price}>
        {plan.price === 0 ? (
          <strong>{t("subscription.freePrice")}</strong>
        ) : (
          <strong>
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(plan.price / 362.21)}
          </strong>
        )}
        <span>{t("subscription.perMonth")}</span>
      </div>

      <ul className={styles.features}>
        {features.map(({ icon: Icon, label, included }) => (
          <li className={included ? styles.included : styles.muted} key={label}>
            <span className={styles.featureIcon}>
              <Icon size={16} aria-hidden="true" />
            </span>
            <span>{included ? label : t("subscription.notIncluded", { feature: label })}</span>
            {included && <Check className={styles.featureCheck} size={16} aria-hidden="true" />}
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={`${styles.planButton} ${isCurrent ? styles.currentButton : ""} ${isUnavailable ? styles.unavailable : ""}`}
        disabled={isCurrent || Boolean(busyPlan) || isUnavailable}
        onClick={() => onSelect(plan)}
      >
        {isBusy ? <LoaderCircle className="animate-spin" size={17} /> : null}
        {isCurrent
          ? t("subscription.currentPlan")
          : plan.price === 0
            ? t("subscription.freePlan")
            : isDevelopment
              ? t("subscription.activateTestPlan")
              : t("subscription.checkoutComingSoon")}
      </button>
    </article>
  );
}

function PlansSkeleton() {
  const { t } = useI18n();

  return (
    <div
      className={styles.planGrid}
      aria-label={t("subscription.loadingPlans")}
    >
      {[1, 2, 3].map((item) => (
        <div
          className={`${styles.planCard} ${styles.skeletonCard}`}
          key={item}
        >
          <div className={styles.skeletonLineSmall} />
          <div className={styles.skeletonLineMedium} />
          <div className={styles.skeletonLineLarge} />
          <div className={styles.skeletonLines}>
            {[1, 2, 3, 4].map((line) => (
              <div className={styles.skeletonLine} key={line} />
            ))}
          </div>
          <div className={styles.skeletonButton} />
        </div>
      ))}
    </div>
  );
}

export function SubscriptionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { subscription, loading: subscriptionLoading, refresh } = useSubscription();
  const { t, formatDate } = useI18n();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: "success" | "neutral" } | null>(null);
  const [busyPlan, setBusyPlan] = useState<SubscriptionPlanName | null>(null);
  const canTestPurchase = process.env.NODE_ENV === "development";

  const loadPlans = async () => {
    setLoadingPlans(true);
    setPlansError(false);

    try {
      const result = await subscriptionApi.plans();
      setPlans([...result].sort((first, second) => planOrder(first) - planOrder(second)));
    } catch {
      setPlansError(true);
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPlans(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const currentConfig = subscription?.config;
  const currentPlan = subscription?.plan;
  const currentSummary = useMemo(() => {
    if (!subscription || subscription.plan === "FREE") return null;
    if (subscription.status !== "ACTIVE") return t("subscription.subscriptionExpired");
    if (!subscription.expiresAt) return null;
    return subscription.autoRenew
      ? t("subscription.renewsOn", { date: formatDate(subscription.expiresAt) })
      : t("subscription.validUntil", { date: formatDate(subscription.expiresAt) });
  }, [formatDate, subscription, t]);

  const selectPlan = async (plan: SubscriptionPlan) => {
    setNotice(null);

    if (!user) {
      router.push("/login");
      return;
    }

    if (plan.plan === "FREE" || !canTestPurchase) {
      setNotice({ text: t("subscription.checkoutComingSoon"), tone: "neutral" });
      return;
    }

    setBusyPlan(plan.plan);

    try {
      // TODO: Replace this development-only request with a real checkout flow.
      await subscriptionApi.testPurchase(plan.plan);
      await refresh();
      setNotice({ text: t("subscription.testPurchaseSuccess"), tone: "success" });
    } catch (reason) {
      setNotice({ text: apiMessage(reason), tone: "neutral" });
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.heroEyebrow}>
              <span className={styles.eyebrowSparkle} aria-hidden="true"><Sparkles size={13} /></span>
              {t("subscription.eyebrow")}
            </p>
            <h1>{t("subscription.title")}</h1>
            <p className={styles.heroDescription}>{t("subscription.copy")}</p>
            <div className={styles.heroAccent} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.orbitOuter} />
            <div className={styles.orbitInner} />
            <div className={styles.heroMonogram}>R</div>
            <div className={styles.heroSparkle}><Sparkles size={17} /></div>
          </div>

          {subscriptionLoading ? (
            <div className={`${styles.statusSkeleton} ${styles.skeletonCard}`} />
          ) : currentConfig ? (
            <aside
              className={styles.currentSummary}
              aria-label={t("subscription.currentPlan")}
            >
              <div className={styles.summaryTopline}>
                <span>{t("subscription.currentPlan")}</span>
                <CalendarDays aria-hidden="true" size={18} />
              </div>
              <strong>{t(`subscription.planNames.${subscription.plan}`)}</strong>
              <p>{t("subscription.activeListings", { count: currentConfig.maxProperties })}</p>
              <p className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2 text-sm font-semibold text-amber-950">
                <Sparkles size={15} aria-hidden="true" />
                {subscription.boopsCount ?? 0} listing boosts available
              </p>
              {currentSummary && <small>{currentSummary}</small>}
              <span className={styles.summaryShine} aria-hidden="true" />
            </aside>
          ) : null}
        </header>

        {notice && (
          <aside
            className={`${styles.notice} ${notice.tone === "success" ? styles.noticeSuccess : styles.noticeNeutral}`}
            role="status"
          >
            {notice.tone === "success" && <CheckCircle2 aria-hidden="true" size={18} />}
            <p>{notice.text}</p>
          </aside>
        )}

        {loadingPlans ? (
          <PlansSkeleton />
        ) : plansError ? (
          <section className={styles.error} role="alert">
            <h2>{t("subscription.unableToLoad")}</h2>
            <p>{t("subscription.planLoadError")}</p>
            <button type="button" className={styles.retryButton} onClick={() => void loadPlans()}>
              {t("common.tryAgain")}
            </button>
          </section>
        ) : (
          <section
            className={styles.planGrid}
            aria-label={t("subscription.title")}
          >
            {plans.map((plan) => (
              <PlanCard
                busyPlan={busyPlan}
                currentPlan={currentPlan}
                isDevelopment={canTestPurchase}
                key={plan.id}
                onSelect={selectPlan}
                plan={plan}
              />
            ))}
          </section>
        )}

        <section className={styles.footnote}>
          <span className={styles.footnoteIcon}><BarChart3 size={17} aria-hidden="true" /></span>
          <p>{t("subscription.analyticsFootnote")}</p>
          {!user && <Link href="/login">{t("subscription.signInToChoose")}</Link>}
        </section>
      </div>
    </main>
  );
}
