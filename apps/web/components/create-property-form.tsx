"use client";

import { Check, ImagePlus, LoaderCircle, Trash2, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiMessage, propertiesApi } from "@/lib/api";
import type { BuildingType, Currency, PropertyCategory, PropertyCondition, PropertyFeature, PropertyListing } from "@/types/models";
import { CustomSelect } from "./custom-select";
import { buildingOptions, categoryOptions, cityOptions, conditionOptions, currencyOptions, featureGroups, listingOptions } from "./property-form-options";

type CreatePropertyForm = {
  title: string; description: string; city: string; category: PropertyCategory; listing: PropertyListing | ""; price: string; currency: Currency; rooms: string; area: string;
  bedrooms: string; bathrooms: string; floor: string; totalFloors: string; constructionYear: string; ceilingHeight: string; condition: PropertyCondition | ""; buildingType: BuildingType | ""; features: PropertyFeature[];
};
type FormErrors = Partial<Record<Exclude<keyof CreatePropertyForm, "features"> | "photos", string>>;
type NumericField = "price" | "rooms" | "area" | "bedrooms" | "bathrooms" | "floor" | "totalFloors" | "ceilingHeight" | "constructionYear";

const initialForm: CreatePropertyForm = { title: "", description: "", city: "YEREVAN", category: "apartament", listing: "", price: "", currency: "dram", rooms: "1", area: "", bedrooms: "", bathrooms: "", floor: "", totalFloors: "", constructionYear: "", ceilingHeight: "", condition: "", buildingType: "", features: [] };
const numberRules: Array<[NumericField, number, string]> = [["price", 1, "Укажите цену больше 0."], ["rooms", 1, "Укажите хотя бы одну комнату."], ["area", 5, "Площадь должна быть не меньше 5 м²."], ["bedrooms", 0, "Введите число от 0."], ["bathrooms", 1, "Введите число от 1."], ["floor", 0, "Введите этаж от 0."], ["totalFloors", 1, "Введите число этажей от 1."], ["ceilingHeight", 1.5, "Высота потолка — от 1,5 м."], ["constructionYear", 1800, "Год должен быть не раньше 1800."]];

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return <label className="create-field"><span>{label}</span>{children}{hint && !error && <small>{hint}</small>}{error && <small className="field-error">{error}</small>}</label>;
}

export function CreatePropertyForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<CreatePropertyForm>(initialForm);
  const [photos, setPhotos] = useState<File[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const previews = useMemo(() => photos.map((file) => ({ file, url: URL.createObjectURL(file) })), [photos]);

  useEffect(() => () => previews.forEach(({ url }) => URL.revokeObjectURL(url)), [previews]);
  const update = <K extends Exclude<keyof CreatePropertyForm, "features">>(key: K, value: CreatePropertyForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const addPhotos = (files: FileList | File[]) => {
    const incoming = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (incoming.length !== Array.from(files).length) setErrors((current) => ({ ...current, photos: "Можно добавить только изображения." }));
    const next = [...photos, ...incoming].slice(0, 10);
    if (photos.length + incoming.length > 10) setErrors((current) => ({ ...current, photos: "Backend принимает максимум 10 фотографий." }));
    else setErrors((current) => ({ ...current, photos: undefined }));
    setPhotos(next);
  };
  const toggleFeature = (feature: PropertyFeature) => setForm((current) => ({ ...current, features: current.features.includes(feature) ? current.features.filter((item) => item !== feature) : [...current.features, feature] }));
  const validate = () => {
    const next: FormErrors = {};
    if (!form.title.trim()) next.title = "Введите заголовок объявления.";
    if (form.description.trim().length < 30) next.description = "Описание должно содержать не менее 30 символов.";
    if (!form.listing) next.listing = "Выберите цель объявления.";
    numberRules.forEach(([field, minimum, message]) => { const value = form[field]; if (value && Number(value) < minimum) next[field] = message; });
    if (!form.price || Number(form.price) < 1) next.price = "Укажите цену больше 0.";
    if (!form.area || Number(form.area) < 5) next.area = "Площадь должна быть не меньше 5 м².";
    if (!form.rooms || Number(form.rooms) < 1) next.rooms = "Укажите хотя бы одну комнату.";
    if (form.totalFloors && form.floor && Number(form.floor) > Number(form.totalFloors)) next.floor = "Этаж не может быть выше числа этажей в доме.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !validate()) return;
    setBusy(true);
    try {
      const data = new FormData();
      const scalarFields: Array<Exclude<keyof CreatePropertyForm, "features">> = ["title", "description", "city", "category", "listing", "price", "currency", "rooms", "area", "bedrooms", "bathrooms", "floor", "totalFloors", "constructionYear", "ceilingHeight", "condition", "buildingType"];
      scalarFields.forEach((key) => { const value = form[key]; if (value !== "") data.append(key, value); });
      form.features.forEach((feature) => data.append("features", feature));
      photos.forEach((photo) => data.append("photos", photo));
      const property = await propertiesApi.create(data);
      router.push(`/properties/${property.id}`);
    } catch (reason) {
      setErrors((current) => ({ ...current, photos: apiMessage(reason) }));
    } finally {
      setBusy(false);
    }
  };
  const citySelectOptions = cityOptions.map(([value, label]) => ({ value, label }));
  return <form onSubmit={submit} className="create-property-layout">
    <main className="create-property-sections">
      <section className="create-section"><div className="section-heading"><p className="eyebrow">01 · Основное</p><h2>Расскажите об объекте</h2><p>Чёткий заголовок и подробности помогут быстрее найти нужного покупателя или арендатора.</p></div><div className="create-grid two"><Field label="Заголовок объявления" error={errors.title}><input value={form.title} onChange={(event) => update("title", event.target.value)} className="field" placeholder="Например, светлая квартира в центре Еревана"/></Field><Field label="Тип недвижимости"><CustomSelect value={form.category} onChange={(value) => update("category", value as PropertyCategory)} options={categoryOptions} placeholder="Выберите тип" allowEmpty={false}/></Field><Field label="Цель объявления" error={errors.listing}><CustomSelect value={form.listing} onChange={(value) => update("listing", value as PropertyListing | "")} options={listingOptions} placeholder="Продажа или аренда"/></Field><Field label="Город"><CustomSelect value={form.city} onChange={(value) => update("city", value)} options={citySelectOptions} placeholder="Выберите город" allowEmpty={false}/></Field><Field label="Описание" hint={`${form.description.length}/30 символов минимум`} error={errors.description}><textarea value={form.description} minLength={30} onChange={(event) => update("description", event.target.value)} className="field min-h-40" placeholder="Опишите планировку, район, атмосферу и важные детали."/></Field></div></section>
      <section className="create-section"><div className="section-heading"><p className="eyebrow">02 · Стоимость</p><h2>Цена аренды</h2></div><div className="create-grid price-grid"><Field label="Цена" error={errors.price}><input value={form.price} onChange={(event) => update("price", event.target.value.replace(/[^\d.]/g, ""))} className="field" inputMode="decimal" placeholder="0"/></Field><Field label="Валюта"><CustomSelect value={form.currency} onChange={(value) => update("currency", value as Currency)} options={currencyOptions} placeholder="Валюта" allowEmpty={false}/></Field></div></section>
      <section className="create-section"><div className="section-heading"><p className="eyebrow">03 · Характеристики</p><h2>Главные параметры</h2></div><div className="create-grid four">{[["area", "Площадь, м²", "5"], ["rooms", "Комнаты", "1"], ["bedrooms", "Спальни", "0"], ["bathrooms", "Санузлы", "1"]].map(([key, label, min]) => <Field key={key} label={label} error={errors[key as "area" | "rooms" | "bedrooms" | "bathrooms"]}><input value={form[key as "area" | "rooms" | "bedrooms" | "bathrooms"]} onChange={(event) => update(key as "area" | "rooms" | "bedrooms" | "bathrooms", event.target.value.replace(/\D/g, ""))} className="field" inputMode="numeric" min={min} placeholder={min}/></Field>)}</div></section>
      <section className="create-section"><div className="section-heading"><p className="eyebrow">04 · Дом</p><h2>Здание и этаж</h2></div><div className="create-grid three"><Field label="Этаж" error={errors.floor}><input value={form.floor} onChange={(event) => update("floor", event.target.value.replace(/\D/g, ""))} className="field" inputMode="numeric" placeholder="Например, 5"/></Field><Field label="Этажей в доме" error={errors.totalFloors}><input value={form.totalFloors} onChange={(event) => update("totalFloors", event.target.value.replace(/\D/g, ""))} className="field" inputMode="numeric" placeholder="Например, 12"/></Field><Field label="Год постройки" error={errors.constructionYear}><input value={form.constructionYear} onChange={(event) => update("constructionYear", event.target.value.replace(/\D/g, ""))} className="field" inputMode="numeric" placeholder="Например, 2019"/></Field><Field label="Высота потолков, м" error={errors.ceilingHeight}><input value={form.ceilingHeight} onChange={(event) => update("ceilingHeight", event.target.value.replace(/[^\d.]/g, ""))} className="field" inputMode="decimal" placeholder="Например, 2.8"/></Field><Field label="Тип здания"><CustomSelect value={form.buildingType} onChange={(value) => update("buildingType", value as BuildingType | "")} options={buildingOptions} placeholder="Выберите тип здания"/></Field></div></section>
      <section className="create-section"><div className="section-heading"><p className="eyebrow">05 · Состояние</p><h2>В каком состоянии объект?</h2></div><div className="condition-cards">{conditionOptions.map((option) => <button key={option.value} type="button" onClick={() => update("condition", option.value)} className={`condition-card ${form.condition === option.value ? "is-selected" : ""}`} aria-pressed={form.condition === option.value}><Check size={16}/>{option.label}</button>)}</div></section>
      <section className="create-section"><div className="section-heading"><p className="eyebrow">06 · Удобства</p><h2>Что есть в объекте?</h2><p>Выберите всё, что доступно жильцам.</p></div><div className="features-groups">{featureGroups.map((group) => { const Icon = group.icon; return <section className="feature-group" key={group.label}><h3><Icon size={17}/>{group.label}</h3><div className="feature-options">{group.options.map((option) => { const selected = form.features.includes(option.value); return <button type="button" key={option.value} onClick={() => toggleFeature(option.value)} className={`feature-option ${selected ? "is-selected" : ""}`} aria-pressed={selected}><Check size={15}/><span>{option.label}</span></button>; })}</div></section>; })}</div></section>
      <section className="create-section"><div className="section-heading"><p className="eyebrow">07 · Фотографии</p><h2>Покажите пространство</h2><p>Можно добавить до 10 изображений. Первая фотография станет основной.</p></div><input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={(event) => event.target.files && addPhotos(event.target.files)}/><button type="button" className={`photo-dropzone ${dragging ? "is-dragging" : ""}`} onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); addPhotos(event.dataTransfer.files); }}><UploadCloud size={24}/><strong>Перетащите фотографии сюда</strong><span>или выберите файлы на устройстве</span></button>{errors.photos && <p className="field-error mt-3">{errors.photos}</p>}{previews.length > 0 && <div className="photo-preview-grid">{previews.map(({ file, url }, index) => <figure className="photo-preview" key={`${file.name}-${file.lastModified}`}><img src={url} alt={`Предпросмотр ${index + 1}`}/>{index === 0 && <figcaption>Основная</figcaption>}<button type="button" onClick={() => setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Удалить фото ${index + 1}`}><Trash2 size={15}/></button></figure>)}</div>}<p className="mt-4 text-sm font-semibold text-slate-500">Выбрано: {photos.length} из 10</p></section>
    </main>
    <aside className="create-summary"><div className="create-summary-card"><p className="eyebrow">Ваше объявление</p><h2>{form.title || "Новое объявление"}</h2><dl><div><dt>Тип размещения</dt><dd>{listingOptions.find((item) => item.value === form.listing)?.label || "Не выбран"}</dd></div><div><dt>Цена</dt><dd>{form.price ? `${form.price} ${currencyOptions.find((item) => item.value === form.currency)?.label || ""}` : "Не указана"}</dd></div><div><dt>Город</dt><dd>{citySelectOptions.find((item) => item.value === form.city)?.label}</dd></div><div><dt>Комнаты / площадь</dt><dd>{form.rooms || "—"} / {form.area ? `${form.area} м²` : "—"}</dd></div><div><dt>Фотографии</dt><dd>{photos.length}</dd></div><div><dt>Удобства</dt><dd>{form.features.length}</dd></div></dl><button disabled={busy} className="btn-primary w-full gap-2">{busy ? <><LoaderCircle className="animate-spin" size={18}/> Публикуем...</> : <><ImagePlus size={18}/> Опубликовать объявление</>}</button></div></aside>
  </form>;
}
