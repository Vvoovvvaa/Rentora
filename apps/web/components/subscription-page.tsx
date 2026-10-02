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
  const { t, formatNumber } = useI18n();
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

  return (
    <article
      className={`subscription-plan-card ${isPlus ? "is-featured" : ""} ${isPro ? "is-premium" : ""} ${isCurrent ? "is-current" : ""}`}
      aria-label={t(`subscription.planNames.${plan.plan}`)}
      aria-current={isCurrent ? "true" : undefined}
    >
      {isPlus && <span className="subscription-plan-tag">{t("subscription.recommended")}</span>}
      <div className="subscription-plan-heading">
        <div>
          <p className="eyebrow">{t("subscription.plan")}</p>
          <h2>{t(`subscription.planNames.${plan.plan}`)}</h2>
        </div>
        <span className="subscription-plan-symbol" aria-hidden="true">
          {isPro ? <Crown size={19} /> : isPlus ? <Sparkles size={18} /> : <HousePlus size={18} />}
        </span>
      </div>

      <div className="subscription-price">
        {plan.price === 0 ? (
          <strong>{t("subscription.freePrice")}</strong>
        ) : (
          <strong>{formatNumber(plan.price)} <span>֏</span></strong>
        )}
        <span>{t("subscription.perMonth")}</span>
      </div>

      <ul className="subscription-features">
        {features.map(({ icon: Icon, label, included }) => (
          <li className={included ? "is-included" : "is-muted"} key={label}>
            <span><Icon size={16} aria-hidden="true" /></span>
            <span>{included ? label : t("subscription.notIncluded", { feature: label })}</span>
            {included && <Check size={16} aria-hidden="true" />}
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={isCurrent ? "subscription-current-button" : `subscription-select-button ${isUnavailable ? "is-unavailable" : ""}`}
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
    <div className="subscription-plan-grid" aria-label={t("subscription.loadingPlans")}>
      {[1, 2, 3].map((item) => (
        <div className="subscription-plan-card subscription-plan-skeleton" key={item}>
          <div className="skeleton h-3 w-16" />
          <div className="skeleton mt-4 h-8 w-28" />
          <div className="skeleton mt-8 h-11 w-32" />
          <div className="mt-8 grid gap-4">{[1, 2, 3, 4].map((line) => <div className="skeleton h-5" key={line} />)}</div>
          <div className="skeleton mt-9 h-12" />
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
    <main className="subscription-page">
      <div className="shell subscription-shell">
        <header className="subscription-hero">
          <div>
            <p className="eyebrow">{t("subscription.eyebrow")}</p>
            <h1>{t("subscription.title")}</h1>
            <p>{t("subscription.copy")}</p>
          </div>
          {subscriptionLoading ? <div className="subscription-status-skeleton skeleton" /> : currentConfig ? (
            <aside className="subscription-current-summary" aria-label={t("subscription.currentPlan")}>
              <div>
                <span>{t("subscription.currentPlan")}</span>
                <strong>{t(`subscription.planNames.${subscription.plan}`)}</strong>
                <p>{t("subscription.activeListings", { count: currentConfig.maxProperties })}</p>
                {currentSummary && <small>{currentSummary}</small>}
              </div>
              <CalendarDays aria-hidden="true" size={19} />
            </aside>
          ) : null}
        </header>

        {notice && <aside className={`subscription-notice is-${notice.tone}`} role="status">
          {notice.tone === "success" && <CheckCircle2 aria-hidden="true" size={18} />}
          <p>{notice.text}</p>
        </aside>}

        {loadingPlans ? <PlansSkeleton /> : plansError ? (
          <section className="subscription-error" role="alert">
            <h2>{t("subscription.unableToLoad")}</h2>
            <p>{t("subscription.planLoadError")}</p>
            <button type="button" className="btn-secondary" onClick={() => void loadPlans()}>{t("common.tryAgain")}</button>
          </section>
        ) : (
          <section className="subscription-plan-grid" aria-label={t("subscription.title")}>
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

        <section className="subscription-footnote">
          <BarChart3 size={18} aria-hidden="true" />
          <p>{t("subscription.analyticsFootnote")}</p>
          {!user && <Link href="/login">{t("subscription.signInToChoose")}</Link>}
        </section>
      </div>
    </main>
  );
}
