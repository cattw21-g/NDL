import type { SupportedLanguage } from "./translations";

export const RULES_TRANSLATIONS: Record<
  SupportedLanguage,
  {
    title: string;
    subtitle: string;
    submitRecord: string;
    suggestLevel: string;
    quickLinks: string;
    rulesSections: { title: string; bullets: string[] }[];
  }
> = {
  en: {
    title: "Demonlist Rules & Guidelines",
    subtitle:
      "The official verification criteria, video proof standards, mod policies, and scoring mechanics enforced by NDL staff.",
    submitRecord: "Submit a record",
    suggestLevel: "Suggest a level",
    quickLinks: "Quick Navigation",
    rulesSections: [
      {
        title: "General record submission rules",
        bullets: [
          "Records must be achieved legit on the official nerfed version uploaded to Geometry Dash.",
          "Submissions must include a complete, unedited completion run from 0% to 100% (or qualifying progress for Main List).",
          "The submitted video must clearly show the endscreen, FPS overlay, and adequate context.",
          "Players must report FPS, CBF usage, input device, and click audio.",
          "A record is not public and does not award points until verified and accepted by staff.",
        ],
      },
      {
        title: "Video and raw footage",
        bullets: [
          "Completion video links must be publicly viewable or accessible to moderators.",
          "Raw footage (unedited recording with desktop/game sounds) is required for high-ranked demons.",
          "Do not cut away from the run before the completion and endscreen are clearly visible.",
          "Supported platforms include YouTube, Twitch, Medal.tv, Bilibili, and TikTok.",
        ],
      },
      {
        title: "Click audio and microphone proof",
        bullets: [
          "Audible click sounds recorded via microphone are required for all top records.",
          "Fake, edited, synchronized, or overlaid click sounds are strictly prohibited and result in a ban.",
          "Separate microphone tracks are recommended to maintain clear audio balance.",
        ],
      },
      {
        title: "Physics, mods, and bypass tools",
        bullets: [
          "Click Between Frames (CBF) is permitted but must be declared upon submission.",
          "Physics-altering hacks, speedhacks, hitbox multipliers, and noclip are strictly banned.",
          "Cosmetic mods (Megahack / Geode texture packs, practice music hack) are allowed if they do not alter gameplay.",
        ],
      },
      {
        title: "Level eligibility and verification",
        bullets: [
          "Only nerfed versions of extreme demons that meet community standards are eligible for ranking.",
          "Levels must be verified legitimately and registered with a valid in-game Geometry Dash ID.",
          "Levels with secret ways, unnerfed impossible sections, or buggy physics will be placed on hold or rejected.",
        ],
      },
      {
        title: "Points, tiers, and leaderboards",
        bullets: [
          "Main List (#1–75): Awards full points for 100% completions and partial points for qualifying progress (50%+).",
          "Extended List (#76–150): Awards points exclusively for 100% completions.",
          "Legacy List: Archived levels that no longer award competitive points.",
        ],
      },
    ],
  },
  pl: {
    title: "Zasady i Wytyczne Demonlisty",
    subtitle:
      "Oficjalne kryteria weryfikacji, standardy dowodów wideo, zasady modyfikacji i mechanika punktacji egzekwowane przez zespół NDL.",
    submitRecord: "Wyślij rekord",
    suggestLevel: "Zaproponuj poziom",
    quickLinks: "Szybka nawigacja",
    rulesSections: [
      {
        title: "Ogólne zasady zgłaszania rekordów",
        bullets: [
          "Rekordy muszą zostać zdobyte legalnie na oficjalnej znerfionej wersji wrzuconej do Geometry Dash.",
          "Zgłoszenia muszą zawierać pełny, nieedytowany bieg od 0% do 100% (lub wymagany postęp dla Główniej Listy).",
          "Zgłoszone wideo musi wyraźnie pokazywać ekran końcowy (endscreen), licznik FPS i pełny kontekst przejścia.",
          "Gracze muszą podać FPS, użycie CBF, urządzenie wejściowe oraz dźwięk kliknięć.",
          "Rekord nie jest publiczny i nie przyznaje punktów, dopóki nie zostanie sprawdzony i zaakceptowany przez moderatorów.",
        ],
      },
      {
        title: "Wideo i surowe nagrania (Raw Footage)",
        bullets: [
          "Linki do wideo z ukończenia muszą być publicznie dostępne lub możliwe do obejrzenia przez moderatorów.",
          "Surowe nagranie (raw footage bez edycji z dźwiękami pulpitu/gry) jest wymagane dla rekordów na najwyższych pozycjach.",
          "Nie ucinaj nagrania przed wyraźnym pokazaniem ukończenia i ekranu końcowego.",
          "Obsługiwane platformy to YouTube, Twitch, Medal.tv, Bilibili oraz TikTok.",
        ],
      },
      {
        title: "Dźwięk kliknięć i mikrofon",
        bullets: [
          "Słyszalny dźwięk kliknięć nagrany przez mikrofon jest wymagany dla wszystkich ważnych rekordów.",
          "Fałszywe, edytowane, zsynchronizowane lub podłożone dźwięki kliknięć są surowo zabronione i karane banem.",
          "Zaleca się osobną ścieżkę mikrofonu, aby zachować czysty balans dźwięku.",
        ],
      },
      {
        title: "Fizyka, mody i narzędzia typu bypass",
        bullets: [
          "Click Between Frames (CBF) jest dozwolony, ale musi zostać zadeklarowany podczas wysyłania rekordu.",
          "Cheaty zmieniające fizykę, speedhack, powiększanie hitboxów i noclip są bezwzględnie zabronione.",
          "Modyfikacje kosmetyczne (paczki tekstur Megahack / Geode, hack muzyki w practice) są dozwolone, jeśli nie zmieniają rozgrywki.",
        ],
      },
      {
        title: "Kwalifikacja poziomów i weryfikacja",
        bullets: [
          "Tylko znerfione wersje extreme demonów spełniające standardy społeczności kwalifikują się do rankingu.",
          "Poziomy muszą zostać zweryfikowane w pełni legalnie i zarejestrowane z poprawnym ID w Geometry Dash.",
          "Poziomy z sekretnymi drogami (secret ways), niemożliwymi sekcjami lub zepsutą fizyką zostaną wstrzymane lub odrzucone.",
        ],
      },
      {
        title: "Punkty, poziomy listy i rankingi",
        bullets: [
          "Główna Lista (#1–75): Przyznaje pełne punkty za 100% oraz punkty częściowe za postęp kwalifikacyjny (50%+).",
          "Rozszerzona Lista (#76–150): Przyznaje punkty wyłącznie za ukończenia w 100%.",
          "Lista Archiwalna (Legacy): Zarchiwizowane demony, które nie przyznają już punktów do rankingu.",
        ],
      },
    ],
  },
  ru: {
    title: "Правила и Регламент Демонлиста",
    subtitle:
      "Официальные критерии верификации, стандарты видеодоказательств, правила модификаций и начисления очков команды NDL.",
    submitRecord: "Отправить рекорд",
    suggestLevel: "Предложить уровень",
    quickLinks: "Быстрая навигация",
    rulesSections: [
      {
        title: "Общие правила отправки рекордов",
        bullets: [
          "Рекорды должны быть поставлены легитно на официальной нерфнутой версии в Geometry Dash.",
          "Заявка должна содержать полное непрерывное прохождение от 0% до 100% (или квалификационный прогресс для Главного Списка).",
          "На видео должен четко отображаться конечный экран (endscreen), оверлей FPS и контекст прохождения.",
          "Игроки обязаны указать FPS, использование CBF, девайс и предоставить аудио кликов.",
          "Рекорд не отображается публично и не дает очков до проверки и одобрения модераторами.",
        ],
      },
      {
        title: "Видео и исходные записи (Raw Footage)",
        bullets: [
          "Ссылки на видео должны быть общедоступными или открытыми для просмотра модераторами.",
          "Исходная запись (raw footage без монтажа) обязательна для демонов из топа списка.",
          "Не обрезайте видео до полного отображения конечного экрана.",
          "Поддерживаются YouTube, Twitch, Medal.tv, Bilibili и TikTok.",
        ],
      },
      {
        title: "Звуки кликов и микрофон",
        bullets: [
          "Четкие звуки кликов с микрофона обязательны для всех топовых рекордов.",
          "Накладные, поддельные или отредактированные клики строго запрещены и ведут к бану.",
          "Рекомендуется отдельная дорожка микрофона для чистого звучания.",
        ],
      },
      {
        title: "Физика, моды и байпассы",
        bullets: [
          "Click Between Frames (CBF) разрешен, но должен быть указан при отправке.",
          "Читы, спидхак, хитбоксы и ноклип категорически запрещены.",
          "Косметические моды разрешены, если они не влияют на физику и геймплей.",
        ],
      },
      {
        title: "Критерии уровней и верификация",
        bullets: [
          "К ранжированию допускаются только качественные нерфнутые версии экстрим-демонов.",
          "Уровень должен быть верифицирован легитно с валидным ID в Geometry Dash.",
          "Уровни с секретными путями или непроходимыми багами отклоняются.",
        ],
      },
      {
        title: "Очки, тиры и лидерборд",
        bullets: [
          "Главный Список (#1–75): Дает полные очки за 100% и частичные очки за прогресс (от 50%+).",
          "Расширенный Список (#76–150): Дает очки только за 100% прохождения.",
          "Архивный Список (Legacy): Архивные демоны, не дающие соревновательных очков.",
        ],
      },
    ],
  },
  es: {
    title: "Reglas y Directrices de la Demonlist",
    subtitle:
      "Criterios oficiales de verificación, estándares de video, políticas de mods y mecánicas de puntuación de NDL.",
    submitRecord: "Enviar récord",
    suggestLevel: "Sugerir nivel",
    quickLinks: "Navegación rápida",
    rulesSections: [
      {
        title: "Reglas generales de envío de récords",
        bullets: [
          "Los récords deben conseguirse de forma legal en la versión nerfed oficial subida a Geometry Dash.",
          "Los envíos deben incluir un intento completo y sin cortes de 0% a 100% (o progreso clasificatorio para la Main List).",
          "El video debe mostrar claramente la pantalla final, el contador de FPS y contexto suficiente.",
          "Los jugadores deben declarar FPS, uso de CBF, dispositivo y clics audibles.",
          "Un récord no es público ni otorga puntos hasta ser aceptado por los moderadores.",
        ],
      },
      {
        title: "Video y grabaciones en crudo (Raw Footage)",
        bullets: [
          "Los enlaces deben ser públicos o accesibles para el equipo.",
          "El raw footage es obligatorio para los récords del top de la lista.",
          "No cortes la grabación antes de mostrar claramente la pantalla final.",
          "Se admiten YouTube, Twitch, Medal.tv, Bilibili y TikTok.",
        ],
      },
      {
        title: "Audio de clics y micrófono",
        bullets: [
          "Los clics audibles por micrófono son obligatorios para récords importantes.",
          "Los clics falsos, sincronizados o editados están estrictamente prohibidos.",
          "Se recomienda pista de micrófono separada para un audio nítido.",
        ],
      },
      {
        title: "Física, mods y herramientas de bypass",
        bullets: [
          "Click Between Frames (CBF) está permitido pero debe declararse al enviar.",
          "Los hacks de física, speedhack, hitboxes y noclip están prohibidos.",
          "Los mods cosméticos están permitidos si no alteran la jugabilidad.",
        ],
      },
      {
        title: "Elegibilidad de niveles y verificación",
        bullets: [
          "Solo las versiones nerfed de extreme demons que cumplan los estándares entran en la lista.",
          "Los niveles deben verificarse legalmente con ID válida de Geometry Dash.",
        ],
      },
      {
        title: "Puntos, categorías y clasificaciones",
        bullets: [
          "Main List (#1–75): Otorga puntos completos por 100% y puntos parciales por progreso (50%+).",
          "Extended List (#76–150): Otorga puntos únicamente por el 100%.",
          "Legacy List: Niveles archivados que ya no otorgan puntos competitivos.",
        ],
      },
    ],
  },
  de: {
    title: "Demonlist Regeln & Richtlinien",
    subtitle:
      "Die offiziellen Kriterien für Verifizierung, Videonachweise, Mod-Richtlinien und Punktesystem des NDL-Teams.",
    submitRecord: "Rekord einreichen",
    suggestLevel: "Level vorschlagen",
    quickLinks: "Schnellnavigation",
    rulesSections: [
      {
        title: "Allgemeine Regeln für Rekordeinreichungen",
        bullets: [
          "Rekorde müssen legitim auf der offiziellen nerfed Version in Geometry Dash erspielt werden.",
          "Einreichungen müssen einen vollständigen, ungeschnittenen Durchlauf von 0% bis 100% enthalten.",
          "Das Video muss den Endscreen, das FPS-Overlay und den Kontext deutlich zeigen.",
          "Spieler müssen FPS, CBF-Nutzung, Eingabegerät und Klickaudio angeben.",
          "Ein Rekord ist erst nach Genehmigung durch Moderatoren öffentlich und vergibt Punkte.",
        ],
      },
      {
        title: "Video und Rohmaterial (Raw Footage)",
        bullets: [
          "Videolinks müssen öffentlich oder für Moderatoren abrufbar sein.",
          "Rohmaterial ist für Top-Rekorde erforderlich.",
          "Unterstützte Plattformen sind YouTube, Twitch, Medal.tv, Bilibili und TikTok.",
        ],
      },
      {
        title: "Klickaudio und Mikrofonnachweis",
        bullets: [
          "Hörbare Klicks per Mikrofon sind für Top-Rekorde verpflichtend.",
          "Gefälschte oder nachträglich eingefügte Klicks führen zum Ausschluss.",
        ],
      },
      {
        title: "Physik, Mods und Bypass-Tools",
        bullets: [
          "Click Between Frames (CBF) ist erlaubt, muss aber angegeben werden.",
          "Physikhacks, Speedhack und Noclip sind verboten.",
        ],
      },
      {
        title: "Punkte, Listen-Stufen und Ranglisten",
        bullets: [
          "Main List (#1–75): Punkte für 100% und Teilpunkte für Fortschritte ab 50%+.",
          "Extended List (#76–150): Punkte ausschließlich für 100% Abschlüsse.",
          "Legacy List: Archivierte Levels ohne Wettbewerbspunkte.",
        ],
      },
    ],
  },
};
