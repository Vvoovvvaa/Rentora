import type { BuildingType, Currency, PropertyCategory, PropertyCondition, PropertyFeature, PropertyListing } from "@/types/models";
import { Building2, CarFront, ChefHat, ShieldCheck, Sofa, Sparkles, TreePine, Wifi } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type FeatureGroup = { label: string; icon: LucideIcon; options: Array<{ value: PropertyFeature; label: string }> };

export const cityOptions = [
  ["YEREVAN", "Ереван"], ["GYUMRI", "Гюмри"], ["ARTIK", "Артик"], ["MARALIK", "Маралик"], ["VANADZOR", "Ванадзор"], ["SPITAK", "Спитак"], ["ALAVERDI", "Алаверди"], ["STEPANAVAN", "Степанаван"], ["TASHIR", "Ташир"],
  ["HRAZDAN", "Раздан"], ["ABOVYAN", "Абовян"], ["CHARRENTSAVAN", "Чаренцаван"], ["TSAGHKADZOR", "Цахкадзор"], ["BYUREGHAVAN", "Бюрегаван"], ["ARTASHAT", "Арташат"], ["MASIS", "Масис"], ["VEDI", "Веди"], ["ARMAVIR", "Армавир"], ["VAGHARSHAPAT", "Вагаршапат"], ["METSAMOR", "Мецамор"],
  ["GAVAR", "Гавар"], ["SEVAN", "Севан"], ["MARTUNI", "Мартуни"], ["VARDENIS", "Варденис"], ["CHAMBRAK", "Чамбарак"], ["IJEVAN", "Иджеван"], ["DILIJAN", "Дилижан"], ["NOYEMBERYAN", "Ноемберян"], ["BERD", "Берд"], ["KAPAN", "Капан"], ["GORIS", "Горис"], ["SISIAN", "Сисиан"], ["MEGHRI", "Мегри"], ["AGARAK", "Агарак"], ["YEGHEGNADZOR", "Ехегнадзор"], ["JERMUK", "Джермук"], ["VAYK", "Вайк"], ["ASHTARAK", "Аштарак"], ["APARAN", "Апааран"], ["TALIN", "Талин"],
] as const;

export const categoryOptions: Array<{ value: PropertyCategory; label: string }> = [
  { value: "apartament", label: "Квартира" }, { value: "house", label: "Дом" }, { value: "villa", label: "Вилла" }, { value: "land", label: "Земельный участок" }, { value: "office", label: "Офис" }, { value: "commercial", label: "Коммерческая недвижимость" }, { value: "garage", label: "Гараж" }, { value: "warehouse", label: "Склад" },
];
export const currencyOptions: Array<{ value: Currency; label: string }> = [{ value: "dram", label: "AMD ֏" }, { value: "dollar", label: "USD $" }, { value: "euro", label: "EUR €" }, { value: "rubli", label: "RUB ₽" }];
export const listingOptions: Array<{ value: PropertyListing; label: string }> = [{ value: "SALE", label: "Продажа" }, { value: "RENT_LONG_TERM", label: "Долгосрочная аренда" }, { value: "RENT_SHORT_TERM", label: "Краткосрочная аренда" }];
export const conditionOptions: Array<{ value: PropertyCondition; label: string }> = [{ value: "NEW", label: "Новостройка" }, { value: "EXCELLENT", label: "Отличное" }, { value: "GOOD", label: "Хорошее" }, { value: "AVERAGE", label: "Среднее" }, { value: "NEEDS_RENOVATION", label: "Нужен ремонт" }, { value: "UNDER_CONSTRUCTION", label: "Строится" }];
export const buildingOptions: Array<{ value: BuildingType; label: string }> = [{ value: "MONOLITH", label: "Монолитный" }, { value: "STONE", label: "Каменный" }, { value: "PANEL", label: "Панельный" }, { value: "BRICK", label: "Кирпичный" }, { value: "CONCRETE", label: "Бетонный" }, { value: "OTHER", label: "Другое" }];

const group = (label: string, icon: LucideIcon, options: Array<[PropertyFeature, string]>): FeatureGroup => ({ label, icon, options: options.map(([value, optionLabel]) => ({ value, label: optionLabel })) });
export const featureGroups: FeatureGroup[] = [
  group("Парковка и здание", CarFront, [["PARKING", "Парковка"], ["UNDERGROUND_PARKING", "Подземная парковка"], ["COVERED_PARKING", "Крытая парковка"], ["GARAGE", "Гараж"], ["EV_CHARGING", "Зарядка для электромобиля"], ["ELEVATOR", "Лифт"], ["FREIGHT_ELEVATOR", "Грузовой лифт"]]),
  group("Безопасность и доступность", ShieldCheck, [["SECURITY", "Охрана"], ["CCTV", "Видеонаблюдение"], ["INTERCOM", "Домофон"], ["VIDEO_INTERCOM", "Видеодомофон"], ["CONCIERGE", "Консьерж"], ["GATED_ENTRANCE", "Закрытый вход"], ["GATED_YARD", "Закрытый двор"], ["ALARM_SYSTEM", "Сигнализация"], ["FIRE_ALARM", "Пожарная сигнализация"], ["SMOKE_DETECTOR", "Датчик дыма"], ["WHEELCHAIR_ACCESS", "Доступ для колясок"], ["RAMP", "Пандус"]]),
  group("Балкон и территория", TreePine, [["BALCONY", "Балкон"], ["OPEN_BALCONY", "Открытый балкон"], ["CLOSED_BALCONY", "Закрытый балкон"], ["LOGGIA", "Лоджия"], ["TERRACE", "Терраса"], ["PRIVATE_YARD", "Частный двор"], ["GARDEN", "Сад"], ["ROOFTOP_ACCESS", "Выход на крышу"]]),
  group("Мебель и комфорт", Sofa, [["FURNISHED", "С мебелью"], ["PARTIALLY_FURNISHED", "Частично меблирована"], ["BUILT_IN_FURNITURE", "Встроенная мебель"], ["BUILT_IN_WARDROBE", "Встроенный шкаф"], ["WALK_IN_CLOSET", "Гардеробная"], ["BUILT_IN_KITCHEN", "Встроенная кухня"], ["AIR_CONDITIONER", "Кондиционер"], ["FLOOR_HEATING", "Тёплый пол"], ["FIREPLACE", "Камин"]]),
  group("Кухня и техника", ChefHat, [["REFRIGERATOR", "Холодильник"], ["FREEZER", "Морозильная камера"], ["GAS_STOVE", "Газовая плита"], ["ELECTRIC_STOVE", "Электрическая плита"], ["INDUCTION_STOVE", "Индукционная плита"], ["OVEN", "Духовой шкаф"], ["MICROWAVE", "Микроволновая печь"], ["DISHWASHER", "Посудомоечная машина"], ["KITCHEN_HOOD", "Вытяжка"], ["WASHING_MACHINE", "Стиральная машина"], ["DRYER", "Сушильная машина"]]),
  group("Коммуникации", Wifi, [["HOT_WATER", "Горячая вода"], ["GAS", "Газ"], ["WATER_24_7", "Вода 24/7"], ["WATER_TANK", "Резервуар воды"], ["WATER_FILTER", "Фильтр воды"], ["BACKUP_GENERATOR", "Резервный генератор"], ["SOLAR_PANELS", "Солнечные панели"], ["INTERNET", "Интернет"], ["WIFI", "Wi‑Fi"], ["FIBER_INTERNET", "Оптоволоконный интернет"], ["CABLE_TV", "Кабельное ТВ"], ["TV", "Телевизор"], ["SMART_TV", "Smart TV"]]),
  group("Ванная и хранение", Sparkles, [["BATHTUB", "Ванна"], ["SHOWER", "Душ"], ["SHOWER_CABIN", "Душевая кабина"], ["BIDET", "Биде"], ["STORAGE_ROOM", "Кладовая"], ["BASEMENT", "Подвал"], ["PANTRY", "Кладовая для продуктов"]]),
  group("Окна, вид и другое", Building2, [["DOUBLE_GLAZED_WINDOWS", "Стеклопакеты"], ["PANORAMIC_WINDOWS", "Панорамные окна"], ["SOUND_INSULATION", "Шумоизоляция"], ["THERMAL_INSULATION", "Теплоизоляция"], ["CITY_VIEW", "Вид на город"], ["MOUNTAIN_VIEW", "Вид на горы"], ["COURTYARD_VIEW", "Вид во двор"], ["STREET_VIEW", "Вид на улицу"], ["PETS_ALLOWED", "Можно с питомцами"], ["CHILDREN_ALLOWED", "Можно с детьми"]]),
];
