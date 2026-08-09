export type PropertyCategory = "apartament" | "house" | "villa" | "land" | "office" | "commercial" | "garage" | "warehouse";
export type Currency = "dollar" | "rubli" | "euro" | "dram";
export type PropertyListing = "SALE" | "RENT_LONG_TERM" | "RENT_SHORT_TERM";
export type PropertySort = "PRICE_ASC" | "PRICE_DESC" | "NEWEST" | "OLDEST" | "MOST_VIEWED";
export type ReportReason = "FRAUD" | "INCCORECT_PRICE" | "PROPERTY_ALREADY_SOLD" | "INCORRECT_INFORMATION" | "DUBLICATE" | "OTHER";
export type PropertyCondition = "NEW" | "EXCELLENT" | "GOOD" | "AVERAGE" | "NEEDS_RENOVATION" | "UNDER_CONSTRUCTION";
export type BuildingType = "STONE" | "PANEL" | "BRICK" | "MONOLITH" | "CONCRETE" | "OTHER";
export type PropertyFeature =
  | "PARKING" | "UNDERGROUND_PARKING" | "COVERED_PARKING" | "GARAGE" | "EV_CHARGING"
  | "ELEVATOR" | "FREIGHT_ELEVATOR" | "SECURITY" | "CCTV" | "INTERCOM" | "VIDEO_INTERCOM" | "CONCIERGE" | "GATED_ENTRANCE" | "GATED_YARD" | "ALARM_SYSTEM" | "FIRE_ALARM" | "SMOKE_DETECTOR"
  | "WHEELCHAIR_ACCESS" | "RAMP" | "BALCONY" | "OPEN_BALCONY" | "CLOSED_BALCONY" | "LOGGIA" | "TERRACE" | "PRIVATE_YARD" | "GARDEN" | "ROOFTOP_ACCESS"
  | "FURNISHED" | "PARTIALLY_FURNISHED" | "BUILT_IN_FURNITURE" | "BUILT_IN_WARDROBE" | "WALK_IN_CLOSET" | "BUILT_IN_KITCHEN"
  | "AIR_CONDITIONER" | "FLOOR_HEATING" | "FIREPLACE" | "REFRIGERATOR" | "FREEZER" | "GAS_STOVE" | "ELECTRIC_STOVE" | "INDUCTION_STOVE" | "OVEN" | "MICROWAVE" | "DISHWASHER" | "KITCHEN_HOOD"
  | "WASHING_MACHINE" | "DRYER" | "HOT_WATER" | "GAS" | "WATER_24_7" | "WATER_TANK" | "WATER_FILTER" | "BACKUP_GENERATOR" | "SOLAR_PANELS"
  | "INTERNET" | "WIFI" | "FIBER_INTERNET" | "CABLE_TV" | "TV" | "SMART_TV" | "BATHTUB" | "SHOWER" | "SHOWER_CABIN" | "BIDET"
  | "STORAGE_ROOM" | "BASEMENT" | "PANTRY" | "DOUBLE_GLAZED_WINDOWS" | "PANORAMIC_WINDOWS" | "SOUND_INSULATION" | "THERMAL_INSULATION"
  | "CITY_VIEW" | "MOUNTAIN_VIEW" | "COURTYARD_VIEW" | "STREET_VIEW" | "PETS_ALLOWED" | "CHILDREN_ALLOWED";

export interface UserImage { id: number; url: string; }
export interface User { id: number; name: string; phone: string; age: number; gmail: string; gmailStatus: string; userRole: string; accauntStatus: string; image?: UserImage; properties?: Property[]; }
export interface PropertyImage { id: number; url: string; size: number; }
export interface Property { id: number; title: string; description: string; status: string; category: PropertyCategory; listing?: PropertyListing; price: number | string; currency: Currency; views: number; city: string; rooms: number; area: number; bedrooms?: number; bathrooms?: number; floor?: number; totalFloors?: number; ceilingHeight?: number; constructionYear?: number; condition?: PropertyCondition; buildingType?: BuildingType; heatingType?: string; features?: PropertyFeature[]; createdAt?: string; owner?: User; images?: PropertyImage[]; }
export interface ComparedProperty extends Property { pricePerSquareMeter: number; }
export interface CompareResponse { firstProperty: ComparedProperty; secondProperty: ComparedProperty; }
export interface AuthResponse { accessToken: string; message: string; }
export interface ChatRoom { id: number; propertyId: number; ownerId: number; clientId: number; createdAt?: string; }
export interface ChatMessage { id: number; roomId: number; senderId: number; text: string; createdAt: string; }
export interface SearchParams { city?: string; category?: PropertyCategory; listing?: PropertyListing; minPrice?: number; maxPrice?: number; rooms?: number; area?: number; sort?: PropertySort; bedrooms?: number; floor?: number; constructionYear?: number; features?: PropertyFeature; }
