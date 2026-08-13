"use client";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/context/auth-context";
import { AppShell } from "./site-chrome";
import { HomeView } from "./home-view";
import { AuthView, CreatePropertyView, DetailView, EditPropertyView, ListingsView, MessagesView, NeedLogin, ProfileView } from "./views";
import { CompareProvider } from "@/context/compare-context";
import { CompareBar } from "./compare-bar";
import { CompareView } from "./compare-view";
import { SearchView } from "./search-view";
import { MapSearchView } from "./map-search-view";
import { AdminAuthProvider } from "@/context/admin-auth-context";
import { AdminPanel } from "./admin-panel";

export function RentoraClient() {
  const path = usePathname();
  const segments = path.split("/");
  if (path === "/admin" || path.startsWith("/admin/")) return <AdminAuthProvider><AdminPanel/></AdminAuthProvider>;
  return <AuthProvider><CompareProvider><AppShell>{path === "/" ? <HomeView/> : path === "/login" || path === "/register" || path === "/verify-email" || path === "/forgot-password" ? <AuthView mode={path.slice(1)}/> : path === "/search" ? <SearchView/> : path === "/map" ? <MapSearchView/> : path === "/my-properties/map" ? <NeedLogin><MapSearchView scope="mine"/></NeedLogin> : path === "/compare" ? <CompareView/> : path === "/properties" || path === "/favorites" || path === "/my-properties" ? <ListingsView kind={path.slice(1)}/> : path === "/properties/create" ? <CreatePropertyView/> : path === "/messages" ? <MessagesView/> : path === "/profile" ? <ProfileView/> : segments[1] === "properties" && segments[3] === "edit" ? <EditPropertyView id={segments[2]}/> : path.startsWith("/properties/") ? <DetailView id={segments[2]}/> : <div className="shell py-24"><h1 className="text-4xl font-black">Page not found</h1></div>}<CompareBar/></AppShell></CompareProvider></AuthProvider>;
}
