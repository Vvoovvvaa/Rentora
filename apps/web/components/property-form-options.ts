import type { BuildingType, Currency, PropertyCategory, PropertyCondition, PropertyFeature, PropertyListing } from "@/types/models";
import { Building2, CarFront, ChefHat, ShieldCheck, Sofa, Sparkles, TreePine, Wifi } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { buildingLabels, categoryLabels, cityOf, conditionLabels, getFeatureLabel, getListingLabel } from "./property-presentation";

export type FeatureGroup = { id: string; label: string; icon: LucideIcon; options: Array<{ value: PropertyFeature; label: string }> };

const cities = ["YEREVAN", "GYUMRI", "ARTIK", "MARALIK", "VANADZOR", "SPITAK", "ALAVERDI", "STEPANAVAN", "TASHIR", "HRAZDAN", "ABOVYAN", "CHARRENTSAVAN", "TSAGHKADZOR", "BYUREGHAVAN", "ARTASHAT", "MASIS", "VEDI", "ARMAVIR", "VAGHARSHAPAT", "METSAMOR", "GAVAR", "SEVAN", "MARTUNI", "VARDENIS", "CHAMBRAK", "IJEVAN", "DILIJAN", "NOYEMBERYAN", "BERD", "KAPAN", "GORIS", "SISIAN", "MEGHRI", "AGARAK", "YEGHEGNADZOR", "JERMUK", "VAYK", "ASHTARAK", "APARAN", "TALIN"] as const;
const categories: PropertyCategory[] = ["apartament", "house", "villa", "land", "office", "commercial", "garage", "warehouse"];
const listings: PropertyListing[] = ["SALE", "RENT_LONG_TERM", "RENT_SHORT_TERM"];
const conditions: PropertyCondition[] = ["NEW", "EXCELLENT", "GOOD", "AVERAGE", "NEEDS_RENOVATION", "UNDER_CONSTRUCTION"];
const buildings: BuildingType[] = ["MONOLITH", "STONE", "PANEL", "BRICK", "CONCRETE", "OTHER"];

type FeatureGroupDefinition = { id: string; icon: LucideIcon; features: PropertyFeature[] };
const featureGroupDefinitions: FeatureGroupDefinition[] = [
  { id: "parkingBuilding", icon: CarFront, features: ["PARKING", "UNDERGROUND_PARKING", "COVERED_PARKING", "GARAGE", "EV_CHARGING", "ELEVATOR", "FREIGHT_ELEVATOR"] },
  { id: "securityAccess", icon: ShieldCheck, features: ["SECURITY", "CCTV", "INTERCOM", "VIDEO_INTERCOM", "CONCIERGE", "GATED_ENTRANCE", "GATED_YARD", "ALARM_SYSTEM", "FIRE_ALARM", "SMOKE_DETECTOR", "WHEELCHAIR_ACCESS", "RAMP"] },
  { id: "outdoorSpace", icon: TreePine, features: ["BALCONY", "OPEN_BALCONY", "CLOSED_BALCONY", "LOGGIA", "TERRACE", "PRIVATE_YARD", "GARDEN", "ROOFTOP_ACCESS"] },
  { id: "comfort", icon: Sofa, features: ["FURNISHED", "PARTIALLY_FURNISHED", "BUILT_IN_FURNITURE", "BUILT_IN_WARDROBE", "WALK_IN_CLOSET", "BUILT_IN_KITCHEN", "AIR_CONDITIONER", "FLOOR_HEATING", "FIREPLACE"] },
  { id: "kitchenAppliances", icon: ChefHat, features: ["REFRIGERATOR", "FREEZER", "GAS_STOVE", "ELECTRIC_STOVE", "INDUCTION_STOVE", "OVEN", "MICROWAVE", "DISHWASHER", "KITCHEN_HOOD", "WASHING_MACHINE", "DRYER"] },
  { id: "heatingUtilities", icon: Wifi, features: ["HOT_WATER", "GAS", "WATER_24_7", "WATER_TANK", "WATER_FILTER", "BACKUP_GENERATOR", "SOLAR_PANELS", "INTERNET", "WIFI", "FIBER_INTERNET", "CABLE_TV", "TV", "SMART_TV"] },
  { id: "otherFeatures", icon: Sparkles, features: ["BATHTUB", "SHOWER", "SHOWER_CABIN", "BIDET", "STORAGE_ROOM", "BASEMENT", "PANTRY", "DOUBLE_GLAZED_WINDOWS", "PANORAMIC_WINDOWS", "SOUND_INSULATION", "THERMAL_INSULATION", "CITY_VIEW", "MOUNTAIN_VIEW", "COURTYARD_VIEW", "STREET_VIEW", "PETS_ALLOWED", "CHILDREN_ALLOWED"] },
  { id: "otherFeatures", icon: Building2, features: [] },
];

export const getCityOptions = () => cities.map((value) => ({ value, label: cityOf(value) }));
export const getCategoryOptions = () => categories.map((value) => ({ value, label: categoryLabels[value] || value }));
export const currencyOptions: Array<{ value: Currency; label: string }> = [{ value: "dram", label: "AMD ֏" }, { value: "dollar", label: "USD $" }, { value: "euro", label: "EUR €" }, { value: "rubli", label: "RUB ₽" }];
export const getListingOptions = () => listings.map((value) => ({ value, label: getListingLabel(value) }));
export const getConditionOptions = () => conditions.map((value) => ({ value, label: conditionLabels[value] || value }));
export const getBuildingOptions = () => buildings.map((value) => ({ value, label: buildingLabels[value] || value }));
export const getFeatureGroups = (labelForGroup: (id: string) => string): FeatureGroup[] => featureGroupDefinitions.filter((group) => group.features.length > 0).map((group) => ({ id: group.id, label: labelForGroup(group.id), icon: group.icon, options: group.features.map((value) => ({ value, label: getFeatureLabel(value) })) }));
