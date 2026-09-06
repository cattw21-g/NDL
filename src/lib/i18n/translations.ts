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
  logout: string;
  register: string;
  profile: string;
  settings: string;
  points: string;
  completions: string;
  rank: string;
  search: string;
  subdivisions: string;
  qualifying: string;
  all: string;
  tagline: string;
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
    logout: "Log Out",
    register: "Register",
    profile: "Profile",
    settings: "Settings",
    points: "Points",
    completions: "Completions",
    rank: "Rank",
    search: "Search",
    subdivisions: "Subdivisions",
    qualifying: "Qualifying",
    all: "All",
    tagline: "Community list for reviewed nerfed demon records",
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
    logout: "Выйти",
    register: "Регистрация",
    profile: "Профиль",
    settings: "Настройки",
    points: "Очки",
    completions: "Прохождения",
    rank: "Ранг",
    search: "Поиск",
    subdivisions: "Регионы",
    qualifying: "Квалификация",
    all: "Все",
    tagline: "Список проверенных рекордов нерфнутых демонов",
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
    logout: "Cerrar sesión",
    register: "Registrarse",
    profile: "Perfil",
    settings: "Ajustes",
    points: "Puntos",
    completions: "Completados",
    rank: "Rango",
    search: "Buscar",
    subdivisions: "Subdivisiones",
    qualifying: "Calificación",
    all: "Todos",
    tagline: "Lista comunitaria de récords de nerfed demons",
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
    logout: "Abmelden",
    register: "Registrieren",
    profile: "Profil",
    settings: "Einstellungen",
    points: "Punkte",
    completions: "Abschlüsse",
    rank: "Rang",
    search: "Suchen",
    subdivisions: "Unterteilungen",
    qualifying: "Qualifikation",
    all: "Alle",
    tagline: "Community-Liste für geprüfte Nerfed-Demon-Rekorde",
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
    logout: "Wyloguj",
    register: "Zarejestruj",
    profile: "Profil",
    settings: "Ustawienia",
    points: "Punkty",
    completions: "Ukończenia",
    rank: "Ranga",
    search: "Szukaj",
    subdivisions: "Regiony",
    qualifying: "Kwalifikacja",
    all: "Wszystkie",
    tagline: "Społecznościowa lista zweryfikowanych rekordów",
  },
};
