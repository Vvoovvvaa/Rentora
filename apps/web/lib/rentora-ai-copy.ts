import type { Locale } from '@/lib/i18n';

type RentoraAiCopy = {
  heroLabel: string;
  heroHint: string;
  heroPlaceholder: string;
  heroExample: string;
  askAi: string;
  panelSubtitle: string;
  welcomeTitle: string;
  welcomeText: string;
  inputPlaceholder: string;
  searching: string;
  send: string;
  close: string;
  reset: string;
  retry: string;
  guestHint: string;
  signIn: string;
  disclaimer: string;
  viewProperty: string;
};

const COPY: Record<Locale, RentoraAiCopy> = {
  en: {
    heroLabel: 'RENTORA AI',
    heroHint: 'Natural-language home search',
    heroPlaceholder: "Describe the home you're looking for...",
    heroExample: 'Try: “2-bedroom apartment in Gyumri under $80k with parking”',
    askAi: 'Ask Rentora AI',
    panelSubtitle: 'Find your home naturally',
    welcomeTitle: 'What are you looking for?',
    welcomeText:
      'Describe a home in your own words. I’ll search real listings available on Rentora.',
    inputPlaceholder: 'Ask about homes...',
    searching: 'Rentora AI is searching...',
    send: 'Send',
    close: 'Close',
    reset: 'New conversation',
    retry: 'Retry',
    guestHint: 'Sign in to use AI property search.',
    signIn: 'Sign in',
    disclaimer: 'Rentora AI searches real listings available on Rentora.',
    viewProperty: 'View property',
  },

  ru: {
    heroLabel: 'RENTORA AI',
    heroHint: 'Поиск недвижимости обычным языком',
    heroPlaceholder: 'Опишите, какую недвижимость вы ищете...',
    heroExample: 'Например: «2-комнатная квартира в Гюмри до $80k с парковкой»',
    askAi: 'Спросить Rentora AI',
    panelSubtitle: 'Найдём подходящий дом обычным языком',
    welcomeTitle: 'Что вы ищете?',
    welcomeText:
      'Опишите недвижимость своими словами. Я найду реальные объявления, доступные на Rentora.',
    inputPlaceholder: 'Спросите о недвижимости...',
    searching: 'Rentora AI ищет варианты...',
    send: 'Отправить',
    close: 'Закрыть',
    reset: 'Новый разговор',
    retry: 'Повторить',
    guestHint: 'Войдите, чтобы использовать AI-поиск.',
    signIn: 'Войти',
    disclaimer: 'Rentora AI ищет только реальные объявления на Rentora.',
    viewProperty: 'Открыть объявление',
  },

  am: {
    heroLabel: 'RENTORA AI',
    heroHint: 'Անշարժ գույքի որոնում բնական լեզվով',
    heroPlaceholder: 'Նկարագրեք, թե ինչ տուն եք փնտրում...',
    heroExample:
      'Օրինակ՝ «2 սենյականոց բնակարան Գյումրիում մինչև $80k, կայանատեղիով»',
    askAi: 'Հարցնել Rentora AI-ին',
    panelSubtitle: 'Գտեք ձեր տունը բնական լեզվով',
    welcomeTitle: 'Ի՞նչ եք փնտրում',
    welcomeText:
      'Նկարագրեք ցանկալի տունը ձեր բառերով։ Ես կփնտրեմ Rentora-ում հասանելի իրական հայտարարությունները։',
    inputPlaceholder: 'Հարցրեք անշարժ գույքի մասին...',
    searching: 'Rentora AI-ն որոնում է...',
    send: 'Ուղարկել',
    close: 'Փակել',
    reset: 'Նոր զրույց',
    retry: 'Կրկին փորձել',
    guestHint: 'Մուտք գործեք AI որոնումն օգտագործելու համար։',
    signIn: 'Մուտք',
    disclaimer:
      'Rentora AI-ն որոնում է Rentora-ում հասանելի իրական հայտարարությունները։',
    viewProperty: 'Բացել հայտարարությունը',
  },
};

export function getRentoraAiCopy(locale: Locale): RentoraAiCopy {
  return COPY[locale] ?? COPY.en;
}
