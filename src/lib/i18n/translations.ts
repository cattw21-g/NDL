export type SupportedLanguage = "en" | "ru" | "es" | "de" | "pl";

export type TranslationDictionary = {
  list: string;
  upcoming: string;
  players: string;
  countries: string;
  map: string;
  stats: string;
  creators: string;
  archive: string;
  submit: string;
  suggest: string;
  staff: string;
  rules: string;
  news: string;
  login: string;
  register: string;
  profile: string;
  points: string;
  completions: string;
  rank: string;
};

export const LANGUAGES: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
];

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    list: "List",
    upcoming: "Upcoming",
    players: "Players",
    countries: "Countries",
    map: "Map",
    stats: "Stats",
    creators: "Creators",
    archive: "Archive",
    submit: "Submit",
    suggest: "Suggest",
    staff: "Staff",
    rules: "Rules",
    news: "News",
    login: "Log In",
    register: "Register",
    profile: "Profile",
    points: "Points",
    completions: "Completions",
    rank: "Rank",
  },
  ru: {
    list: "Список",
    upcoming: "Скоро",
    players: "Игроки",
    countries: "Страны",
    map: "Карта",
    stats: "Статистика",
    creators: "Креаторы",
    archive: "Архив",
    submit: "Отправить",
    suggest: "Предложить",
    staff: "Команда",
    rules: "Правила",
    news: "Новости",
    login: "Войти",
    register: "Регистрация",
    profile: "Профиль",
    points: "Очки",
    completions: "Прохождения",
    rank: "Ранг",
  },
  es: {
    list: "Lista",
    upcoming: "Próximos",
    players: "Jugadores",
    countries: "Países",
    map: "Mapa",
    stats: "Estadísticas",
    creators: "Creadores",
    archive: "Archivo",
    submit: "Enviar",
    suggest: "Sugerir",
    staff: "Equipo",
    rules: "Reglas",
    news: "Noticias",
    login: "Entrar",
    register: "Registrarse",
    profile: "Perfil",
    points: "Puntos",
    completions: "Completados",
    rank: "Rango",
  },
  de: {
    list: "Liste",
    upcoming: "Demnächst",
    players: "Spieler",
    countries: "Länder",
    map: "Karte",
    stats: "Statistiken",
    creators: "Ersteller",
    archive: "Archiv",
    submit: "Einreichen",
    suggest: "Vorschlagen",
    staff: "Team",
    rules: "Regeln",
    news: "Neuigkeiten",
    login: "Anmelden",
    register: "Registrieren",
    profile: "Profil",
    points: "Punkte",
    completions: "Abschlüsse",
    rank: "Rang",
  },
  pl: {
    list: "Lista",
    upcoming: "Wkrótce",
    players: "Gracze",
    countries: "Kraje",
    map: "Mapa",
    stats: "Statystyki",
    creators: "Twórcy",
    archive: "Archiwum",
    submit: "Wyślij",
    suggest: "Zaproponuj",
    staff: "Zespół",
    rules: "Zasady",
    news: "Wiadomości",
    login: "Zaloguj",
    register: "Zarejestruj",
    profile: "Profil",
    points: "Punkty",
    completions: "Ukończenia",
    rank: "Ranga",
  },
};
