"use client";

import {
  usePathname,
} from "next/navigation";

import {
  AuthProvider,
} from "@/context/auth-context";

import {
  CompareProvider,
} from "@/context/compare-context";

import {
  AdminAuthProvider,
} from "@/context/admin-auth-context";

import {
  I18nProvider,
  useI18n,
} from "@/context/i18n-context";

import {
  RentoraAiProvider,
} from "@/context/rentora-ai-context";

import {
  SubscriptionProvider,
} from "@/context/subscription-context";

import {
  AppShell,
} from "./site-chrome";

import {
  HomeView,
} from "./home-view";

import {
  AuthView,
  CreatePropertyView,
  DetailView,
  EditPropertyView,
  MessagesView,
  NeedLogin,
  ProfileView,
} from "./views";

import {
  ListingsView,
} from "./listings-view";

import {
  CompareBar,
} from "./compare-bar";

import {
  CompareView,
} from "./compare-view";

import {
  SearchView,
} from "./search-view";

import {
  MapSearchView,
} from "./map-search-view";

import {
  AdminPanel,
} from "./admin-panel";

import {
  SupportView,
} from "./support-view";

import {
  AccountBlockedPage,
} from "./account-blocked-page";

import {
  RentoraAiPanel,
} from "./rentora-ai-panel";

import {
  RentoraAiFloatingButton,
} from "./rentora-ai-floating-button";

import {
  PropertyAnalyticsView,
} from "./property-analytics-view";

import {
  SubscriptionPage,
} from "./subscription-page";

export function RentoraClient() {
  return (
    <I18nProvider>
      <LocalizedRentoraClient />
    </I18nProvider>
  );
}

function LocalizedRentoraClient() {
  const { t } =
    useI18n();

  const path =
    usePathname();

  const segments =
    path.split("/");

  if (
    path === "/admin" ||
    path.startsWith(
      "/admin/",
    )
  ) {
    return (
      <AdminAuthProvider>
        <AdminPanel />
      </AdminAuthProvider>
    );
  }

  const isAnalyticsPage =
    segments[1] ===
      "my-properties" &&
    Boolean(
      segments[2],
    ) &&
    segments[3] ===
      "analytics";

  return (
    <AuthProvider>
      <SubscriptionProvider>
        <CompareProvider>
          <RentoraAiProvider>
            <AppShell>
              {path === "/" ? (
                <HomeView />
              ) : path ===
                "/account-blocked" ? (
                <AccountBlockedPage />
              ) : path ===
                  "/login" ||
                path ===
                  "/register" ||
                path ===
                  "/verify-email" ||
                path ===
                  "/forgot-password" ? (
                <AuthView
                  mode={path.slice(
                    1,
                  )}
                />
              ) : path ===
                "/search" ? (
                <SearchView />
              ) : path ===
                "/map" ? (
                <MapSearchView />
              ) : path ===
                "/my-properties/map" ? (
                <NeedLogin>
                  <MapSearchView
                    scope="mine"
                  />
                </NeedLogin>
              ) : isAnalyticsPage ? (
                <NeedLogin>
                  <PropertyAnalyticsView
                    id={
                      segments[2]
                    }
                  />
                </NeedLogin>
              ) : path ===
                "/compare" ? (
                <CompareView />
              ) : path ===
                "/support" ? (
                <NeedLogin>
                  <SupportView />
                </NeedLogin>
              ) : path ===
                "/subscription" ? (
                <SubscriptionPage />
              ) : path ===
                  "/properties" ||
                path ===
                  "/favorites" ||
                path ===
                  "/my-properties" ? (
                <ListingsView
                  kind={path.slice(
                    1,
                  )}
                />
              ) : path ===
                "/properties/create" ? (
                <CreatePropertyView />
              ) : path ===
                "/messages" ? (
                <MessagesView />
              ) : path ===
                "/profile" ? (
                <ProfileView />
              ) : segments[1] ===
                  "properties" &&
                segments[3] ===
                  "edit" ? (
                <EditPropertyView
                  id={
                    segments[2]
                  }
                />
              ) : path.startsWith(
                  "/properties/",
                ) ? (
                <DetailView
                  id={
                    segments[2]
                  }
                />
              ) : (
                <div className="shell py-24">
                  <h1 className="text-4xl font-black">
                    {t(
                      "property.notFound",
                    )}
                  </h1>
                </div>
              )}

              {path !==
                "/compare" &&
                path !==
                  "/account-blocked" && (
                  <CompareBar />
                )}
            </AppShell>

            <RentoraAiPanel />

            <RentoraAiFloatingButton />
          </RentoraAiProvider>
        </CompareProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}