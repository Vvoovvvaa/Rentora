"use client";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ImagePlus,
  LoaderCircle,
  Trash2,
  UploadCloud,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { agencyApi, apiMessage, propertiesApi } from "@/lib/api";
import type {
  Agency,
  BuildingType,
  Currency,
  PropertyCategory,
  PropertyCondition,
  PropertyFeature,
  PropertyListing,
} from "@/types/models";
import { CustomSelect } from "./custom-select";
import {
  currencyOptions,
  getBuildingOptions,
  getCategoryOptions,
  getCityOptions,
  getConditionOptions,
  getFeatureGroups,
  getListingOptions,
} from "./property-form-options";
import { LocationPicker } from "./location-picker";
import { useI18n } from "@/context/i18n-context";
import { useSubscription } from "@/context/subscription-context";

type CreatePropertyFormState = {
  title: string;
  description: string;
  city: string;
  category: PropertyCategory;
  listing: PropertyListing | "";
  price: string;
  currency: Currency;
  rooms: string;
  area: string;
  bedrooms: string;
  bathrooms: string;
  floor: string;
  totalFloors: string;
  constructionYear: string;
  ceilingHeight: string;
  condition: PropertyCondition | "";
  buildingType: BuildingType | "";
  address: string;
  latitude: string;
  longitude: string;
  features: PropertyFeature[];
};

type FormErrorKey = Exclude<keyof CreatePropertyFormState, "features"> | "photos";
type FormErrors = Partial<Record<FormErrorKey, string>>;
type NumericField =
  | "price"
  | "rooms"
  | "area"
  | "bedrooms"
  | "bathrooms"
  | "floor"
  | "totalFloors"
  | "ceilingHeight"
  | "constructionYear";
type CategoryKind = "apartment" | "house" | "commercial" | "land" | "other";

const initialForm: CreatePropertyFormState = {
  title: "",
  description: "",
  city: "YEREVAN",
  category: "apartament",
  listing: "",
  price: "",
  currency: "dram",
  rooms: "1",
  area: "",
  bedrooms: "",
  bathrooms: "",
  floor: "",
  totalFloors: "",
  constructionYear: "",
  ceilingHeight: "",
  condition: "",
  buildingType: "",
  address: "",
  latitude: "",
  longitude: "",
  features: [],
};

const scalarFields: Array<Exclude<keyof CreatePropertyFormState, "features">> = [
  "title",
  "description",
  "city",
  "category",
  "listing",
  "price",
  "currency",
  "rooms",
  "area",
  "bedrooms",
  "bathrooms",
  "floor",
  "totalFloors",
  "constructionYear",
  "ceilingHeight",
  "condition",
  "buildingType",
  "address",
  "latitude",
  "longitude",
];

function resolveCategoryKind(
  category: PropertyCategory,
  options: Array<{ value: string; label: string }>,
): CategoryKind {
  const label = options.find((option) => option.value === category)?.label ?? "";
  const value = `${String(category)} ${label}`.toLowerCase().normalize("NFKD");

  if (/(land|plot|lot|terrain|зем|участ|հող)/i.test(value)) return "land";
  if (/(commercial|commerce|office|retail|industrial|shop|store|коммер|офис|խանութ)/i.test(value)) {
    return "commercial";
  }
  if (/(house|home|cottage|villa|detached|дом|котт|вилл|տուն)/i.test(value)) return "house";
  if (/(apart|flat|condo|studio|кварт|апарт|բնակարան)/i.test(value)) return "apartment";

  return "other";
}

function Field({
  label,
  hint,
  error,
  field,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  field?: FormErrorKey;
  children: React.ReactNode;
}) {
  return (
    <label className="create-field" data-field={field}>
      <span>{label}</span>
      {children}
      {hint && !error && <small>{hint}</small>}
      {error && (
        <small className="field-error" role="alert">
          {error}
        </small>
      )}
    </label>
  );
}

function StepHeading({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{number} · {title}</p>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

function getPriceUnit(listing: PropertyListing | ""): string {
  switch (listing) {
    case "RENT_SHORT_TERM":
      return "per day";
    case "RENT_LONG_TERM":
      return "per month";
    case "SALE":
      return "total price";
    default:
      return "";
  }
}

function formatPriceWithUnit(
  price: string,
  currency: string | undefined,
  listing: PropertyListing | "",
): string {
  if (!price) return "";
  const amount = `${price} ${currency || ""}`.trim();
  if (listing === "RENT_SHORT_TERM") return `${amount} / day`;
  if (listing === "RENT_LONG_TERM") return `${amount} / month`;
  return amount;
}

export function CreatePropertyForm() {
  const router = useRouter();
  const { t } = useI18n();
  const { subscription } = useSubscription();

  const inputRef = useRef<HTMLInputElement>(null);
  const stepContentRef = useRef<HTMLDivElement>(null);
  const initialRender = useRef(true);

  const [form, setForm] = useState<CreatePropertyFormState>(initialForm);
  const [photos, setPhotos] = useState<File[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  // City inferred from the last geocoded address/marker. If the user later
  // changes the city manually, validation prevents publishing inconsistent data.
  const [verifiedLocationCity, setVerifiedLocationCity] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [step, setStep] = useState(0);
  const [activeListings, setActiveListings] = useState<number | null>(null);
  const [limitBlocked, setLimitBlocked] = useState(false);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [agencyLoading, setAgencyLoading] = useState(true);
  const [publishingAs, setPublishingAs] = useState<"personal" | "agency">("personal");

  const previews = useMemo(
    () => photos.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [photos],
  );

  useEffect(() => () => previews.forEach(({ url }) => URL.revokeObjectURL(url)), [previews]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void propertiesApi
        .mine()
        .then((items) => setActiveListings(items.filter((item) => item.status === "active").length))
        .catch(() => setActiveListings(null));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    agencyApi
      .mine()
      .then(setAgency)
      .catch(() => setAgency(null))
      .finally(() => setAgencyLoading(false));
  }, []);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    stepContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const citySelectOptions = getCityOptions();
  const categoryOptions = getCategoryOptions();
  const listingOptions = getListingOptions();
  const conditionOptions = getConditionOptions();
  const buildingOptions = getBuildingOptions();
  const featureGroups = getFeatureGroups((id) => t(`property.${id}`));

  const categoryKind = resolveCategoryKind(form.category, categoryOptions);
  const isApartment = categoryKind === "apartment";
  const isHouse = categoryKind === "house";
  const isCommercial = categoryKind === "commercial";
  const isLand = categoryKind === "land";
  const isBuiltProperty = isApartment || isHouse || isCommercial;
  const showRooms = isApartment || isHouse || isCommercial;
  const showBedrooms = isApartment || isHouse;
  const showBathrooms = isApartment || isHouse || isCommercial;
  const showFloor = isApartment || isCommercial;
  const showTotalFloors = isApartment || isHouse || isCommercial;
  const showBuildingFields = isBuiltProperty;
  const showFeatures = !isLand && categoryKind !== "other";

  const steps = [
    { label: t("create.basic"), description: t("create.basicCopy") },
    { label: t("create.location"), description: t("create.locationCopy") },
    { label: t("create.price"), description: t("create.priceCopy") },
    { label: t("create.mainDetails"), description: t("create.buildingCopy") },
    { label: t("create.photos"), description: t("create.photosCopy") },
    { label: t("create.summary"), description: t("create.basicCopy") },
  ];
  const lastStep = steps.length - 1;

  const update = <K extends Exclude<keyof CreatePropertyFormState, "features">>(
    key: K,
    value: CreatePropertyFormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSubmitError("");
  };

  const changeCategory = (value: string) => {
    const nextCategory = value as PropertyCategory;
    const nextKind = resolveCategoryKind(nextCategory, categoryOptions);

    setForm((current) => {
      const next: CreatePropertyFormState = {
        ...current,
        category: nextCategory,
      };

      // Clear values that no longer apply so hidden fields are not submitted.
      if (nextKind === "land") {
        next.rooms = "";
        next.bedrooms = "";
        next.bathrooms = "";
        next.floor = "";
        next.totalFloors = "";
        next.constructionYear = "";
        next.ceilingHeight = "";
        next.condition = "";
        next.buildingType = "";
        next.features = [];
      } else if (nextKind === "house") {
        next.floor = "";
        next.rooms = current.rooms || "1";
        next.bedrooms = current.bedrooms;
        next.bathrooms = current.bathrooms;
      } else if (nextKind === "commercial") {
        next.bedrooms = "";
        next.rooms = "";
      } else if (nextKind === "apartment") {
        next.rooms = current.rooms || "1";
      } else {
        next.rooms = "";
        next.bedrooms = "";
        next.bathrooms = "";
        next.floor = "";
        next.totalFloors = "";
        next.constructionYear = "";
        next.ceilingHeight = "";
        next.condition = "";
        next.buildingType = "";
        next.features = [];
      }

      return next;
    });

    setErrors({});
    setSubmitError("");
  };

  const addPhotos = (files: FileList | File[]) => {
    const received = Array.from(files);
    const incoming = received.filter((file) => file.type.startsWith("image/"));
    const hasInvalidFiles = incoming.length !== received.length;
    const availableSlots = Math.max(0, 10 - photos.length);
    const accepted = incoming.slice(0, availableSlots);
    const exceedsLimit = incoming.length > availableSlots;

    setPhotos((current) => [...current, ...accepted].slice(0, 10));

    if (hasInvalidFiles) {
      setErrors((current) => ({ ...current, photos: t("create.imagesOnly") }));
    } else if (exceedsLimit) {
      setErrors((current) => ({ ...current, photos: t("create.maxPhotos") }));
    } else {
      setErrors((current) => ({ ...current, photos: undefined }));
    }
    setSubmitError("");
  };

  const toggleFeature = (feature: PropertyFeature) => {
    setForm((current) => ({
      ...current,
      features: current.features.includes(feature)
        ? current.features.filter((item) => item !== feature)
        : [...current.features, feature],
    }));
  };

  const fieldsForStep = (stepIndex: number): FormErrorKey[] => {
    if (stepIndex === 0) return ["title", "description", "listing"];
    if (stepIndex === 1) return ["address"];
    if (stepIndex === 2) return ["price"];
    if (stepIndex === 3) {
      const fields: FormErrorKey[] = ["area"];
      if (showRooms) fields.push("rooms");
      if (showBedrooms) fields.push("bedrooms");
      if (showBathrooms) fields.push("bathrooms");
      if (showFloor) fields.push("floor");
      if (showTotalFloors) fields.push("totalFloors");
      if (showBuildingFields) fields.push("constructionYear", "ceilingHeight");
      return fields;
    }
    // Photo selection is optional in the existing API contract. Keep upload validation
    // errors until the user selects another file set, but do not block the wizard step.
    if (stepIndex === 4) return [];
    return [];
  };

  const validateFields = (stepIndexes: number[]): FormErrors => {
    const next: FormErrors = {};
    const keys = new Set(stepIndexes.flatMap((index) => fieldsForStep(index)));

    if (keys.has("title") && !form.title.trim()) {
      next.title = t("create.titleRequired");
    }

    if (keys.has("description") && form.description.trim().length < 30) {
      next.description = t("create.descriptionRequired");
    }

    if (keys.has("listing") && !form.listing) {
      next.listing = t("create.listingRequired");
    }

    if (keys.has("address")) {
      const latitude = Number(form.latitude);
      const longitude = Number(form.longitude);
      const validCoordinates =
        form.latitude.trim() !== "" &&
        form.longitude.trim() !== "" &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        Math.abs(latitude) <= 90 &&
        Math.abs(longitude) <= 180;

      if (!form.address.trim() || !validCoordinates) {
        next.address = t("create.locationRequired");
      } else if (verifiedLocationCity && form.city !== verifiedLocationCity) {
        const detectedCity = citySelectOptions.find(
          (option) => option.value === verifiedLocationCity,
        )?.label ?? verifiedLocationCity;
        const selectedCity = citySelectOptions.find(
          (option) => option.value === form.city,
        )?.label ?? form.city;
        next.address = `The selected address is in ${detectedCity}, but the listing city is ${selectedCity}. Select the matching city or choose another address.`;
      }
    }

    if (keys.has("price")) {
      const price = Number(form.price);
      if (!form.price.trim() || !Number.isFinite(price) || price < 1) {
        next.price = t("common.required");
      }
    }

    if (keys.has("area")) {
      const area = Number(form.area);
      if (!form.area.trim() || !Number.isFinite(area) || area < 5) {
        next.area = t("common.required");
      }
    }

    if (keys.has("rooms")) {
      const rooms = Number(form.rooms);
      if ((isApartment || isHouse) && (!form.rooms.trim() || !Number.isFinite(rooms) || rooms < 1)) {
        next.rooms = t("common.required");
      } else if (form.rooms.trim() && (!Number.isFinite(rooms) || rooms < 1)) {
        next.rooms = t("common.required");
      }
    }

    const optionalNumericRules: Array<[NumericField, number]> = [
      ["bedrooms", 0],
      ["bathrooms", 1],
      ["floor", 0],
      ["totalFloors", 1],
      ["ceilingHeight", 1.5],
      ["constructionYear", 1800],
    ];

    optionalNumericRules.forEach(([field, minimum]) => {
      if (!keys.has(field)) return;
      const value = form[field];
      if (!value.trim()) return;
      const numeric = Number(value);
      if (!Number.isFinite(numeric) || numeric < minimum) {
        next[field] = t("common.required");
      }
    });

    if (
      keys.has("constructionYear") &&
      form.constructionYear.trim() &&
      Number(form.constructionYear) > new Date().getFullYear()
    ) {
      next.constructionYear = t("common.required");
    }

    if (
      keys.has("floor") &&
      keys.has("totalFloors") &&
      form.floor.trim() &&
      form.totalFloors.trim() &&
      Number(form.floor) > Number(form.totalFloors)
    ) {
      next.floor = t("common.required");
    }

    return next;
  };

  const focusFirstError = (nextErrors: FormErrors) => {
    const firstKey = Object.keys(nextErrors).find((key) => nextErrors[key as FormErrorKey]);
    if (!firstKey) return;

    window.setTimeout(() => {
      const field = document.querySelector<HTMLElement>(`[data-field="${firstKey}"]`);
      field?.scrollIntoView({ behavior: "smooth", block: "center" });
      const input = field?.querySelector<HTMLElement>("input, textarea, button");
      input?.focus({ preventScroll: true });
    }, 50);
  };

  const mergeStepErrors = (checkedSteps: number[], nextErrors: FormErrors) => {
    setErrors((current) => {
      const merged = { ...current };
      checkedSteps.flatMap((index) => fieldsForStep(index)).forEach((key) => {
        delete merged[key];
      });
      return { ...merged, ...nextErrors };
    });
  };

  const validateCurrentStep = () => {
    const nextErrors = validateFields([step]);
    mergeStepErrors([step], nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors);
      return false;
    }

    return true;
  };

  const goNext = () => {
    setSubmitError("");
    if (!validateCurrentStep()) return;
    setStep((current) => Math.min(lastStep, current + 1));
  };

  const goToStep = (targetStep: number) => {
    if (targetStep <= step) setStep(targetStep);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    setSubmitError("");
    const allStepIndexes = [0, 1, 2, 3, 4];
    const nextErrors = validateFields(allStepIndexes);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstError = Object.keys(nextErrors)[0] as FormErrorKey;
      const targetStep = allStepIndexes.find((index) => fieldsForStep(index).includes(firstError));
      if (targetStep !== undefined) setStep(targetStep);
      focusFirstError(nextErrors);
      return;
    }

    const limit = subscription?.config.maxProperties;
    if (limit !== undefined && activeListings !== null && activeListings >= limit) {
      setLimitBlocked(true);
      return;
    }

    setBusy(true);
    try {
      const data = new FormData();

      scalarFields.forEach((key) => {
        const value = form[key];
        if (value !== "") data.append(key, value);
      });

      if (publishingAs === "agency" && agency) {
        data.append("agencyId", String(agency.id));
      }

      form.features.forEach((feature) => data.append("features", feature));
      photos.forEach((photo) => data.append("photos", photo));

      const property = await propertiesApi.create(data);
      router.push(`/properties/${property.id}`);
    } catch (reason) {
      const message = apiMessage(reason);
      const status = (reason as { response?: { status?: number } }).response?.status;

      if (status === 403 && /limit|subscription|active propert/i.test(message)) {
        setLimitBlocked(true);
      } else {
        setSubmitError(message);
      }
    } finally {
      setBusy(false);
    }
  };

  const selectedListing = listingOptions.find((item) => item.value === form.listing)?.label;
  const selectedCurrency = currencyOptions.find((item) => item.value === form.currency)?.label;
  const selectedCity = citySelectOptions.find((item) => item.value === form.city)?.label;
  const priceUnit = getPriceUnit(form.listing);
  const priceFieldLabel = priceUnit
    ? `${t("create.price")} (${priceUnit})`
    : t("create.price");
  const formattedPrice = formatPriceWithUnit(form.price, selectedCurrency, form.listing);

  return (
    <form onSubmit={submit} className="create-property-layout">
      <main className="create-property-sections min-w-0">
        {subscription && (
          <section className="create-subscription-limit" aria-live="polite">
            <div>
              <strong>
                {t("subscription.listingsUsed", {
                  used: activeListings ?? "—",
                  max: subscription.config.maxProperties,
                })}
              </strong>
              <p>
                {limitBlocked
                  ? t("subscription.listingLimitCopy")
                  : t(`subscription.planNames.${subscription.plan}`)}
              </p>
            </div>
            {limitBlocked && (
              <Link href="/subscription" className="btn-secondary">
                {t("subscription.viewPlans")}
              </Link>
            )}
          </section>
        )}

        <section className="create-section agency-publishing-section">
          <div className="section-heading">
            <p className="eyebrow">{t("agency.publishingAs")}</p>
            <h2>{t("agency.publishingAs")}</h2>
            <p>{t("agency.publishingCopy")}</p>
          </div>

          {agencyLoading ? (
            <div className="skeleton h-24 rounded-2xl" />
          ) : agency ? (
            <div className="agency-publishing-options">
              <button
                type="button"
                onClick={() => setPublishingAs("personal")}
                className={publishingAs === "personal" ? "is-selected" : ""}
                aria-pressed={publishingAs === "personal"}
              >
                <UserRound size={19} />
                <span>
                  <strong>{t("agency.personalProfile")}</strong>
                  <small>{t("agency.personalCopy")}</small>
                </span>
                {publishingAs === "personal" && <Check size={17} />}
              </button>

              <button
                type="button"
                onClick={() => setPublishingAs("agency")}
                className={publishingAs === "agency" ? "is-selected" : ""}
                aria-pressed={publishingAs === "agency"}
              >
                <span className="agency-publishing-logo">
                  {agency.image?.url ? <img src={agency.image.url} alt="" /> : <Building2 size={18} />}
                </span>
                <span>
                  <strong>{agency.name}</strong>
                  <small>{agency.verified ? t("agency.verified") : t("agency.agency")}</small>
                </span>
                {publishingAs === "agency" && <Check size={17} />}
              </button>
            </div>
          ) : (
            <div className="agency-publishing-empty">
              <Building2 size={22} />
              <div>
                <strong>{t("agency.noAgency")}</strong>
                <p>{t("agency.publishPrompt")}</p>
              </div>
              <Link href="/agency/create" className="btn-secondary">
                {t("agency.create")}
              </Link>
            </div>
          )}
        </section>

        <section className="create-section !p-4 sm:!p-6">
          <div className="mb-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="eyebrow">{t("create.basic")}</span>
              <span className="text-xs font-semibold text-stone-500">
                {step + 1} / {steps.length}
              </span>
            </div>

            <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-[#eadfd2]">
              <div
                className="h-full rounded-full bg-[#624630] transition-[width] duration-300"
                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
              />
            </div>

            <nav
              aria-label="Listing creation steps"
              className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6"
            >
              {steps.map((item, index) => {
                const reached = index <= step;
                const active = index === step;
                return (
                  <button
                    key={item.label}
                    type="button"
                    disabled={!reached || busy}
                    onClick={() => goToStep(index)}
                    aria-current={active ? "step" : undefined}
                    className={[
                      "flex min-h-[68px] items-start gap-2 rounded-xl border p-3 text-left transition",
                      active
                        ? "border-[#765638] bg-[#4b3628] text-white shadow-sm"
                        : reached
                          ? "border-[#d9c7b3] bg-[#fbf5ed] text-[#5f4836] hover:border-[#b78b60]"
                          : "cursor-not-allowed border-[#eee5db] bg-[#faf7f2] text-[#aa9b8e]",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-extrabold",
                        active
                          ? "bg-white/15 text-white"
                          : reached
                            ? "bg-[#ead8c1] text-[#65482f]"
                            : "bg-[#eee7df] text-[#a99a8c]",
                      ].join(" ")}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold leading-4">{item.label}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div id="create-step-content" ref={stepContentRef} className="scroll-mt-28">
            {step === 0 && (
              <section className="create-step-panel">
                <StepHeading
                  number="01"
                  title={t("create.basic")}
                  description={t("create.basicCopy")}
                />

                <div className="create-grid two">
                  <Field label={t("create.listingTitle")} field="title" error={errors.title}>
                    <input
                      id="title"
                      value={form.title}
                      onChange={(event) => update("title", event.target.value)}
                      className="field"
                      required
                    />
                  </Field>

                  <Field label={t("create.homeType")}>
                    <CustomSelect
                      value={form.category}
                      onChange={changeCategory}
                      options={categoryOptions}
                      placeholder={t("create.chooseType")}
                      allowEmpty={false}
                    />
                  </Field>

                  <Field label={t("create.listingPurpose")} field="listing" error={errors.listing}>
                    <CustomSelect
                      value={form.listing}
                      onChange={(value) => update("listing", value as PropertyListing | "")}
                      options={listingOptions}
                      placeholder={t("create.choosePurpose")}
                    />
                  </Field>

                  <Field label={t("property.city")}>
                    <CustomSelect
                      value={form.city}
                      onChange={(value) => update("city", value)}
                      options={citySelectOptions}
                      placeholder={t("create.chooseCity")}
                      allowEmpty={false}
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <Field
                      label={t("create.description")}
                      field="description"
                      hint={`${form.description.length}/30`}
                      error={errors.description}
                    >
                      <textarea
                        id="description"
                        value={form.description}
                        minLength={30}
                        onChange={(event) => update("description", event.target.value)}
                        className="field min-h-40"
                        required
                      />
                    </Field>
                  </div>
                </div>
              </section>
            )}

            {step === 1 && (
              <section className="create-step-panel">
                <StepHeading
                  number="02"
                  title={t("create.location")}
                  description={t("create.locationCopy")}
                />
                <div data-field="address">
                  {verifiedLocationCity && form.city !== verifiedLocationCity && (
                    <p
                      className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
                      role="alert"
                    >
                      The selected address and listing city do not match. Choose the matching city or select an address from the selected city.
                    </p>
                  )}
                  <LocationPicker
                    city={form.city}
                    address={form.address}
                    latitude={form.latitude}
                    longitude={form.longitude}
                    error={errors.address}
                    onChange={(location) => {
                      setForm((current) => ({
                        ...current,
                        address: location.address,
                        latitude: location.latitude,
                        longitude: location.longitude,
                        ...(location.city ? { city: location.city } : {}),
                      }));
                      setVerifiedLocationCity(location.city ?? null);
                      setErrors((current) => ({ ...current, address: undefined }));
                      setSubmitError("");
                    }}
                  />
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="create-step-panel">
                <StepHeading
                  number="03"
                  title={t("create.price")}
                  description={
                    form.listing === "RENT_SHORT_TERM"
                      ? "Enter the rental price for one day."
                      : form.listing === "RENT_LONG_TERM"
                        ? "Enter the rental price for one month."
                        : form.listing === "SALE"
                          ? "Enter the total asking price for the property."
                          : t("create.priceCopy")
                  }
                />
                <div className="create-grid price-grid">
                  <Field
                    label={priceFieldLabel}
                    field="price"
                    error={errors.price}
                    hint={form.listing === "RENT_SHORT_TERM" ? "The amount charged per day." : form.listing === "RENT_LONG_TERM" ? "The amount charged per month." : form.listing === "SALE" ? "The total price of the property." : undefined}
                  >
                    <input
                      id="price"
                      type="number"
                      min="1"
                      step="any"
                      value={form.price}
                      onChange={(event) => update("price", event.target.value)}
                      className="field"
                      inputMode="decimal"
                      placeholder="0"
                      required
                    />
                  </Field>

                  <Field label={t("create.currency")}>
                    <CustomSelect
                      value={form.currency}
                      onChange={(value) => update("currency", value as Currency)}
                      options={currencyOptions}
                      placeholder={t("create.currency")}
                      allowEmpty={false}
                    />
                  </Field>
                </div>
              </section>
            )}

            {step === 3 && (
              <section className="create-step-panel">
                <StepHeading
                  number="04"
                  title={t("create.mainDetails")}
                  description={
                    isLand
                      ? "Add the plot area and only the details that apply to land."
                      : isHouse
                        ? "Describe the house itself. The floor count refers to floors in the house, not the floor of an apartment."
                        : isCommercial
                          ? "Add the relevant area and commercial building details."
                          : t("create.buildingCopy")
                  }
                />

                <div className="create-grid four">
                  <Field label={t("property.area")} field="area" error={errors.area} hint="m²">
                    <input
                      id="area"
                      type="number"
                      min="5"
                      step="any"
                      value={form.area}
                      onChange={(event) => update("area", event.target.value)}
                      className="field"
                      inputMode="decimal"
                      placeholder="5"
                      required
                    />
                  </Field>

                  {showRooms && (
                    <Field label={t("property.rooms")} field="rooms" error={errors.rooms}>
                      <input
                        id="rooms"
                        type="number"
                        min="1"
                        step="1"
                        value={form.rooms}
                        onChange={(event) => update("rooms", event.target.value)}
                        className="field"
                        inputMode="numeric"
                        placeholder="1"
                        required={isApartment || isHouse}
                      />
                    </Field>
                  )}

                  {showBedrooms && (
                    <Field label={t("property.bedrooms")} field="bedrooms" error={errors.bedrooms}>
                      <input
                        id="bedrooms"
                        type="number"
                        min="0"
                        step="1"
                        value={form.bedrooms}
                        onChange={(event) => update("bedrooms", event.target.value)}
                        className="field"
                        inputMode="numeric"
                        placeholder="0"
                      />
                    </Field>
                  )}

                  {showBathrooms && (
                    <Field label={t("property.bathrooms")} field="bathrooms" error={errors.bathrooms}>
                      <input
                        id="bathrooms"
                        type="number"
                        min="1"
                        step="1"
                        value={form.bathrooms}
                        onChange={(event) => update("bathrooms", event.target.value)}
                        className="field"
                        inputMode="numeric"
                        placeholder="1"
                      />
                    </Field>
                  )}
                </div>

                {showBuildingFields && (
                  <div className="mt-7 border-t border-[#eadfd3] pt-6">
                    <h3 className="mb-4 text-base font-extrabold text-[#493629]">
                      {t("create.building")}
                    </h3>
                    <p className="mb-5 text-sm leading-6 text-stone-500">
                      {isHouse
                        ? "For a house, enter the number of floors in the house itself."
                        : "Add building information when it is known."}
                    </p>

                    <div className="create-grid three">
                      {showFloor && (
                        <Field label={t("property.floor")} field="floor" error={errors.floor}>
                          <input
                            id="floor"
                            type="number"
                            min="0"
                            step="1"
                            value={form.floor}
                            onChange={(event) => update("floor", event.target.value)}
                            className="field"
                            inputMode="numeric"
                          />
                        </Field>
                      )}

                      {showTotalFloors && (
                        <Field
                          label={t("create.floorCount")}
                          field="totalFloors"
                          error={errors.totalFloors}
                          hint={isHouse ? "Floors in the house" : undefined}
                        >
                          <input
                            id="totalFloors"
                            type="number"
                            min="1"
                            step="1"
                            value={form.totalFloors}
                            onChange={(event) => update("totalFloors", event.target.value)}
                            className="field"
                            inputMode="numeric"
                          />
                        </Field>
                      )}

                      <Field
                        label={t("property.constructionYear")}
                        field="constructionYear"
                        error={errors.constructionYear}
                      >
                        <input
                          id="constructionYear"
                          type="number"
                          min="1800"
                          max={new Date().getFullYear()}
                          step="1"
                          value={form.constructionYear}
                          onChange={(event) => update("constructionYear", event.target.value)}
                          className="field"
                          inputMode="numeric"
                        />
                      </Field>

                      <Field
                        label={t("property.ceilingHeight")}
                        field="ceilingHeight"
                        error={errors.ceilingHeight}
                      >
                        <input
                          id="ceilingHeight"
                          type="number"
                          min="1.5"
                          step="0.1"
                          value={form.ceilingHeight}
                          onChange={(event) => update("ceilingHeight", event.target.value)}
                          className="field"
                          inputMode="decimal"
                        />
                      </Field>

                      <Field label={t("property.buildingType")}>
                        <CustomSelect
                          value={form.buildingType}
                          onChange={(value) => update("buildingType", value as BuildingType | "")}
                          options={buildingOptions}
                          placeholder={t("create.chooseBuilding")}
                        />
                      </Field>
                    </div>
                  </div>
                )}

                {showBuildingFields && (
                  <div className="mt-7 border-t border-[#eadfd3] pt-6">
                    <h3 className="mb-4 text-base font-extrabold text-[#493629]">
                      {t("create.condition")}
                    </h3>
                    <p className="mb-4 text-sm leading-6 text-stone-500">
                      {t("create.conditionCopy")}
                    </p>
                    <div className="condition-cards">
                      {conditionOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => update("condition", option.value)}
                          className={`condition-card ${form.condition === option.value ? "is-selected" : ""}`}
                          aria-pressed={form.condition === option.value}
                        >
                          <Check size={16} />
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {showFeatures && (
                  <div className="mt-7 border-t border-[#eadfd3] pt-6">
                    <h3 className="mb-2 text-base font-extrabold text-[#493629]">
                      {t("create.features")}
                    </h3>
                    <p className="mb-4 text-sm leading-6 text-stone-500">
                      {t("create.featuresCopy")}
                    </p>
                    <div className="features-groups">
                      {featureGroups.map((group) => {
                        const Icon = group.icon;
                        return (
                          <section className="feature-group" key={group.id}>
                            <h3>
                              <Icon size={17} />
                              {group.label}
                            </h3>
                            <div className="feature-options">
                              {group.options.map((option) => {
                                const selected = form.features.includes(option.value);
                                return (
                                  <button
                                    type="button"
                                    key={option.value}
                                    onClick={() => toggleFeature(option.value)}
                                    className={`feature-option ${selected ? "is-selected" : ""}`}
                                    aria-pressed={selected}
                                  >
                                    <Check size={15} />
                                    <span>{option.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </section>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isLand && (
                  <p className="mt-6 rounded-xl border border-[#e7d5bf] bg-[#fbf4ea] p-4 text-sm leading-6 text-[#765a42]">
                    Building-specific fields and residential amenities are hidden for land. The plot area is entered above.
                  </p>
                )}
              </section>
            )}

            {step === 4 && (
              <section className="create-step-panel">
                <StepHeading
                  number="05"
                  title={t("create.photos")}
                  description={t("create.photosCopy")}
                />

                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(event) => {
                    if (event.target.files) addPhotos(event.target.files);
                    event.target.value = "";
                  }}
                />

                <button
                  type="button"
                  className={`photo-dropzone ${dragging ? "is-dragging" : ""}`}
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    addPhotos(event.dataTransfer.files);
                  }}
                >
                  <UploadCloud size={24} />
                  <strong>{t("create.uploadPhotos")}</strong>
                  <span>{t("create.chooseFiles")}</span>
                </button>

                {errors.photos && (
                  <p className="field-error mt-3" role="alert">
                    {errors.photos}
                  </p>
                )}

                {previews.length > 0 && (
                  <div className="photo-preview-grid">
                    {previews.map(({ file, url }, index) => (
                      <figure
                        className="photo-preview"
                        key={`${file.name}-${file.lastModified}-${index}`}
                      >
                        <img src={url} alt={`${t("create.photos")} ${index + 1}`} />
                        {index === 0 && <figcaption>{t("create.cover")}</figcaption>}
                        <button
                          type="button"
                          onClick={() => {
                            setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index));
                            setErrors((current) => ({ ...current, photos: undefined }));
                          }}
                          aria-label={t("create.removePhoto")}
                        >
                          <Trash2 size={15} />
                        </button>
                      </figure>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-500">
                    {t("create.selected")}: {photos.length}/10
                  </p>
                  <p className="text-xs text-stone-500">
                    {photos.length > 0
                      ? "The first image will be used as the cover."
                      : "You can add up to 10 images."}
                  </p>
                </div>
              </section>
            )}

            {step === 5 && (
              <section className="create-step-panel">
                <StepHeading
                  number="06"
                  title={t("create.summary")}
                  description="Check the details before publishing your listing."
                />

                <div className="rounded-2xl border border-[#e7d9ca] bg-[#fcf8f2] p-5">
                  <h3 className="text-xl font-extrabold text-[#38291f]">
                    {form.title.trim() || t("create.newListing")}
                  </h3>
                  <p className="mt-2 text-sm text-stone-500">
                    {categoryOptions.find((item) => item.value === form.category)?.label || form.category}
                    {" · "}
                    {selectedListing || t("create.notSelected")}
                    {" · "}
                    {selectedCity}
                  </p>
                  <p className="mt-4 text-2xl font-black tracking-tight text-[#4d3828]">
                    {form.price
                      ? formattedPrice
                      : t("create.notSpecified")}
                  </p>
                  <dl className="mt-5 divide-y divide-[#e8dbce]">
                    <div className="flex justify-between gap-4 py-3 text-sm">
                      <dt className="text-stone-500">{t("property.area")}</dt>
                      <dd className="text-right font-bold text-[#493629]">
                        {form.area ? `${form.area} m²` : "—"}
                      </dd>
                    </div>
                    {showRooms && (
                      <div className="flex justify-between gap-4 py-3 text-sm">
                        <dt className="text-stone-500">{t("property.rooms")}</dt>
                        <dd className="text-right font-bold text-[#493629]">{form.rooms || "—"}</dd>
                      </div>
                    )}
                    {showBedrooms && (
                      <div className="flex justify-between gap-4 py-3 text-sm">
                        <dt className="text-stone-500">{t("property.bedrooms")}</dt>
                        <dd className="text-right font-bold text-[#493629]">{form.bedrooms || "—"}</dd>
                      </div>
                    )}
                    {showBathrooms && (
                      <div className="flex justify-between gap-4 py-3 text-sm">
                        <dt className="text-stone-500">{t("property.bathrooms")}</dt>
                        <dd className="text-right font-bold text-[#493629]">{form.bathrooms || "—"}</dd>
                      </div>
                    )}
                    {showFloor && (
                      <div className="flex justify-between gap-4 py-3 text-sm">
                        <dt className="text-stone-500">{t("property.floor")}</dt>
                        <dd className="text-right font-bold text-[#493629]">{form.floor || "—"}</dd>
                      </div>
                    )}
                    {showTotalFloors && (
                      <div className="flex justify-between gap-4 py-3 text-sm">
                        <dt className="text-stone-500">{t("create.floorCount")}</dt>
                        <dd className="text-right font-bold text-[#493629]">{form.totalFloors || "—"}</dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-4 py-3 text-sm">
                      <dt className="text-stone-500">{t("create.location")}</dt>
                      <dd className="max-w-[65%] text-right font-bold text-[#493629]">
                        {form.address || selectedCity}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 py-3 text-sm">
                      <dt className="text-stone-500">{t("create.photos")}</dt>
                      <dd className="text-right font-bold text-[#493629]">{photos.length}</dd>
                    </div>
                    <div className="flex justify-between gap-4 py-3 text-sm">
                      <dt className="text-stone-500">{t("create.features")}</dt>
                      <dd className="text-right font-bold text-[#493629]">{form.features.length}</dd>
                    </div>
                  </dl>
                </div>

                {form.description.trim() && (
                  <div className="mt-5">
                    <h3 className="font-bold text-[#493629]">{t("create.description")}</h3>
                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-stone-600">
                      {form.description}
                    </p>
                  </div>
                )}

                <p className="mt-5 rounded-xl border border-[#e4d5c4] bg-[#f8f0e5] p-4 text-sm leading-6 text-[#72553e]">
                  Publishing will send the information shown above to Rentora. If a field is incorrect, go back to the relevant step before publishing.
                </p>
              </section>
            )}
          </div>

          {submitError && (
            <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
              {submitError}
            </p>
          )}

          <div className="mt-7 flex items-center justify-between gap-3 border-t border-[#eadfd3] pt-5">
            <button
              type="button"
              disabled={step === 0 || busy}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              {t("common.back")}
            </button>
            <span className="hidden text-xs font-semibold text-stone-400 sm:block">
              {step + 1} / {steps.length}
            </span>
            {step < lastStep ? (
              <button
                type="button"
                onClick={goNext}
                disabled={busy}
                className="btn-primary inline-flex items-center gap-2"
              >
                Continue
                <ArrowRight size={16} />
              </button>
            ) : (
              <button type="submit" disabled={busy || limitBlocked} className="btn-primary inline-flex items-center gap-2">
                {busy ? (
                  <>
                    <LoaderCircle className="animate-spin" size={18} />
                    {t("create.publishing")}
                  </>
                ) : (
                  <>
                    <ImagePlus size={18} />
                    {t("create.publish")}
                  </>
                )}
              </button>
            )}
          </div>
        </section>
      </main>

      <aside className="create-summary">
        <div className="create-summary-card">
          <p className="eyebrow">{t("create.summary")}</p>
          <h2>{form.title || t("create.newListing")}</h2>
          <dl>
            <div>
              <dt>{t("create.listingPurpose")}</dt>
              <dd>{selectedListing || t("create.notSelected")}</dd>
            </div>
            <div>
              <dt>{t("create.price")}</dt>
              <dd>
                {form.price
                  ? formattedPrice
                  : t("create.notSpecified")}
              </dd>
            </div>
            <div>
              <dt>{t("property.city")}</dt>
              <dd>{selectedCity}</dd>
            </div>
            <div>
              <dt>{t("create.mainDetails")}</dt>
              <dd>
                {showRooms && form.rooms ? `${form.rooms} / ` : ""}
                {form.area ? `${form.area} m²` : "—"}
              </dd>
            </div>
            <div>
              <dt>{t("create.photos")}</dt>
              <dd>{photos.length}</dd>
            </div>
            <div>
              <dt>{t("create.features")}</dt>
              <dd>{form.features.length}</dd>
            </div>
          </dl>

          {limitBlocked && (
            <p className="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">
              {t("subscription.listingLimitCopy")}
            </p>
          )}

          {step < lastStep ? (
            <button
              type="button"
              onClick={goNext}
              disabled={busy || limitBlocked}
              className="btn-primary w-full gap-2"
            >
              Continue <ArrowRight size={17} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={busy || limitBlocked}
              className="btn-primary w-full gap-2"
            >
              {busy ? t("create.publishing") : t("create.publish")}
            </button>
          )}
        </div>
      </aside>
    </form>
  );
}
