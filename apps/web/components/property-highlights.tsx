import { Bath, BedDouble, Building2, CalendarDays, CarFront, ChefHat, Flame, Layers3, Mountain, PanelsTopLeft, PawPrint, Refrigerator, Ruler, ShieldCheck, Snowflake, Sofa, Sparkles, TreePine, WashingMachine, Wifi } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Property, PropertyFeature } from "@/types/models";
import { featureGroups } from "./property-form-options";
import { buildingLabels, conditionLabels, getFeatureLabel, readableEnum } from "./property-presentation";

export const featureGroupLabels: Record<string, string> = {
  "Парковка и здание": "Parking & building",
  "Безопасность и доступность": "Security & access",
  "Балкон и территория": "Outdoor space",
  "Мебель и комфорт": "Comfort",
  "Кухня и техника": "Kitchen & appliances",
  "Коммуникации": "Utilities & connectivity",
  "Ванная и хранение": "Bathroom & storage",
  "Окна, вид и другое": "Windows & surroundings",
};

const featureIcons: Partial<Record<PropertyFeature, LucideIcon>> = {
  PARKING: CarFront, UNDERGROUND_PARKING: CarFront, COVERED_PARKING: CarFront, GARAGE: CarFront, EV_CHARGING: CarFront,
  ELEVATOR: Building2, FREIGHT_ELEVATOR: Building2,
  SECURITY: ShieldCheck, CCTV: ShieldCheck, INTERCOM: ShieldCheck, VIDEO_INTERCOM: ShieldCheck, CONCIERGE: ShieldCheck, GATED_ENTRANCE: ShieldCheck, GATED_YARD: ShieldCheck, ALARM_SYSTEM: ShieldCheck, FIRE_ALARM: ShieldCheck, SMOKE_DETECTOR: ShieldCheck, WHEELCHAIR_ACCESS: ShieldCheck, RAMP: ShieldCheck,
  BALCONY: TreePine, OPEN_BALCONY: TreePine, CLOSED_BALCONY: TreePine, LOGGIA: TreePine, TERRACE: TreePine, PRIVATE_YARD: TreePine, GARDEN: TreePine, ROOFTOP_ACCESS: TreePine,
  FURNISHED: Sofa, PARTIALLY_FURNISHED: Sofa, BUILT_IN_FURNITURE: Sofa, BUILT_IN_WARDROBE: Sofa, WALK_IN_CLOSET: Sofa, BUILT_IN_KITCHEN: ChefHat,
  AIR_CONDITIONER: Snowflake, FLOOR_HEATING: Flame, FIREPLACE: Flame,
  REFRIGERATOR: Refrigerator, FREEZER: Refrigerator, GAS_STOVE: ChefHat, ELECTRIC_STOVE: ChefHat, INDUCTION_STOVE: ChefHat, OVEN: ChefHat, MICROWAVE: ChefHat, DISHWASHER: ChefHat, KITCHEN_HOOD: ChefHat, WASHING_MACHINE: WashingMachine, DRYER: WashingMachine,
  HOT_WATER: Bath, GAS: Flame, WATER_24_7: Bath, WATER_TANK: Bath, WATER_FILTER: Bath, BACKUP_GENERATOR: PanelsTopLeft, SOLAR_PANELS: PanelsTopLeft, INTERNET: Wifi, WIFI: Wifi, FIBER_INTERNET: Wifi, CABLE_TV: PanelsTopLeft, TV: PanelsTopLeft, SMART_TV: PanelsTopLeft,
  BATHTUB: Bath, SHOWER: Bath, SHOWER_CABIN: Bath, BIDET: Bath,
  DOUBLE_GLAZED_WINDOWS: PanelsTopLeft, PANORAMIC_WINDOWS: PanelsTopLeft, SOUND_INSULATION: PanelsTopLeft, THERMAL_INSULATION: PanelsTopLeft, CITY_VIEW: Building2, MOUNTAIN_VIEW: Mountain, COURTYARD_VIEW: TreePine, STREET_VIEW: Building2, PETS_ALLOWED: PawPrint, CHILDREN_ALLOWED: Sparkles,
};

const detailItems = (property: Property) => [
  { icon: BedDouble, label: "Bedrooms", value: property.bedrooms },
  { icon: Bath, label: "Bathrooms", value: property.bathrooms },
  { icon: Layers3, label: "Floor", value: property.floor && property.totalFloors ? `${property.floor} of ${property.totalFloors}` : property.floor },
  { icon: Ruler, label: "Ceiling height", value: property.ceilingHeight ? `${property.ceilingHeight} m` : undefined },
  { icon: CalendarDays, label: "Year built", value: property.constructionYear },
  { icon: Building2, label: "Building type", value: property.buildingType ? buildingLabels[property.buildingType] || readableEnum(property.buildingType) : undefined },
  { icon: Sparkles, label: "Condition", value: property.condition ? conditionLabels[property.condition] || readableEnum(property.condition) : undefined },
];

export function PropertyCharacteristics({ property }: { property: Property }) {
  const items = detailItems(property).filter((item): item is typeof item & { value: string | number } => item.value !== undefined && item.value !== null);
  if (!items.length) return null;
  return <section className="property-characteristics" aria-labelledby="characteristics-title">
    <h2 id="characteristics-title">Property details</h2>
    <div className="characteristics-grid">{items.map(({ icon: Icon, label, value }) => <div className="characteristic-item" key={label}><Icon size={18}/><span><small>{label}</small><strong>{value}</strong></span></div>)}</div>
  </section>;
}

export function PropertyHighlights({ features = [] }: { features?: PropertyFeature[] }) {
  const featureSet = new Set(features);
  const selectedGroups = featureGroups.map((group) => ({
    ...group,
    displayLabel: featureGroupLabels[group.label] || group.label,
    options: group.options.filter((option) => featureSet.has(option.value)),
  })).filter((group) => group.options.length > 0);
  if (!selectedGroups.length) return null;
  return <section className="property-highlights" aria-labelledby="property-highlights-title">
    <p className="eyebrow">Features</p>
    <h2 id="property-highlights-title">What this home offers</h2>
    <div className="property-feature-groups">
      {selectedGroups.map(({ displayLabel, icon: Icon, options }) => <section className="property-feature-group" key={displayLabel} aria-label={displayLabel}>
        <h3><Icon size={17}/>{displayLabel}</h3>
        <div className="highlights-grid">
          {options.map((option) => { const FeatureIcon = featureIcons[option.value] || Icon; return <div className="highlight-chip" key={option.value}><FeatureIcon size={18}/><span>{getFeatureLabel(option.value)}</span></div>; })}
        </div>
      </section>)}
    </div>
  </section>;
}
