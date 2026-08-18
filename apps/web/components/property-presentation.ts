import type {
  BuildingType,
  Currency,
  Property,
  PropertyCondition,
  PropertyFeature,
  PropertyListing,
  PropertyPublishing,
  PropertySort,
} from '@/types/models';
import { formatLocalizedNumber, type Locale } from '@/lib/i18n';

type Localized = Record<Locale, string>;
const localized = (en: string, ru: string, am: string): Localized => ({
  en,
  ru,
  am,
});
let presentationLocale: Locale = 'en';
export const setPresentationLocale = (locale: Locale) => {
  presentationLocale = locale;
};
const pick = (entry: Localized) => entry[presentationLocale];

const categories: Record<string, Localized> = {
  apartament: localized('Apartment', 'Квартира', 'Բնակարան'),
  house: localized('House', 'Дом', 'Տուն'),
  villa: localized('Villa', 'Вилла', 'Վիլլա'),
  land: localized('Land', 'Земельный участок', 'Հողատարածք'),
  office: localized('Office', 'Офис', 'Գրասենյակ'),
  commercial: localized(
    'Commercial',
    'Коммерческая недвижимость',
    'Կոմերցիոն գույք',
  ),
  garage: localized('Garage', 'Гараж', 'Ավտոտնակ'),
  warehouse: localized('Warehouse', 'Склад', 'Պահեստ'),
};
const listings: Record<PropertyListing, Localized> = {
  SALE: localized('For sale', 'Продажа', 'Վաճառք'),
  RENT_LONG_TERM: localized(
    'Long-term rent',
    'Долгосрочная аренда',
    'Երկարաժամկետ վարձակալություն',
  ),
  RENT_SHORT_TERM: localized(
    'Short-term rent',
    'Краткосрочная аренда',
    'Կարճաժամկետ վարձակալություն',
  ),
};
const buildings: Record<BuildingType, Localized> = {
  MONOLITH: localized('Monolithic', 'Монолитный', 'Մոնոլիտ'),
  STONE: localized('Stone', 'Каменный', 'Քարե'),
  PANEL: localized('Panel', 'Панельный', 'Պանելային'),
  BRICK: localized('Brick', 'Кирпичный', 'Աղյուսե'),
  CONCRETE: localized('Concrete', 'Бетонный', 'Բետոնե'),
  OTHER: localized('Other', 'Другое', 'Այլ'),
};
const conditions: Record<PropertyCondition, Localized> = {
  NEW: localized('New build', 'Новостройка', 'Նորակառույց'),
  EXCELLENT: localized('Excellent', 'Отличное', 'Գերազանց'),
  GOOD: localized('Good', 'Хорошее', 'Լավ'),
  AVERAGE: localized('Average', 'Среднее', 'Միջին'),
  NEEDS_RENOVATION: localized(
    'Needs renovation',
    'Нужен ремонт',
    'Վերանորոգման կարիք ունի',
  ),
  UNDER_CONSTRUCTION: localized(
    'Under construction',
    'Строится',
    'Կառուցվում է',
  ),
};
const heating: Record<string, Localized> = {
  GAS_BOILER: localized('Gas boiler', 'Газовый котёл', 'Գազի կաթսա'),
  CENTRAL: localized(
    'Central heating',
    'Центральное отопление',
    'Կենտրոնական ջեռուցում',
  ),
  INDIVIDUAL: localized(
    'Individual heating',
    'Индивидуальное отопление',
    'Անհատական ջեռուցում',
  ),
  ELECTRIC: localized(
    'Electric heating',
    'Электрическое отопление',
    'Էլեկտրական ջեռուցում',
  ),
};

const features: Partial<Record<PropertyFeature, Localized>> = {
  PARKING: localized('Parking', 'Парковка', 'Կայանում'),
  UNDERGROUND_PARKING: localized(
    'Underground parking',
    'Подземная парковка',
    'Ստորգետնյա կայանում',
  ),
  COVERED_PARKING: localized(
    'Covered parking',
    'Крытая парковка',
    'Ծածկված կայանում',
  ),
  GARAGE: localized('Garage', 'Гараж', 'Ավտոտնակ'),
  EV_CHARGING: localized(
    'EV charging',
    'Зарядка для электромобиля',
    'Էլեկտրամեքենայի լիցքավորում',
  ),
  ELEVATOR: localized('Elevator', 'Лифт', 'Վերելակ'),
  FREIGHT_ELEVATOR: localized(
    'Freight elevator',
    'Грузовой лифт',
    'Բեռնատար վերելակ',
  ),
  SECURITY: localized('Security', 'Охрана', 'Անվտանգություն'),
  CCTV: localized('CCTV', 'Видеонаблюдение', 'Տեսահսկում'),
  INTERCOM: localized('Intercom', 'Домофон', 'Դոմոֆոն'),
  VIDEO_INTERCOM: localized('Video intercom', 'Видеодомофон', 'Տեսադոմոֆոն'),
  CONCIERGE: localized('Concierge', 'Консьерж', 'Դռնապան'),
  GATED_ENTRANCE: localized('Gated entrance', 'Закрытый вход', 'Փակ մուտք'),
  GATED_YARD: localized('Gated yard', 'Закрытый двор', 'Փակ բակ'),
  ALARM_SYSTEM: localized(
    'Alarm system',
    'Сигнализация',
    'Ահազանգման համակարգ',
  ),
  FIRE_ALARM: localized(
    'Fire alarm',
    'Пожарная сигнализация',
    'Հրդեհային ազդանշան',
  ),
  SMOKE_DETECTOR: localized('Smoke detector', 'Датчик дыма', 'Ծխի ազդանշան'),
  WHEELCHAIR_ACCESS: localized(
    'Wheelchair access',
    'Доступ для колясок',
    'Սայլակի հասանելիություն',
  ),
  RAMP: localized('Ramp', 'Пандус', 'Թեքահարթակ'),
  BALCONY: localized('Balcony', 'Балкон', 'Պատշգամբ'),
  OPEN_BALCONY: localized('Open balcony', 'Открытый балкон', 'Բաց պատշգամբ'),
  CLOSED_BALCONY: localized(
    'Closed balcony',
    'Закрытый балкон',
    'Փակ պատշգամբ',
  ),
  LOGGIA: localized('Loggia', 'Лоджия', 'Լոջիա'),
  TERRACE: localized('Terrace', 'Терраса', 'Տեռասա'),
  PRIVATE_YARD: localized('Private yard', 'Частный двор', 'Անձնական բակ'),
  GARDEN: localized('Garden', 'Сад', 'Այգի'),
  ROOFTOP_ACCESS: localized('Rooftop access', 'Выход на крышу', 'Տանիք ելք'),
  FURNISHED: localized('Furnished', 'С мебелью', 'Կահավորված'),
  PARTIALLY_FURNISHED: localized(
    'Partly furnished',
    'Частично меблирована',
    'Մասամբ կահավորված',
  ),
  BUILT_IN_FURNITURE: localized(
    'Built-in furniture',
    'Встроенная мебель',
    'Ներկառուցված կահույք',
  ),
  BUILT_IN_WARDROBE: localized(
    'Built-in wardrobe',
    'Встроенный шкаф',
    'Ներկառուցված պահարան',
  ),
  WALK_IN_CLOSET: localized('Walk-in closet', 'Гардеробная', 'Հանդերձարան'),
  BUILT_IN_KITCHEN: localized(
    'Built-in kitchen',
    'Встроенная кухня',
    'Ներկառուցված խոհանոց',
  ),
  AIR_CONDITIONER: localized('Air conditioning', 'Кондиционер', 'Օդորակիչ'),
  FLOOR_HEATING: localized('Underfloor heating', 'Тёплый пол', 'Տաք հատակ'),
  FIREPLACE: localized('Fireplace', 'Камин', 'Բուխարի'),
  REFRIGERATOR: localized('Refrigerator', 'Холодильник', 'Սառնարան'),
  FREEZER: localized('Freezer', 'Морозильная камера', 'Սառցախցիկ'),
  GAS_STOVE: localized('Gas stove', 'Газовая плита', 'Գազօջախ'),
  ELECTRIC_STOVE: localized(
    'Electric stove',
    'Электрическая плита',
    'Էլեկտրական սալօջախ',
  ),
  INDUCTION_STOVE: localized(
    'Induction stove',
    'Индукционная плита',
    'Ինդուկցիոն սալօջախ',
  ),
  OVEN: localized('Oven', 'Духовой шкаф', 'Ջեռոց'),
  MICROWAVE: localized(
    'Microwave',
    'Микроволновая печь',
    'Միկրոալիքային վառարան',
  ),
  DISHWASHER: localized(
    'Dishwasher',
    'Посудомоечная машина',
    'Սպասք լվացող մեքենա',
  ),
  KITCHEN_HOOD: localized('Kitchen hood', 'Вытяжка', 'Խոհանոցային օդաքաշ'),
  WASHING_MACHINE: localized(
    'Washing machine',
    'Стиральная машина',
    'Լվացքի մեքենա',
  ),
  DRYER: localized('Dryer', 'Сушильная машина', 'Չորանոց'),
  HOT_WATER: localized('Hot water', 'Горячая вода', 'Տաք ջուր'),
  GAS: localized('Gas', 'Газ', 'Գազ'),
  WATER_24_7: localized('24/7 water', 'Вода 24/7', 'Ջուր 24/7'),
  WATER_TANK: localized('Water tank', 'Резервуар воды', 'Ջրի բաք'),
  WATER_FILTER: localized('Water filter', 'Фильтр воды', 'Ջրի զտիչ'),
  BACKUP_GENERATOR: localized(
    'Backup generator',
    'Резервный генератор',
    'Պահուստային գեներատոր',
  ),
  SOLAR_PANELS: localized(
    'Solar panels',
    'Солнечные панели',
    'Արևային վահանակներ',
  ),
  INTERNET: localized('Internet', 'Интернет', 'Ինտերնետ'),
  WIFI: localized('Wi-Fi', 'Wi‑Fi', 'Wi‑Fi'),
  FIBER_INTERNET: localized(
    'Fiber internet',
    'Оптоволоконный интернет',
    'Օպտիկամանրաթելային ինտերնետ',
  ),
  CABLE_TV: localized(
    'Cable TV',
    'Кабельное ТВ',
    'Կաբելային հեռուստատեսություն',
  ),
  TV: localized('TV', 'Телевизор', 'Հեռուստացույց'),
  SMART_TV: localized('Smart TV', 'Smart TV', 'Խելացի հեռուստացույց'),
  BATHTUB: localized('Bathtub', 'Ванна', 'Լոգարան'),
  SHOWER: localized('Shower', 'Душ', 'Ցնցուղ'),
  SHOWER_CABIN: localized('Shower cabin', 'Душевая кабина', 'Ցնցուղախցիկ'),
  BIDET: localized('Bidet', 'Биде', 'Բիդե'),
  STORAGE_ROOM: localized('Storage room', 'Кладовая', 'Պահեստասենյակ'),
  BASEMENT: localized('Basement', 'Подвал', 'Նկուղ'),
  PANTRY: localized('Pantry', 'Кладовая для продуктов', 'Մառան'),
  DOUBLE_GLAZED_WINDOWS: localized(
    'Double-glazed windows',
    'Стеклопакеты',
    'Երկշերտ ապակիներ',
  ),
  PANORAMIC_WINDOWS: localized(
    'Panoramic windows',
    'Панорамные окна',
    'Համայնապատկերային պատուհաններ',
  ),
  SOUND_INSULATION: localized(
    'Sound insulation',
    'Шумоизоляция',
    'Ձայնամեկուսացում',
  ),
  THERMAL_INSULATION: localized(
    'Thermal insulation',
    'Теплоизоляция',
    'Ջերմամեկուսացում',
  ),
  CITY_VIEW: localized('City view', 'Вид на город', 'Քաղաքի տեսարան'),
  MOUNTAIN_VIEW: localized('Mountain view', 'Вид на горы', 'Լեռների տեսարան'),
  COURTYARD_VIEW: localized('Courtyard view', 'Вид во двор', 'Բակի տեսարան'),
  STREET_VIEW: localized('Street view', 'Вид на улицу', 'Փողոցի տեսարան'),
  PETS_ALLOWED: localized(
    'Pets allowed',
    'Можно с питомцами',
    'Թույլատրվում են կենդանիներ',
  ),
  CHILDREN_ALLOWED: localized(
    'Children welcome',
    'Можно с детьми',
    'Թույլատրվում են երեխաներ',
  ),
};

const cityNames: Record<string, Localized> = {
  YEREVAN: localized('Yerevan', 'Ереван', 'Երևան'),
  GYUMRI: localized('Gyumri', 'Гюмри', 'Գյումրի'),
  VANADZOR: localized('Vanadzor', 'Ванадзор', 'Վանաձոր'),
  DILIJAN: localized('Dilijan', 'Дилижан', 'Դիլիջան'),
  TSAGHKADZOR: localized('Tsaghkadzor', 'Цахкадзор', 'Ծաղկաձոր'),
  SEVAN: localized('Sevan', 'Севан', 'Սևան'),
  JERMUK: localized('Jermuk', 'Джермук', 'Ջերմուկ'),
};

export const getCategoryLabel = (value: string) =>
  categories[value] ? pick(categories[value]) : readableEnum(value);
export const getListingLabel = (value?: PropertyListing) =>
  value && listings[value] ? pick(listings[value]) : '';
export const getBuildingLabel = (value?: BuildingType) =>
  value && buildings[value] ? pick(buildings[value]) : '';
export const getConditionLabel = (value?: PropertyCondition) =>
  value && conditions[value] ? pick(conditions[value]) : '';
export const getHeatingLabel = (value?: string) =>
  value && heating[value] ? pick(heating[value]) : '';

const localizedRecord = <T extends string>(
  keys: readonly T[],
  labelFor: (key: T) => string,
) =>
  new Proxy({} as Record<T, string>, {
    get: (_target, property) =>
      typeof property === 'string' ? labelFor(property as T) : undefined,
    ownKeys: () => [...keys],
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
  });

// Labels are resolved lazily because locale is client-side state, not a module constant.
export const categoryLabels = localizedRecord(
  Object.keys(categories),
  getCategoryLabel,
);
export const listingLabels = localizedRecord(
  Object.keys(listings) as PropertyListing[],
  getListingLabel,
);
export const currencySymbols: Record<Currency, string> = {
  dollar: '$',
  dram: '֏',
  euro: '€',
  rubli: '₽',
};
export const sortOptions: Array<{ value: PropertySort; label: string }> = [
  { value: 'NEWEST', label: 'Newest first' },
  { value: 'OLDEST', label: 'Oldest first' },
  { value: 'PRICE_ASC', label: 'Price: low to high' },
  { value: 'PRICE_DESC', label: 'Price: high to low' },
  { value: 'MOST_VIEWED', label: 'Most viewed' },
];
export const getSortOptions = (): Array<{
  value: PropertySort;
  label: string;
}> => {
  const labels: Record<PropertySort, Localized> = {
    NEWEST: localized('Newest first', 'Сначала новые', 'Նախ նորերը'),
    OLDEST: localized('Oldest first', 'Сначала старые', 'Նախ հները'),
    PRICE_ASC: localized(
      'Price: low to high',
      'Цена: по возрастанию',
      'Գին՝ ցածրից բարձր',
    ),
    PRICE_DESC: localized(
      'Price: high to low',
      'Цена: по убыванию',
      'Գին՝ բարձրից ցածր',
    ),
    MOST_VIEWED: localized(
      'Most viewed',
      'Самые просматриваемые',
      'Ամենադիտված',
    ),
  };
  return (Object.keys(labels) as PropertySort[]).map((value) => ({
    value,
    label: labels[value][presentationLocale],
  }));
};
export const buildingLabels = localizedRecord(
  Object.keys(buildings) as BuildingType[],
  getBuildingLabel,
);
export const conditionLabels = localizedRecord(
  Object.keys(conditions) as PropertyCondition[],
  getConditionLabel,
);
export const heatingLabels = localizedRecord(
  Object.keys(heating),
  getHeatingLabel,
);
export const readableEnum = (value?: string) =>
  value
    ? value
        .toLowerCase()
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : '';
export const getFeatureLabel = (value: PropertyFeature) =>
  features[value] ? pick(features[value]) : readableEnum(value);
const publishingStates: Record<PropertyPublishing, Localized> = {
  PENDING: localized('Pending review', 'На модерации', 'Սպասում է ստուգման'),
  ACTIVE: localized('Active', 'Активно', 'Ակտիվ'),
  REJECTED: localized('Rejected', 'Отклонено', 'Մերժված'),
};
export const getPublishingLabel = (value?: PropertyPublishing) =>
  value && publishingStates[value] ? pick(publishingStates[value]) : '';
export const publishingLabels = localizedRecord(
  Object.keys(publishingStates) as PropertyPublishing[],
  getPublishingLabel,
);
export const isPublicProperty = (property: Property) =>
  property.publishing === 'ACTIVE';
export const getCurrencySymbol = (value: Currency) =>
  currencySymbols[value] || '';
export const formatMoney = (value: string | number, currency: Currency) =>
  `${getCurrencySymbol(currency)}${formatLocalizedNumber(value, presentationLocale)}`;
export const priceOf = (property: Property) =>
  formatMoney(property.price, property.currency);
export const cityOf = (city: string) =>
  cityNames[city] ? pick(cityNames[city]) : readableEnum(city);
