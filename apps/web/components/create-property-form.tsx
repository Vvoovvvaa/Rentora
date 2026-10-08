"use client";

import { Building2, Check, ImagePlus, LoaderCircle, Trash2, UploadCloud, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { agencyApi, apiMessage, propertiesApi } from "@/lib/api";
import type { Agency, BuildingType, Currency, PropertyCategory, PropertyCondition, PropertyFeature, PropertyListing } from "@/types/models";
import { CustomSelect } from "./custom-select";
import { currencyOptions, getBuildingOptions, getCategoryOptions, getCityOptions, getConditionOptions, getFeatureGroups, getListingOptions } from "./property-form-options";
import { LocationPicker } from "./location-picker";
import { useI18n } from "@/context/i18n-context";
import { useSubscription } from "@/context/subscription-context";

type CreatePropertyForm = {
  title: string; description: string; city: string; category: PropertyCategory; listing: PropertyListing | ""; price: string; currency: Currency; rooms: string; area: string;
  bedrooms: string; bathrooms: string; floor: string; totalFloors: string; constructionYear: string; ceilingHeight: string; condition: PropertyCondition | ""; buildingType: BuildingType | ""; address: string; latitude: string; longitude: string; features: PropertyFeature[];
};
type FormErrors = Partial<Record<Exclude<keyof CreatePropertyForm, "features"> | "photos", string>>;
type NumericField = "price" | "rooms" | "area" | "bedrooms" | "bathrooms" | "floor" | "totalFloors" | "ceilingHeight" | "constructionYear";

const initialForm: CreatePropertyForm = { title: "", description: "", city: "YEREVAN", category: "apartament", listing: "", price: "", currency: "dram", rooms: "1", area: "", bedrooms: "", bathrooms: "", floor: "", totalFloors: "", constructionYear: "", ceilingHeight: "", condition: "", buildingType: "", address: "", latitude: "", longitude: "", features: [] };
const numberRules: Array<[NumericField, number]> = [["price", 1], ["rooms", 1], ["area", 5], ["bedrooms", 0], ["bathrooms", 1], ["floor", 0], ["totalFloors", 1], ["ceilingHeight", 1.5], ["constructionYear", 1800]];

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return <label className="create-field"><span>{label}</span>{children}{hint && !error && <small>{hint}</small>}{error && <small className="field-error">{error}</small>}</label>;
}

export function CreatePropertyForm() {
  const router = useRouter();
  const { t } = useI18n();
  const { subscription } = useSubscription();
  const inputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<CreatePropertyForm>(initialForm);
  const [photos, setPhotos] = useState<File[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [activeListings, setActiveListings] = useState<number | null>(null);
  const [limitBlocked, setLimitBlocked] = useState(false);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [agencyLoading, setAgencyLoading] = useState(true);
  const [publishingAs, setPublishingAs] = useState<"personal" | "agency">("personal");
  const previews = useMemo(() => photos.map((file) => ({ file, url: URL.createObjectURL(file) })), [photos]);

  useEffect(() => () => previews.forEach(({ url }) => URL.revokeObjectURL(url)), [previews]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void propertiesApi.mine().then((items) => setActiveListings(items.filter((item) => item.status === "active").length)).catch(() => setActiveListings(null));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    agencyApi.mine().then(setAgency).catch(() => setAgency(null)).finally(() => setAgencyLoading(false));
  }, []);
  const update = <K extends Exclude<keyof CreatePropertyForm, "features">>(key: K, value: CreatePropertyForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const addPhotos = (files: FileList | File[]) => {
    const incoming = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (incoming.length !== Array.from(files).length) setErrors((current) => ({ ...current, photos: t("create.imagesOnly") }));
    const next = [...photos, ...incoming].slice(0, 10);
    if (photos.length + incoming.length > 10) setErrors((current) => ({ ...current, photos: t("create.maxPhotos") }));
    else setErrors((current) => ({ ...current, photos: undefined }));
    setPhotos(next);
  };
  const toggleFeature = (feature: PropertyFeature) => setForm((current) => ({ ...current, features: current.features.includes(feature) ? current.features.filter((item) => item !== feature) : [...current.features, feature] }));
  const validate = () => {
    const next: FormErrors = {};
    if (!form.title.trim()) next.title = t("create.titleRequired");
    if (form.description.trim().length < 30) next.description = t("create.descriptionRequired");
    if (!form.listing) next.listing = t("create.listingRequired");
    const latitude = Number(form.latitude); const longitude = Number(form.longitude);
    if (!form.address.trim() || !form.latitude.trim() || !form.longitude.trim() || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) next.address = t("create.locationRequired");
    numberRules.forEach(([field, minimum]) => { const value = form[field]; if (value && Number(value) < minimum) next[field] = t("common.required"); });
    if (!form.price || Number(form.price) < 1) next.price = t("common.required");
    if (!form.area || Number(form.area) < 5) next.area = t("common.required");
    if (!form.rooms || Number(form.rooms) < 1) next.rooms = t("common.required");
    if (form.totalFloors && form.floor && Number(form.floor) > Number(form.totalFloors)) next.floor = t("common.required");
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const limit = subscription?.config.maxProperties;
    if (busy || !validate()) return;
    if (limit !== undefined && activeListings !== null && activeListings >= limit) {
      setLimitBlocked(true);
      return;
    }
    setBusy(true);
    try {
      const data = new FormData();
      const scalarFields: Array<Exclude<keyof CreatePropertyForm, "features">> = ["title", "description", "city", "category", "listing", "price", "currency", "rooms", "area", "bedrooms", "bathrooms", "floor", "totalFloors", "constructionYear", "ceilingHeight", "condition", "buildingType", "address", "latitude", "longitude"];
      scalarFields.forEach((key) => { const value = form[key]; if (value !== "") data.append(key, value); });
      if (publishingAs === "agency" && agency) data.append("agencyId", String(agency.id));
      form.features.forEach((feature) => data.append("features", feature));
      photos.forEach((photo) => data.append("photos", photo));
      await propertiesApi.create(data);
      router.push("/my-properties");
    } catch (reason) {
      const message = apiMessage(reason);
      const status = (reason as { response?: { status?: number } }).response?.status;
      if (status === 403 && /limit|subscription|active propert/i.test(message)) setLimitBlocked(true);
      else setErrors((current) => ({ ...current, photos: message }));
    } finally {
      setBusy(false);
    }
  };
  const citySelectOptions = getCityOptions();
  const categoryOptions = getCategoryOptions(); const listingOptions = getListingOptions(); const conditionOptions = getConditionOptions(); const buildingOptions = getBuildingOptions(); const featureGroups = getFeatureGroups((id) => t(`property.${id}`));
  return <form onSubmit={submit} className="create-property-layout">
    <main className="create-property-sections">
      {subscription && <section className="create-subscription-limit" aria-live="polite"><div><strong>{t("subscription.listingsUsed", { used: activeListings ?? "—", max: subscription.config.maxProperties })}</strong><p>{limitBlocked ? t("subscription.listingLimitCopy") : t(`subscription.planNames.${subscription.plan}`)}</p></div>{limitBlocked && <Link href="/subscription" className="btn-secondary">{t("subscription.viewPlans")}</Link>}</section>}
      <section className="create-section agency-publishing-section"><div className="section-heading"><p className="eyebrow">{t("agency.publishingAs")}</p><h2>{t("agency.publishingAs")}</h2><p>{t("agency.publishingCopy")}</p></div>{agencyLoading ? <div className="skeleton h-24 rounded-2xl"/> : agency ? <div className="agency-publishing-options"><button type="button" onClick={() => setPublishingAs("personal")} className={publishingAs === "personal" ? "is-selected" : ""} aria-pressed={publishingAs === "personal"}><UserRound size={19}/><span><strong>{t("agency.personalProfile")}</strong><small>{t("agency.personalCopy")}</small></span><Check size={17}/></button><button type="button" onClick={() => setPublishingAs("agency")} className={publishingAs === "agency" ? "is-selected" : ""} aria-pressed={publishingAs === "agency"}><span className="agency-publishing-logo">{agency.image?.url ? <img src={agency.image.url} alt=""/> : <Building2 size={18}/>}</span><span><strong>{agency.name}</strong><small>{agency.verified ? t("agency.verified") : t("agency.agency")}</small></span><Check size={17}/></button></div> : <div className="agency-publishing-empty"><Building2 size={22}/><div><strong>{t("agency.noAgency")}</strong><p>{t("agency.publishPrompt")}</p></div><Link href="/agency/create" className="btn-secondary">{t("agency.create")}</Link></div>}</section>
      <section className="create-section"><div className="section-heading"><p className="eyebrow">01 · {t("create.basic")}</p><h2>{t("create.basic")}</h2><p>{t("create.basicCopy")}</p></div><div className="create-grid two"><Field label={t("create.listingTitle")} error={errors.title}><input value={form.title} onChange={(event) => update("title", event.target.value)} className="field"/></Field><Field label={t("create.homeType")}><CustomSelect value={form.category} onChange={(value) => update("category", value as PropertyCategory)} options={categoryOptions} placeholder={t("create.chooseType")} allowEmpty={false}/></Field><Field label={t("create.listingPurpose")} error={errors.listing}><CustomSelect value={form.listing} onChange={(value) => update("listing", value as PropertyListing | "")} options={listingOptions} placeholder={t("create.choosePurpose")}/></Field><Field label={t("property.city")}><CustomSelect value={form.city} onChange={(value) => update("city", value)} options={citySelectOptions} placeholder={t("create.chooseCity")} allowEmpty={false}/></Field><Field label={t("create.description")} hint={`${form.description.length}/30`} error={errors.description}><textarea value={form.description} minLength={30} onChange={(event) => update("description", event.target.value)} className="field min-h-40"/></Field></div></section>
      <section className="create-section"><div className="section-heading"><p className="eyebrow">02 · {t("create.location")}</p><h2>{t("create.location")}</h2><p>{t("create.locationCopy")}</p></div><LocationPicker city={form.city} address={form.address} latitude={form.latitude} longitude={form.longitude} error={errors.address} onChange={(location) => { setForm((current) => ({ ...current, ...location })); setErrors((current) => ({ ...current, address: undefined })); }}/></section>
      <section className="create-section"><div className="section-heading"><p className="eyebrow">03 · {t("create.price")}</p><h2>{t("create.price")}</h2><p>{t("create.priceCopy")}</p></div><div className="create-grid price-grid"><Field label={t("create.price")} error={errors.price}><input value={form.price} onChange={(event) => update("price", event.target.value.replace(/[^\d.]/g, ""))} className="field" inputMode="decimal" placeholder="0"/></Field><Field label={t("create.currency")}><CustomSelect value={form.currency} onChange={(value) => update("currency", value as Currency)} options={currencyOptions} placeholder={t("create.currency")} allowEmpty={false}/></Field></div></section>
      <section className="create-section"><div className="section-heading"><p className="eyebrow">04 · {t("create.mainDetails")}</p><h2>{t("create.mainDetails")}</h2></div><div className="create-grid four">{[["area", t("property.area"), "5"], ["rooms", t("property.rooms"), "1"], ["bedrooms", t("property.bedrooms"), "0"], ["bathrooms", t("property.bathrooms"), "1"]].map(([key, label, min]) => <Field key={key} label={label} error={errors[key as "area" | "rooms" | "bedrooms" | "bathrooms"]}><input value={form[key as "area" | "rooms" | "bedrooms" | "bathrooms"]} onChange={(event) => update(key as "area" | "rooms" | "bedrooms" | "bathrooms", event.target.value.replace(/\D/g, ""))} className="field" inputMode="numeric" min={min} placeholder={min}/></Field>)}</div></section>
      <section className="create-section"><div className="section-heading"><p className="eyebrow">05 · {t("create.building")}</p><h2>{t("create.building")}</h2><p>{t("create.buildingCopy")}</p></div><div className="create-grid three"><Field label={t("property.floor")} error={errors.floor}><input value={form.floor} onChange={(event) => update("floor", event.target.value.replace(/\D/g, ""))} className="field" inputMode="numeric"/></Field><Field label={t("create.floorCount")} error={errors.totalFloors}><input value={form.totalFloors} onChange={(event) => update("totalFloors", event.target.value.replace(/\D/g, ""))} className="field" inputMode="numeric"/></Field><Field label={t("property.constructionYear")} error={errors.constructionYear}><input value={form.constructionYear} onChange={(event) => update("constructionYear", event.target.value.replace(/\D/g, ""))} className="field" inputMode="numeric"/></Field><Field label={t("property.ceilingHeight")} error={errors.ceilingHeight}><input value={form.ceilingHeight} onChange={(event) => update("ceilingHeight", event.target.value.replace(/[^\d.]/g, ""))} className="field" inputMode="decimal"/></Field><Field label={t("property.buildingType")}><CustomSelect value={form.buildingType} onChange={(value) => update("buildingType", value as BuildingType | "")} options={buildingOptions} placeholder={t("create.chooseBuilding")}/></Field></div></section>
      <section className="create-section"><div className="section-heading"><p className="eyebrow">06 · {t("create.condition")}</p><h2>{t("create.condition")}</h2><p>{t("create.conditionCopy")}</p></div><div className="condition-cards">{conditionOptions.map((option) => <button key={option.value} type="button" onClick={() => update("condition", option.value)} className={`condition-card ${form.condition === option.value ? "is-selected" : ""}`} aria-pressed={form.condition === option.value}><Check size={16}/>{option.label}</button>)}</div></section>
      <section className="create-section"><div className="section-heading"><p className="eyebrow">07 · {t("create.features")}</p><h2>{t("create.features")}</h2><p>{t("create.featuresCopy")}</p></div><div className="features-groups">{featureGroups.map((group) => { const Icon = group.icon; return <section className="feature-group" key={group.id}><h3><Icon size={17}/>{group.label}</h3><div className="feature-options">{group.options.map((option) => { const selected = form.features.includes(option.value); return <button type="button" key={option.value} onClick={() => toggleFeature(option.value)} className={`feature-option ${selected ? "is-selected" : ""}`} aria-pressed={selected}><Check size={15}/><span>{option.label}</span></button>; })}</div></section>; })}</div></section>
      <section className="create-section"><div className="section-heading"><p className="eyebrow">08 · {t("create.photos")}</p><h2>{t("create.photos")}</h2><p>{t("create.photosCopy")}</p></div><input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={(event) => event.target.files && addPhotos(event.target.files)}/><button type="button" className={`photo-dropzone ${dragging ? "is-dragging" : ""}`} onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); addPhotos(event.dataTransfer.files); }}><UploadCloud size={24}/><strong>{t("create.uploadPhotos")}</strong><span>{t("create.chooseFiles")}</span></button>{errors.photos && <p className="field-error mt-3">{errors.photos}</p>}{previews.length > 0 && <div className="photo-preview-grid">{previews.map(({ file, url }, index) => <figure className="photo-preview" key={`${file.name}-${file.lastModified}`}><img src={url} alt={`${t("create.photos")} ${index + 1}`}/>{index === 0 && <figcaption>{t("create.cover")}</figcaption>}<button type="button" onClick={() => setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={t("create.removePhoto")}><Trash2 size={15}/></button></figure>)}</div>}<p className="mt-4 text-sm font-semibold text-slate-500">{t("create.selected")}: {photos.length}/10</p></section>
    </main>
    <aside className="create-summary"><div className="create-summary-card"><p className="eyebrow">{t("create.summary")}</p><h2>{form.title || t("create.newListing")}</h2><dl><div><dt>{t("create.listingPurpose")}</dt><dd>{listingOptions.find((item) => item.value === form.listing)?.label || t("create.notSelected")}</dd></div><div><dt>{t("create.price")}</dt><dd>{form.price ? `${form.price} ${currencyOptions.find((item) => item.value === form.currency)?.label || ""}` : t("create.notSpecified")}</dd></div><div><dt>{t("property.city")}</dt><dd>{citySelectOptions.find((item) => item.value === form.city)?.label}</dd></div><div><dt>{t("create.mainDetails")}</dt><dd>{form.rooms || "—"} / {form.area ? `${form.area} m²` : "—"}</dd></div><div><dt>{t("create.photos")}</dt><dd>{photos.length}</dd></div><div><dt>{t("create.features")}</dt><dd>{form.features.length}</dd></div></dl><button disabled={busy || limitBlocked} className="btn-primary w-full gap-2">{busy ? <><LoaderCircle className="animate-spin" size={18}/> {t("create.publishing")}</> : <><ImagePlus size={18}/> {t("create.publish")}</>}</button></div></aside>
  </form>;
}
