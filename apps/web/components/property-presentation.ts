import type { BuildingType, Currency, Property, PropertyCondition, PropertyFeature, PropertyListing, PropertySort } from "@/types/models";

export const categoryLabels: Record<string, string> = {
  apartament: "Apartment", house: "House", villa: "Villa", land: "Land", office: "Office", commercial: "Commercial", garage: "Garage", warehouse: "Warehouse",
};
export const listingLabels: Record<PropertyListing, string> = { SALE: "For sale", RENT_LONG_TERM: "Long-term rent", RENT_SHORT_TERM: "Short-term rent" };

export const currencySymbols: Record<Currency, string> = { dollar: "$", dram: "֏", euro: "€", rubli: "₽" };

export const sortOptions: Array<{ value: PropertySort; label: string }> = [
  { value: "NEWEST", label: "Newest first" }, { value: "OLDEST", label: "Oldest first" }, { value: "PRICE_ASC", label: "Price: low to high" }, { value: "PRICE_DESC", label: "Price: high to low" }, { value: "MOST_VIEWED", label: "Most viewed" },
];

export const buildingLabels: Record<BuildingType, string> = { MONOLITH: "Monolithic", STONE: "Stone", PANEL: "Panel", BRICK: "Brick", CONCRETE: "Concrete", OTHER: "Other" };
export const conditionLabels: Record<PropertyCondition, string> = { NEW: "New build", EXCELLENT: "Excellent", GOOD: "Good", AVERAGE: "Average", NEEDS_RENOVATION: "Needs renovation", UNDER_CONSTRUCTION: "Under construction" };
export const heatingLabels: Record<string, string> = { GAS_BOILER: "Gas boiler", CENTRAL: "Central heating", INDIVIDUAL: "Individual heating", ELECTRIC: "Electric heating" };

const explicitFeatureLabels: Partial<Record<PropertyFeature, string>> = {
  EV_CHARGING: "EV charging", FREIGHT_ELEVATOR: "Freight elevator", CCTV: "CCTV", WIFI: "Wi-Fi", FIBER_INTERNET: "Fiber internet", WATER_24_7: "24/7 water", AIR_CONDITIONER: "Air conditioning", FLOOR_HEATING: "Underfloor heating", DOUBLE_GLAZED_WINDOWS: "Double-glazed windows", PANORAMIC_WINDOWS: "Panoramic windows", SOUND_INSULATION: "Sound insulation", THERMAL_INSULATION: "Thermal insulation", PETS_ALLOWED: "Pets allowed", CHILDREN_ALLOWED: "Children welcome",
};

export const readableEnum = (value?: string) => value ? value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "";
export const getFeatureLabel = (value: PropertyFeature) => explicitFeatureLabels[value] || readableEnum(value);
export const getCategoryLabel = (value: string) => categoryLabels[value] || readableEnum(value);
export const getListingLabel = (value?: PropertyListing) => value ? listingLabels[value] : "";
export const getCurrencySymbol = (value: Currency) => currencySymbols[value] || "";
export const formatMoney = (value: string | number, currency: Currency) => `${getCurrencySymbol(currency)}${Number(value).toLocaleString()}`;
export const priceOf = (property: Property) => formatMoney(property.price, property.currency);
export const cityOf = (city: string) => readableEnum(city);
