"use client";

import Link from "next/link";
import { ArrowRight, Check, Compass, GitCompare, House, Map, MapPin, MessageCircle, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { apiMessage, propertiesApi } from "@/lib/api";
import type { Property } from "@/types/models";
import { PropertyCard, PropertySkeleton } from "./property-card";
import { SearchForm } from "./search-form";
import { useAuth } from "@/context/auth-context";
import { isPublicProperty } from "./property-presentation";

type StoryId = "why" | "what" | "armenia" | "about";
type Story = { id: StoryId; icon: typeof Compass; title: string; summary: string; action: string; tone: string };

const stories: Story[] = [
  { id: "why", icon: Compass, title: "Why Rentora", summary: "A calmer, property-first way to explore homes without marketplace noise.", action: "Explore homes", tone: "is-sand" },
  { id: "what", icon: House, title: "What is Rentora", summary: "An Armenian real-estate platform for finding, comparing, mapping and contacting owners.", action: "See how search works", tone: "is-cream" },
  { id: "armenia", icon: MapPin, title: "Built for Armenia", summary: "Discover homes across Armenia through local search and map-based browsing.", action: "Open the map", tone: "is-map" },
  { id: "about", icon: Sparkles, title: "The story behind Rentora", summary: "An independent product focused on making a home search more considered.", action: "Read the story", tone: "is-dark" },
];

const benefits = [
  [Map, "Search on the map", "See available homes directly by location, then search the exact area you are viewing."],
  [GitCompare, "Compare properties", "Put two homes side by side to compare price, area, rooms and important details."],
  [MessageCircle, "Talk directly", "Start a conversation with the listing owner when a place feels right."],
] as const;

export function HomeView() {
  const { user, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const closeStoryRef = useRef<HTMLButtonElement>(null);
  const load = () => { setLoading(true); propertiesApi.all().then((items) => setProperties(items.filter(isPublicProperty))).catch((reason) => setError(apiMessage(reason))).finally(() => setLoading(false)); };

  useEffect(() => { if (authLoading) return; void Promise.resolve().then(user ? load : () => setLoading(false)); }, [authLoading, user]);
  useEffect(() => {
    if (!activeStory) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setActiveStory(null); }
      if (event.key === "Tab") {
        const dialog = document.querySelector<HTMLElement>(".home-story-dialog");
        const focusable = dialog ? Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')) : [];
        if (!focusable.length) return;
        const first = focusable[0]; const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.body.style.overflow = "hidden";
    window.setTimeout(() => closeStoryRef.current?.focus(), 0);
    document.addEventListener("keydown", closeOnKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", closeOnKey); };
  }, [activeStory]);
  const ActiveStoryIcon = activeStory?.icon;

  return <>
    <section className="hero-section home-hero relative bg-[#211b17] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden"><div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(184,149,104,.42),transparent_30%),radial-gradient(circle_at_88%_0%,rgba(111,80,54,.3),transparent_26%)]"/></div>
      <div className="hero-content shell relative z-10"><div className="hero-editorial-grid relative z-30"><div><p className="eyebrow !text-xs !tracking-[.22em] !text-[#e8d2b1]"><Sparkles className="mr-2 inline" size={15}/> A better way to rent</p><h1 className="mt-5 max-w-3xl text-5xl font-bold leading-[.94] tracking-[-.075em] sm:text-7xl">A place that feels like <span className="text-[#e8d2b1]">yours.</span></h1><p className="mt-7 max-w-xl text-lg leading-8 text-stone-300">Find thoughtfully listed homes across Armenia. Simple search, direct conversations, and no noise.</p><div className="mt-9"><SearchForm/></div></div><aside className="hero-side-story"><div className="hero-side-window"><span className="text-[11px] font-black uppercase tracking-[.18em] text-[#e7c89f]">Thoughtful renting</span><h2>Real homes.<br/>Real people.</h2><p>Filter what matters, compare the details and speak directly with the person who listed the home.</p><div className="hero-side-points"><span>Search with intent</span><span>Decide with context</span></div></div><div className="hero-side-stats"><div><strong>01</strong><span>Simple discovery</span></div><div><strong>02</strong><span>Direct conversations</span></div></div></aside></div></div>
    </section>

    <section className="home-story-section"><div className="shell"><div className="home-section-intro"><div><p className="eyebrow">The Rentora approach</p><h2>A more useful place to start.</h2></div><p>Everything is built around a clearer path from first search to a conversation about a home.</p></div><div className="home-story-grid">{stories.map((story) => { const Icon = story.icon; return <button type="button" className={`home-story-card ${story.tone}`} onClick={() => setActiveStory(story)} key={story.id} aria-haspopup="dialog"><span className="home-story-icon"><Icon size={21}/></span><span className="home-story-copy"><strong>{story.title}</strong><small>{story.summary}</small></span><span className="home-story-action">Learn more <ArrowRight size={15}/></span></button>; })}</div></div></section>

    <section className="home-section homes-section"><div className="shell"><div className="page-heading"><div><p className="eyebrow">Fresh listings</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Homes worth seeing</h1><p className="home-heading-copy">Recently added homes, ready to explore in more detail.</p></div><Link href="/properties" className="hidden items-center gap-2 font-semibold text-[#a77d54] sm:flex">See all homes <ArrowRight size={17}/></Link></div>{!user && !authLoading ? <div className="mt-10 rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center shadow-sm"><p className="font-semibold text-stone-900">Sign in to view the live Rentora listings.</p><Link href="/login" className="btn-primary mt-5">Log in</Link></div> : error ? <ErrorBlock message={error} retry={load}/> : <div className="listing-grid">{loading ? [1, 2, 3].map((item) => <PropertySkeleton key={item}/>) : properties.slice(0, 3).map((property) => <PropertyCard key={property.id} property={property}/>)}</div>}{user && !loading && !error && !properties.length && <Empty label="No active homes are available yet."/>}</div></section>

    <section className="home-section home-benefits-section"><div className="shell"><div className="home-section-intro home-feature-intro"><div><p className="eyebrow">Useful by design</p><h2>Tools for the next decision.</h2></div><p>Rentora’s product features help you understand a listing before you contact its owner.</p></div><div className="home-feature-grid">{benefits.map(([Icon, title, text]) => <div className="home-feature-card" key={title}><span><Icon size={21}/></span><h3>{title}</h3><p>{text}</p></div>)}</div></div></section>

    <section className="home-section home-cta-section"><div className="shell"><div className="home-listing-cta"><div><p>Ready to list?</p><h2>Share a home with the right person.</h2><span>Give your listing a clear place to be found, compared and contacted.</span></div><Link className="home-listing-cta-action" href="/properties/create">Create a listing <ArrowRight size={17}/></Link></div></div></section>

    {activeStory && ActiveStoryIcon && <StoryDialog story={activeStory} Icon={ActiveStoryIcon} closeRef={closeStoryRef} onClose={() => setActiveStory(null)}/>}
  </>;
}

function StoryDialog({ story, Icon, closeRef, onClose }: { story: Story; Icon: Story["icon"]; closeRef: React.RefObject<HTMLButtonElement | null>; onClose: () => void }) {
  const href = story.id === "armenia" ? "/map" : story.id === "why" ? "/properties" : story.id === "what" ? "/search" : "/properties";
  return <div className="home-story-backdrop" role="presentation" onMouseDown={onClose}><section className="home-story-dialog" role="dialog" aria-modal="true" aria-labelledby="home-story-title" aria-describedby="home-story-intro" onMouseDown={(event) => event.stopPropagation()}><div className="home-story-dialog-top"><div><span className="home-story-dialog-icon"><Icon size={22}/></span><p className="eyebrow">The Rentora approach</p></div><button ref={closeRef} type="button" className="home-story-close" onClick={onClose} aria-label="Close"><X size={19}/></button></div><h2 id="home-story-title">{story.title}</h2><StoryContent id={story.id}/><div className="home-story-dialog-footer"><Link href={href} className="btn-primary" onClick={onClose}>{story.action} <ArrowRight size={16}/></Link><button type="button" className="home-story-close-text" onClick={onClose}>Close</button></div></section></div>;
}

function StoryContent({ id }: { id: StoryId }) {
  if (id === "why") return <><p id="home-story-intro" className="home-story-lead">Rentora started from a simple frustration: finding property in Armenia often means broad marketplaces, noisy listings and details that should already be clear.</p><StorySection title="Property-first, not general classifieds"><p>Important information — exact location, price per square meter, parking, amenities, building details and condition — should be easier to understand before a person has to ask.</p><p>Rentora is designed around property discovery and decisions, not around making real estate one category among many unrelated listings.</p></StorySection><StorySection title="What Rentora tries to improve"><ChipList items={["Clearer property information", "Map-first discovery", "Better filters", "Property comparison", "Direct communication with owners", "Less marketplace noise", "Transparent property details"]}/></StorySection><p className="home-story-closing">The goal is to make choosing a home in Armenia clearer, faster and more informed.</p></>;
  if (id === "what") return <><p id="home-story-intro" className="home-story-lead">Rentora is an Armenian real-estate platform for buying and renting property, with the tools needed to understand a listing before contacting its owner.</p><StorySection title="What you can do today"><ChipList items={["Browse properties", "Advanced search filters", "Map search", "Save favorites", "Compare properties", "Direct chat", "Manage listings", "Reports"]}/></StorySection><StorySection title="A listing can explain more"><p>Listings can include price and currency, city and precise location, photos, area, rooms, bedrooms, bathrooms, floor, total floors, construction year, building type, condition and amenities.</p><div className="home-story-mini-grid"><MiniFact value="Map" label="Precise locations"/><MiniFact value="Compare" label="Price, area and rooms"/><MiniFact value="Owner" label="Listing management"/></div></StorySection><StorySection title="Publishing and owner tools"><p>New listings can go through admin moderation before becoming publicly available. Owners can manage or archive their listings and view their own properties on a map.</p></StorySection><StorySection title="Where Rentora is going" kicker="Roadmap · not live features"><p>Future direction includes price-per-square-meter insights, market analytics, saved search alerts, listing quality signals, nearby infrastructure, promoted listings and price history.</p></StorySection></>;
  if (id === "armenia") return <><p id="home-story-intro" className="home-story-lead">Rentora is intentionally Armenia-first: a focused product for the way people here search for homes, rather than a shallow attempt to support every country at once.</p><StorySection title="Starting locally"><div className="home-story-city-grid"><span>Gyumri</span><span>Yerevan</span><span>Vanadzor</span><span>Other Armenian cities</span></div><p>Local city filters, address search and map discovery make location part of the decision. Rentora supports both buying and renting homes.</p></StorySection><StorySection title="A local foundation"><p>Focusing on Armenia first makes it possible to build useful local property information over time — without claiming that every city already has listings.</p><ChipList items={["Armenia-focused map discovery", "Local address search", "Exact property locations", "Buying and renting"]}/></StorySection><StorySection title="Long-term value" kicker="Future direction"><p>As the product grows, Rentora can develop local insights such as price trends, price per square meter, listing history, market activity and neighbourhood context. These are directions, not current analytics.</p></StorySection></>;
  return <><p id="home-story-intro" className="home-story-lead">Rentora is an independent project created by Volodya Markosyan from Gyumri, Armenia, with a simple idea: build a more focused and useful real-estate platform for Armenia.</p><StorySection title="Built step by step"><p>The project gradually grew into a full-stack product with authentication, property listings, image uploads, favorites, reports, comparison, WebSocket messaging, owner tools, admin authentication, moderation, map-based search, precise locations and property filters.</p><ChipList items={["Authentication", "Listings & image uploads", "Favorites & reports", "Comparison & chat", "Owner tools", "Admin moderation", "Map search", "Precise locations"]}/></StorySection><StorySection title="Built from Gyumri" highlight><p>Rentora did not begin with a large company, development team or major funding. It is being built feature by feature, with the aim of proving that a focused local product can grow from a small beginning.</p></StorySection><StorySection title="A real product, not only a demo"><p>The goal is to launch publicly, bring in real listings and users, observe how people actually use the product, and improve it from real feedback.</p></StorySection></>;
}

function StorySection({ title, kicker, highlight = false, children }: { title: string; kicker?: string; highlight?: boolean; children: React.ReactNode }) { return <section className={`home-story-detail-section ${highlight ? "is-highlight" : ""}`}>{kicker && <p className="home-story-section-kicker">{kicker}</p>}<h3>{title}</h3>{children}</section>; }
function ChipList({ items }: { items: string[] }) { return <ul className="home-story-chip-list">{items.map((item) => <li key={item}><Check size={13}/>{item}</li>)}</ul>; }
function MiniFact({ value, label }: { value: string; label: string }) { return <div><strong>{value}</strong><span>{label}</span></div>; }

export function Empty({ label }: { label: string }) { return <div className="mt-10 rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center"><p className="font-semibold">{label}</p><p className="mt-2 text-sm text-stone-500">Try changing your filters or check back soon.</p></div>; }
export function ErrorBlock({ message, retry }: { message: string; retry: () => void }) { return <div className="mt-10 rounded-3xl border border-rose-100 bg-rose-50 p-7"><p className="font-semibold text-rose-700">{message}</p><button onClick={retry} className="btn-secondary mt-4 text-sm">Try again</button></div>; }
