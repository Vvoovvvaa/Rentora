"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BedDouble, Check, Eye, GitCompare, Heart, Maximize2, MessageCircle, Plus, ShieldCheck, Upload, UserRound } from "lucide-react";
import { apiMessage, authApi, chatApi, propertiesApi, userApi } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { Currency, Property, PropertyCategory, SearchParams } from "@/types/models";
import { PropertyCard, PropertySkeleton, cityOf, labels, priceOf } from "./property-card";
import { Empty, ErrorBlock } from "./home-view";
import { SearchForm } from "./search-form";
import { PhoneInput } from "./phone-input";
import { PropertyGallery } from "./property-gallery";
import { ChatPanel } from "./chat-panel";
import { CustomSelect } from "./custom-select";
import { PropertyCharacteristics, PropertyHighlights } from "./property-highlights";
import { CreatePropertyForm } from "./create-property-form";
import { PropertyReportDialog } from "./property-report-dialog";
import { useCompare } from "@/context/compare-context";
import { getListingLabel } from "./property-presentation";

function NeedLogin({ children }: { children: React.ReactNode }) { const { user, loading } = useAuth(); if (loading) return <div className="shell page-space"><div className="skeleton h-48"/></div>; if (!user) return <div className="shell page-space text-center"><UserRound className="mx-auto text-slate-400" size={38}/><h1 className="mt-5 text-3xl font-bold tracking-tight">Sign in to continue</h1><p className="mt-2 text-slate-500">This part of Rentora uses your secure account.</p><Link href="/login" className="btn-primary mt-6 inline-block">Log in</Link></div>; return <>{children}</>; }
const Input = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => <label className="block text-sm font-semibold text-slate-700"><span className="mb-2 block">{label}</span><input {...props} className={`field ${props.className || ""}`}/></label>;
const Notice = ({ error, success }: { error: string; success: string }) => <>{error && <p className="notice notice-error">{error}</p>}{success && <p className="notice notice-success">{success}</p>}</>;

export function AuthView({ mode }: { mode: string }) { return <div className="auth-page"><div className="auth-orb"/><div className="shell relative flex min-h-[calc(100vh-78px)] items-center justify-center py-12"><div className="soft-card auth-card w-full max-w-lg rounded-3xl p-7 sm:p-10">{mode === "login" ? <Login/> : mode === "register" ? <Register/> : mode === "verify-email" ? <Verify/> : <Forgot/>}</div></div></div>; }
function Login() { const { signIn } = useAuth(); const router = useRouter(); const [gmail, setGmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const submit = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); setError(""); try { await signIn(gmail, password); router.push("/properties"); } catch (reason) { setError(apiMessage(reason)); } finally { setBusy(false); } }; return <><p className="eyebrow">Welcome back</p><h1 className="auth-title">Your next place is waiting.</h1><form onSubmit={submit} className="mt-8 grid gap-5"><Input label="Email" type="email" required value={gmail} onChange={(event) => setGmail(event.target.value)} placeholder="you@example.com"/><Input label="Password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)}/><button disabled={busy} className="btn-primary">{busy ? "Signing in…" : "Log in"}</button></form><Notice error={error} success=""/><div className="mt-7 flex justify-between text-sm"><Link className="font-semibold text-indigo-600" href="/forgot-password">Forgot password?</Link><Link className="font-semibold text-slate-700" href="/register">Create account</Link></div></>; }
function Register() { const { signUp } = useAuth(); const router = useRouter(); const [data, setData] = useState({ name: "", phone: "+374", age: "", gmail: "", password: "" }); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const change = (key: keyof typeof data) => (event: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, [key]: event.target.value }); const submit = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); setError(""); try { await signUp({ ...data, age: Number(data.age) }); router.push("/verify-email"); } catch (reason) { setError(apiMessage(reason)); } finally { setBusy(false); } }; return <><p className="eyebrow">Get started</p><h1 className="auth-title">Find a home that feels right.</h1><form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2"><Input label="Full name" required value={data.name} onChange={change("name")}/><Input label="Age" type="number" min="18" max="99" required value={data.age} onChange={change("age")}/><PhoneInput value={data.phone} onChange={(phone) => setData({ ...data, phone })}/><Input label="Email" type="email" required value={data.gmail} onChange={change("gmail")}/><div className="sm:col-span-2"><Input label="Password" type="password" minLength={8} required value={data.password} onChange={change("password")}/><p className="mt-2 text-xs text-slate-400">Use upper- and lowercase letters, a number and a symbol.</p></div><button disabled={busy} className="btn-primary sm:col-span-2">{busy ? "Creating account…" : "Create account"}</button></form><Notice error={error} success=""/><p className="mt-7 text-sm text-slate-500">Already have an account? <Link className="font-semibold text-indigo-600" href="/login">Log in</Link></p></>; }
function Verify() { const [email, setEmail] = useState(""); const [code, setCode] = useState(""); const [error, setError] = useState(""); const [success, setSuccess] = useState(""); const send = async () => { try { setError(""); setSuccess((await authApi.sendCode(email)).message || "Code sent."); } catch (reason) { setError(apiMessage(reason)); } }; const verify = async (event: React.FormEvent) => { event.preventDefault(); try { setError(""); setSuccess((await authApi.verify({ gmail: email, code })).message || "Email verified."); } catch (reason) { setError(apiMessage(reason)); } }; return <><p className="eyebrow">Account security</p><h1 className="auth-title">Verify your email</h1><p className="mt-3 text-slate-500">Request a verification code, then enter it below.</p><form onSubmit={verify} className="mt-8 grid gap-5"><Input label="Email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)}/><Input label="Verification code" required value={code} onChange={(event) => setCode(event.target.value)}/><button className="btn-primary">Verify email</button></form><button onClick={send} className="mt-5 text-sm font-semibold text-indigo-600">Send verification code</button><Notice error={error} success={success}/></>; }
function Forgot() { const [gmail, setGmail] = useState(""); const [code, setCode] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [success, setSuccess] = useState(""); const submit = async (event: React.FormEvent) => { event.preventDefault(); try { setError(""); setSuccess(!code ? (await authApi.forgot(gmail)).message || "Check your email for a code." : (await authApi.newPassword({ code, newPassword: password })).message || "Password changed."); } catch (reason) { setError(apiMessage(reason)); } }; return <><p className="eyebrow">Password recovery</p><h1 className="auth-title">Reset your password</h1><p className="mt-3 text-sm leading-6 text-slate-500">Request a code with your verified email, then enter a new password.</p><form onSubmit={submit} className="mt-8 grid gap-5"><Input label="Email" type="email" required value={gmail} onChange={(event) => setGmail(event.target.value)}/><Input label="Code (leave empty to request one)" value={code} onChange={(event) => setCode(event.target.value)}/>{code && <Input label="New password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)}/>}<button className="btn-primary">{code ? "Set new password" : "Send reset code"}</button></form><Notice error={error} success={success}/></>; }

export function ListingsView({ kind }: { kind: string }) { return <NeedLogin><Listings kind={kind}/></NeedLogin>; }
function Listings({ kind }: { kind: string }) { const params = useSearchParams(); const [items, setItems] = useState<Property[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const title = kind === "favorites" ? "Saved homes" : kind === "my-properties" ? "My listings" : kind === "search" ? "Search results" : "Explore homes"; const load = () => { setLoading(true); setError(""); let request: Promise<Property[]>; if (kind === "search") { const data: SearchParams = {}; params.forEach((value, key) => { if (key === "minPrice" || key === "maxPrice" || key === "rooms" || key === "area") data[key] = Number(value); else (data as Record<string, string>)[key] = value; }); request = propertiesApi.search(data); } else if (kind === "my-properties") request = propertiesApi.mine(); else if (kind === "favorites") request = userApi.favorites().then((result) => result.map((favorite) => favorite.property)); else request = propertiesApi.all(); request.then(setItems).catch((reason) => setError(apiMessage(reason))).finally(() => setLoading(false)); }; useEffect(() => { const timer = window.setTimeout(load, 0); return () => window.clearTimeout(timer); }, [kind, params]); return <div className="shell page-space"><div className="page-heading"><div><p className="eyebrow">Rentora listings</p><h1>{title}</h1></div>{kind === "my-properties" && <Link href="/properties/create" className="btn-primary inline-flex items-center gap-2"><Plus size={17}/> Create listing</Link>}</div>{kind === "properties" && <div className="soft-card mt-9 rounded-3xl p-4"><SearchForm compact/></div>}{error ? <ErrorBlock message={error} retry={load}/> : <div className="listing-grid">{loading ? [1, 2, 3, 4, 5, 6].map((item) => <PropertySkeleton key={item}/>) : items.map((property) => kind === "my-properties" ? <ManagedPropertyCard property={property} key={property.id} refresh={load}/> : <PropertyCard property={property} key={property.id} onFavorite={kind === "favorites" ? load : undefined}/>)}</div>}{!loading && !error && !items.length && <Empty label={kind === "favorites" ? "No saved homes yet." : "No properties found."}/>}</div>; }
function ManagedPropertyCard({ property, refresh }: { property: Property; refresh: () => void }) { const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const archive = async () => { setBusy(true); try { await propertiesApi.archive(property.id); refresh(); } catch (reason) { setError(apiMessage(reason)); } finally { setBusy(false); } }; return <div><PropertyCard property={property}/><div className="manage-card"><span>{property.status}</span><div className="flex gap-2"><Link href={`/properties/${property.id}/edit`} className="btn-secondary text-xs">Edit</Link>{property.status !== "archived" && <button disabled={busy} onClick={archive} className="btn-secondary text-xs">{busy ? "Archiving…" : "Archive"}</button>}</div></div>{error && <p className="px-4 pb-3 text-xs text-rose-600">{error}</p>}</div>; }

export function DetailView({ id }: { id: string }) { return <EnhancedDetail id={id}/>; }
function EnhancedDetail({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const compare = useCompare();
  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const load = () => {
    setLoading(true);
    propertiesApi.one(id).then(setProperty).catch((reason) => setError(apiMessage(reason))).finally(() => setLoading(false));
  };
  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [id]);
  const contact = async () => {
    if (!property) return;
    try {
      const room = await chatApi.createRoom(property.id);
      router.push(`/messages?room=${room.id}`);
    } catch (reason) {
      setError(apiMessage(reason));
    }
  };
  const favorite = async () => {
    if (!property) return;
    try {
      const result = await userApi.toggleFavorite(property.id);
      setSaved(result.status === "added");
    } catch (reason) {
      setError(apiMessage(reason));
    }
  };
  if (loading) return <div className="shell page-space"><div className="skeleton h-96"/></div>;
  if (error || !property) return <div className="shell page-space"><ErrorBlock message={error || "Property not found"} retry={load}/></div>;

  const hostName = property.owner?.name || "Property owner";
  const initials = hostName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <div className="shell page-space property-detail-page">
    <Link href="/properties" className="back-link"><ArrowLeft size={16}/> Back to homes</Link>
    <PropertyGallery title={property.title} images={property.images || []}/>
    <div className="detail-grid">
      <div className="property-detail-main">
        <p className="eyebrow">{property.listing ? `${getListingLabel(property.listing)} · ` : ""}{labels[property.category] || property.category} · {cityOf(property.city)}</p>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
          <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">{property.title}</h1>
          <p className="price">{priceOf(property)}</p>
        </div>
        <div className="detail-stats">{[[BedDouble, `${property.rooms} rooms`], [Maximize2, `${property.area} m²`], [Eye, `${property.views} views`]].map(([Icon, value]) => {
          const Glyph = Icon as typeof Eye;
          return <span key={value as string}><Glyph size={16}/>{value as string}</span>;
        })}</div>
        <section className="property-description">
          <h2>About this home</h2>
          <p>{property.description}</p>
        </section>
        <PropertyCharacteristics property={property}/>
        <PropertyHighlights features={property.features}/>
      </div>
      <aside className="soft-card owner-card p-6 sm:p-7">
        <p className="eyebrow">Listed by</p>
        <div className="mt-5 flex items-center gap-4">
          <div className="host-avatar">{property.owner?.image?.url ? <img src={property.owner.image.url} alt={hostName} className="h-full w-full object-cover"/> : initials || <UserRound size={20}/>}</div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{hostName}</p>
            {property.owner?.gmailStatus === "VERIFIED" && <span className="verified-host"><ShieldCheck size={14}/> Verified Host</span>}
          </div>
        </div>
        <button onClick={contact} className="btn-primary mt-8 flex w-full items-center justify-center gap-2"><MessageCircle size={18}/> Contact owner</button>
        <button onClick={favorite} className="btn-secondary mt-3 flex w-full items-center justify-center gap-2"><Heart size={18} className={saved ? "fill-rose-500 text-rose-500" : ""}/>{saved ? "Saved" : "Save home"}</button>
        <button type="button" onClick={() => compare.toggleProperty(property.id)} className={`btn-secondary mt-3 flex w-full items-center justify-center gap-2 ${compare.isSelected(property.id) ? "border-[#b89568] bg-[#f8f0e5] text-[#513f30]" : ""}`} aria-label={compare.isSelected(property.id) ? "Remove from comparison" : "Add to comparison"} aria-pressed={compare.isSelected(property.id)}>{compare.isSelected(property.id) ? <Check size={17}/> : <GitCompare size={17}/>} {compare.isSelected(property.id) ? "Added to compare" : "Compare"}</button>
        {property.owner?.id !== user?.id && <PropertyReportDialog propertyId={property.id}/>} 
      </aside>
    </div>
  </div>;
}
function Detail({ id }: { id: string }) { const router = useRouter(); const [property, setProperty] = useState<Property | null>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [saved, setSaved] = useState(false); const load = () => { setLoading(true); propertiesApi.one(id).then(setProperty).catch((reason) => setError(apiMessage(reason))).finally(() => setLoading(false)); }; useEffect(() => { const timer = window.setTimeout(load, 0); return () => window.clearTimeout(timer); }, [id]); const contact = async () => { if (!property) return; try { const room = await chatApi.createRoom(property.id); router.push(`/messages?room=${room.id}`); } catch (reason) { setError(apiMessage(reason)); } }; const favorite = async () => { if (!property) return; try { const result = await userApi.toggleFavorite(property.id); setSaved(result.status === "added"); } catch (reason) { setError(apiMessage(reason)); } }; if (loading) return <div className="shell page-space"><div className="skeleton h-96"/></div>; if (error || !property) return <div className="shell page-space"><ErrorBlock message={error || "Property not found"} retry={load}/></div>; return <div className="shell page-space"><Link href="/properties" className="back-link"><ArrowLeft size={16}/> Back to homes</Link><PropertyGallery title={property.title} images={property.images || []}/><div className="detail-grid"><div><p className="eyebrow">{labels[property.category] || property.category} · {cityOf(property.city)}</p><div className="mt-3 flex flex-wrap items-start justify-between gap-5"><h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">{property.title}</h1><p className="price">{priceOf(property)}</p></div><div className="detail-stats">{[[BedDouble, `${property.rooms} rooms`], [Maximize2, `${property.area} m²`], [Eye, `${property.views} views`]].map(([Icon, value]) => { const Glyph = Icon as typeof Eye; return <span key={value as string}><Glyph size={16}/>{value as string}</span>; })}</div><div className="mt-10 border-t border-slate-100 pt-8"><h2 className="text-2xl font-bold tracking-tight text-slate-950">About this home</h2><p className="mt-4 max-w-3xl whitespace-pre-line leading-8 text-slate-600">{property.description}</p></div></div><aside className="soft-card owner-card rounded-3xl p-6"><p className="eyebrow">Listed by</p><div className="mt-5 flex items-center gap-3"><div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-slate-100">{property.owner?.image?.url ? <img src={property.owner.image.url} alt="Owner" className="h-full w-full object-cover"/> : <UserRound size={20}/>}</div><div><p className="font-semibold text-slate-900">{property.owner?.name || "Property owner"}</p><p className="text-sm text-slate-500">{property.owner?.gmail}</p></div></div><button onClick={contact} className="btn-primary mt-7 flex w-full items-center justify-center gap-2"><MessageCircle size={18}/> Contact owner</button><button onClick={favorite} className="btn-secondary mt-3 flex w-full items-center justify-center gap-2"><Heart size={18} className={saved ? "fill-rose-500 text-rose-500" : ""}/>{saved ? "Saved" : "Save home"}</button></aside></div></div>; }

const categoryValues = Object.keys(labels) as PropertyCategory[]; const currencyValues: Currency[] = ["dram", "dollar", "euro", "rubli"];
export function CreatePropertyView() { return <NeedLogin><div className="shell page-space"><p className="eyebrow">Новое объявление</p><h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Разместите объект уверенно.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Заполните важные детали — Rentora передаст их в существующий API вместе с выбранными фотографиями.</p><CreatePropertyForm/></div></NeedLogin>; }
function EnhancedCreateProperty() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ title: "", description: "", city: "YEREVAN", category: "apartament" as PropertyCategory, price: "", rooms: "1", area: "", currency: "dram" as Currency });
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const steps = ["Basic info", "Location", "Details", "Price", "Description", "Photos", "Review"];
  const cities = ["YEREVAN", "GYUMRI", "VANADZOR", "DILIJAN", "TSAGHKADZOR", "SEVAN", "JERMUK"];
  const update = (key: keyof typeof data, value: string) => setData({ ...data, [key]: value });
  const submit = async () => {
    if (!photos?.length) { setError("Add at least one photo before publishing."); return; }
    setBusy(true);
    try {
      const form = new FormData();
      Object.entries(data).forEach(([key, value]) => form.append(key, value));
      Array.from(photos).forEach((photo) => form.append("photos", photo));
      const property = await propertiesApi.create(form);
      router.push(`/properties/${property.id}`);
    } catch (reason) {
      setError(apiMessage(reason));
    } finally {
      setBusy(false);
    }
  };
  return <div className="shell page-space max-w-3xl">
    <p className="eyebrow">Create listing</p>
    <h1 className="mt-2 text-4xl font-bold tracking-tight">Tell your home’s story.</h1>
    <div className="wizard-tabs">{steps.map((label, index) => <button onClick={() => index <= step && setStep(index)} className={index === step ? "is-active" : ""} key={label}>{index + 1}. {label}</button>)}</div>
    <div className="soft-card mt-7 rounded-3xl p-6 sm:p-8">
      {step === 0 && <div className="grid gap-5"><Input label="Listing title" value={data.title} onChange={(event) => update("title", event.target.value)}/><label className="block text-sm font-semibold"><span className="mb-2 block">Home type</span><CustomSelect value={data.category} onChange={(value) => update("category", value)} placeholder="Choose home type" options={categoryValues.map((value) => ({ value, label: labels[value] }))} allowEmpty={false}/></label></div>}
      {step === 1 && <label className="block text-sm font-semibold"><span className="mb-2 block">City</span><CustomSelect value={data.city} onChange={(value) => update("city", value)} placeholder="Choose a city" options={cities.map((value) => ({ value, label: cityOf(value) }))} allowEmpty={false}/></label>}
      {step === 2 && <div className="grid gap-5 sm:grid-cols-2"><Input label="Rooms" type="number" min="1" value={data.rooms} onChange={(event) => update("rooms", event.target.value)}/><Input label="Area (m²)" type="number" min="5" value={data.area} onChange={(event) => update("area", event.target.value)}/></div>}
      {step === 3 && <div className="grid gap-5 sm:grid-cols-2"><Input label="Price" type="number" min="1" value={data.price} onChange={(event) => update("price", event.target.value)}/><label className="block text-sm font-semibold"><span className="mb-2 block">Currency</span><CustomSelect value={data.currency} onChange={(value) => update("currency", value)} placeholder="Choose currency" options={currencyValues.map((value) => ({ value, label: value }))} allowEmpty={false}/></label></div>}
      {step === 4 && <label className="block text-sm font-semibold">Description<textarea minLength={30} value={data.description} onChange={(event) => update("description", event.target.value)} className="field mt-2 min-h-48" placeholder="Describe the space, its atmosphere and what makes it special."/></label>}
      {step === 5 && <label className="upload-zone"><Upload className="mx-auto text-amber-700"/><p className="mt-4 font-semibold">Choose up to 10 photos</p><p className="mt-1 text-sm text-slate-500">Photos are uploaded with your listing.</p><input className="mt-5 block w-full text-sm" type="file" accept="image/*" multiple onChange={(event) => setPhotos(event.target.files)}/>{photos && <p className="mt-3 text-sm font-semibold text-amber-800">{photos.length} photo(s) selected</p>}</label>}
      {step === 6 && <div><h2 className="text-2xl font-bold">Ready to publish?</h2><dl className="review-list"><div><dt>Title</dt><dd>{data.title}</dd></div><div><dt>Location</dt><dd>{cityOf(data.city)}</dd></div><div><dt>Details</dt><dd>{data.rooms} rooms · {data.area} m²</dd></div><div><dt>Price</dt><dd>{data.price} {data.currency}</dd></div></dl></div>}
      <div className="mt-8 flex justify-between gap-3"><button disabled={!step} onClick={() => setStep(step - 1)} className="btn-secondary">Back</button>{step < 6 ? <button onClick={() => setStep(step + 1)} className="btn-primary flex items-center gap-2">Continue <ArrowRight size={16}/></button> : <button disabled={busy} onClick={submit} className="btn-primary">{busy ? "Publishing…" : "Publish listing"}</button>}</div>
      {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
    </div>
  </div>;
}

export function EditPropertyView({ id }: { id: string }) { return <NeedLogin><EditProperty id={id}/></NeedLogin>; }
function EditProperty({ id }: { id: string }) { const router = useRouter(); const [property, setProperty] = useState<Property | null>(null); const [error, setError] = useState(""); const [saving, setSaving] = useState(false); useEffect(() => { propertiesApi.one(id).then(setProperty).catch((reason) => setError(apiMessage(reason))); }, [id]); const save = async (event: React.FormEvent) => { event.preventDefault(); if (!property) return; setSaving(true); try { await propertiesApi.update(property.id, { title: property.title, description: property.description, price: Number(property.price), rooms: property.rooms, area: property.area, city: property.city, category: property.category, currency: property.currency }); router.push(`/properties/${id}`); } catch (reason) { setError(apiMessage(reason)); } finally { setSaving(false); } }; if (!property) return <div className="shell page-space">{error ? <ErrorBlock message={error} retry={() => location.reload()}/> : <div className="skeleton h-80"/>}</div>; return <div className="shell page-space max-w-3xl"><Link href={`/properties/${id}`} className="back-link"><ArrowLeft size={16}/> Back to listing</Link><h1 className="mt-4 text-4xl font-bold tracking-tight">Edit listing</h1><form onSubmit={save} className="soft-card mt-8 grid gap-5 rounded-3xl p-7"><Input label="Title" value={property.title} onChange={(event) => setProperty({ ...property, title: event.target.value })}/><label className="text-sm font-semibold">Description<textarea className="field mt-2 min-h-40" value={property.description} onChange={(event) => setProperty({ ...property, description: event.target.value })}/></label><div className="grid gap-5 sm:grid-cols-3"><Input label="Price" type="number" value={property.price} onChange={(event) => setProperty({ ...property, price: Number(event.target.value) })}/><Input label="Rooms" type="number" value={property.rooms} onChange={(event) => setProperty({ ...property, rooms: Number(event.target.value) })}/><Input label="Area (m²)" type="number" value={property.area} onChange={(event) => setProperty({ ...property, area: Number(event.target.value) })}/></div><button disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save listing"}</button>{error && <p className="text-sm text-rose-600">{error}</p>}</form></div>; }

export function ProfileView() { return <NeedLogin><Profile/></NeedLogin>; }
function Profile() { const { user, refresh, signOut } = useAuth(); const [name, setName] = useState(user?.name || ""); const [phone, setPhone] = useState(user?.phone || "+374"); const [age, setAge] = useState(String(user?.age || "")); const [photo, setPhoto] = useState<File | null>(null); const [note, setNote] = useState(""); const save = async (event: React.FormEvent) => { event.preventDefault(); try { const form = new FormData(); form.append("name", name); form.append("phone", phone); form.append("age", age); if (photo) form.append("photo", photo); await userApi.update(form); await refresh(); setNote("Profile saved."); } catch (reason) { setNote(apiMessage(reason)); } }; return <div className="shell page-space max-w-4xl"><p className="eyebrow">My account</p><h1 className="mt-2 text-4xl font-bold tracking-tight">Profile</h1><div className="mt-9 grid gap-7 md:grid-cols-[.7fr_1.3fr]"><aside className="soft-card rounded-3xl p-6"><div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-slate-100">{user?.image?.url ? <img src={user.image.url} alt="Profile" className="h-full w-full object-cover"/> : <UserRound/>}</div><p className="mt-4 text-xl font-bold">{user?.name}</p><p className="mt-1 text-sm text-slate-500">{user?.gmail}</p><p className="mt-5 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">{user?.userRole} · {user?.gmailStatus}</p><Link href="/my-properties" className="btn-secondary mt-6 block text-center text-sm">My listings</Link><button onClick={signOut} className="mt-4 w-full text-sm font-semibold text-rose-600">Log out</button></aside><form onSubmit={save} className="soft-card rounded-3xl p-6"><h2 className="text-xl font-bold">Personal details</h2><div className="mt-6 grid gap-5"><Input label="Name" value={name} onChange={(event) => setName(event.target.value)}/><PhoneInput value={phone} onChange={setPhone}/><Input label="Age" type="number" value={age} onChange={(event) => setAge(event.target.value)}/><label className="text-sm font-semibold">Profile photo<input type="file" accept="image/*" className="mt-2 block w-full text-sm" onChange={(event) => setPhoto(event.target.files?.[0] || null)}/></label><button className="btn-primary">Save changes</button>{note && <p className="text-sm text-indigo-600">{note}</p>}</div></form></div></div>; }

export function MessagesView() { const query = useSearchParams(); const room = Number(query.get("room")); return <NeedLogin><div className="shell page-space"><ChatPanel selectedRoomId={Number.isFinite(room) && room > 0 ? room : undefined}/></div></NeedLogin>; }
