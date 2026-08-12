"use client";

import Link from "next/link";
import { ArrowRight, Building2, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { apiMessage, propertiesApi } from "@/lib/api";
import type { Property } from "@/types/models";
import { PropertyCard, PropertySkeleton } from "./property-card";
import { SearchForm } from "./search-form";
import { useAuth } from "@/context/auth-context";
import { isPublicProperty } from "./property-presentation";

export function HomeView() {
  const { user, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = () => { setLoading(true); propertiesApi.all().then((items) => setProperties(items.filter(isPublicProperty))).catch((reason) => setError(apiMessage(reason))).finally(() => setLoading(false)); };
  useEffect(() => { if (authLoading) return; void Promise.resolve().then(user ? load : () => setLoading(false)); }, [authLoading, user]);
  const benefits = [[Building2, "A clearer search", "Browse real listings and use only filters backed by Rentora’s API."], [ShieldCheck, "Built around trust", "Email verification protects the property-creation flow."], [MessageCircle, "Talk directly", "Start a conversation with a property owner when a place feels right."]];
  return <>
    <section className="hero-section relative bg-[#211b17] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden"><div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(184,149,104,.42),transparent_30%),radial-gradient(circle_at_88%_0%,rgba(111,80,54,.3),transparent_26%)]"/></div>
      <div className="hero-content shell relative z-10">
        <div className="relative z-30"><p className="eyebrow !text-xs !tracking-[.22em] !text-[#e8d2b1]"><Sparkles className="mr-2 inline" size={15}/> A better way to rent</p><h1 className="mt-5 max-w-3xl text-5xl font-bold leading-[.94] tracking-[-.075em] sm:text-7xl">A place that feels like <span className="text-[#e8d2b1]">yours.</span></h1><p className="mt-7 max-w-xl text-lg leading-8 text-stone-300">Find thoughtfully listed homes across Armenia. Simple search, direct conversations, and no noise.</p><div className="mt-10"><SearchForm/></div></div>
      </div>
    </section>
    <section className="home-section homes-section"><div className="shell"><div className="page-heading"><div><p className="eyebrow">Discover</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Homes worth seeing</h1></div><Link href="/properties" className="hidden items-center gap-2 font-semibold text-[#a77d54] sm:flex">See all homes <ArrowRight size={17}/></Link></div>{!user && !authLoading ? <div className="mt-10 rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center shadow-sm"><p className="font-semibold text-stone-900">Sign in to view the live Rentora listings.</p><Link href="/login" className="btn-primary mt-5">Log in</Link></div> : error ? <ErrorBlock message={error} retry={load}/> : <div className="listing-grid">{loading ? [1, 2, 3].map((item) => <PropertySkeleton key={item}/>) : properties.slice(0, 3).map((property) => <PropertyCard key={property.id} property={property}/>)}</div>}{user && !loading && !error && !properties.length && <Empty label="No active homes are available yet."/>}</div></section>
    <section className="home-section home-benefits-section"><div className="shell grid gap-8 md:grid-cols-3">{benefits.map(([Icon, title, text]) => { const Glyph = Icon as typeof Building2; return <div className="rounded-3xl border border-stone-100 p-8 shadow-sm" key={title as string}><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f3eadf] text-[#a77d54]"><Glyph size={21}/></span><h3 className="mt-5 text-lg font-bold">{title as string}</h3><p className="mt-2 leading-7 text-stone-500">{text as string}</p></div>; })}</div></section>
    <section className="home-section home-cta-section"><div className="shell"><div className="rounded-[30px] bg-gradient-to-br from-[#6f5036] to-[#30271f] p-8 text-white shadow-xl shadow-stone-300 md:flex md:items-center md:justify-between md:p-12"><div><p className="text-sm font-bold uppercase tracking-[.15em] text-[#e8d2b1]">Ready to list?</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Share a home with the right person.</h2></div><Link className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#fbf9f5] px-5 py-3 font-bold text-[#513f30] transition hover:-translate-y-0.5 hover:bg-[#e8d2b1] md:mt-0" href="/properties/create">Create a listing <ArrowRight size={17}/></Link></div></div></section>
  </>;
}
export function Empty({ label }: { label: string }) { return <div className="mt-10 rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center"><p className="font-semibold">{label}</p><p className="mt-2 text-sm text-stone-500">Try changing your filters or check back soon.</p></div>; }
export function ErrorBlock({ message, retry }: { message: string; retry: () => void }) { return <div className="mt-10 rounded-3xl border border-rose-100 bg-rose-50 p-7"><p className="font-semibold text-rose-700">{message}</p><button onClick={retry} className="btn-secondary mt-4 text-sm">Try again</button></div>; }
