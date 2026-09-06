"use client";

import { useEffect } from "react";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { SupportedLanguage } from "@/lib/i18n/translations";

const DICTIONARIES: Record<SupportedLanguage, Record<string, string>> = {
  en: {},
  pl: {
    "Main List (#1 - #75)": "Główna lista (#1 - #75)",
    "Main List": "Główna lista",
    "Extended List (#76 - #150)": "Rozszerzona lista (#76 - #150)",
    "Extended List": "Rozszerzona lista",
    "Legacy List": "Lista archiwalna",
    "Qualifying": "Kwalifikacja",
    "Victors": "Zwycięzcy",
    "Points": "Punkty",
    "Rank": "Ranga",
    "Current rank": "Aktualna ranga",
    "Current status": "Aktualny status",
    "Status": "Status",
    "Placement date": "Data dodania",
    "Not placed": "Nieumieszczony",
    "100% Points": "Punkty za 100%",
    "Level": "Poziom",
    "Players": "Gracze",
    "Countries": "Kraje",
    "Stats": "Statystyki",
    "Creators": "Twórcy",
    "Archive": "Archiwum",
    "Submit": "Wyślij",
    "Suggest": "Zaproponuj",
    "Staff": "Zespół",
    "Rules": "Zasady",
    "News": "Wiadomości",
    "Submit record": "Wyślij rekord",
    "Submit a record": "Wyślij rekord",
    "Suggest a level": "Zaproponuj poziom",
    "Suggest correction": "Zaproponuj poprawkę",
    "Suggest level/correction": "Zaproponuj poziom/poprawkę",
    "In-Game Rating": "Ocena w grze",
    "Soundtrack": "Ścieżka dźwiękowa",
    "Length": "Długość",
    "Objects": "Obiekty",
    "Game Version": "Wersja gry",
    "GD Downloads": "Pobrania GD",
    "GD Likes": "Polubienia GD",
    "Copy / Password": "Kopiuj / Hasło",
    "Free Copy": "Darmowa kopia",
    "Free copy": "Darmowa kopia",
    "Copy ID": "Kopiuj ID",
    "Share Level": "Udostępnij poziom",
    "Description": "Opis",
    "Version notes": "Notatki do wersji",
    "Points & Scoring": "Punkty i punktacja",
    "Proof expectations": "Wymagania dotyczące dowodów",
    "Quick links": "Szybkie linki",
    "Update history": "Historia aktualizacji",
    "Position history": "Historia pozycji",
    "Back to ranked list": "Powrót do listy rankingowej",
    "Interactive World Map": "Interaktywna mapa świata",
    "States & Subdivisions": "Stany i regiony",
    "Subdivisions": "Regiony",
    "Auto-Detect from IP": "Wykryj z IP",
    "Search demon or creator...": "Szukaj demona lub twórcy...",
    "Search players...": "Szukaj graczy...",
    "Search countries...": "Szukaj krajów...",
    "Search rules...": "Szukaj zasad...",
    "Verified by": "Zweryfikowane przez",
    "Verifier": "Weryfikator",
    "Nerfed by": "Znerfione przez",
    "Nerf creator": "Twórca nerfa",
    "Published by": "Opublikowane przez",
    "Publisher/host": "Wydawca/host",
    "Original level": "Oryginalny poziom",
    "Official Verification": "Oficjalna weryfikacja",
    "Verification proof": "Dowód weryfikacji",
    "Showcase URL": "Wideo pokazowe (Showcase)",
    "Video linked": "Wideo dołączone",
    "Raw footage on file": "Surowe nagranie na pliku",
    "Raw footage not listed": "Brak surowego nagrania",
    "Raw footage": "Surowe nagranie",
    "Completion video": "Wideo z ukończenia",
    "Progress video": "Wideo z postępu",
    "No progress runs submitted yet": "Brak zgłoszonych przejść z postępem",
    "Login": "Zaloguj",
    "Log In": "Zaloguj",
    "Logout": "Wyloguj",
    "Log Out": "Wyloguj",
    "Register": "Zarejestruj",
    "Settings": "Ustawienia",
    "Profile": "Profil",
    "Europe": "Europa",
    "North America": "Ameryka Północna",
    "South America": "Ameryka Południowa",
    "Asia": "Azja",
    "Oceania": "Oceania",
    "Africa": "Afryka",
    "Central America": "Ameryka Środkowa",
    "All": "Wszystkie",
    "Overview": "Przegląd",
    "Leaderboard": "Tabela wyników",
    "Demons": "Demony",
    "Unrated / Custom": "Nieoceniony / Niestandardowy",
    "Unrated": "Nieoceniony",
    "Top Players Leaderboard": "Ranking najlepszych graczy",
    "National Leaderboard": "Ranking krajowy",
    "Historical List Archive": "Archiwum listy demonów",
    "Demonlist Rules & Guidelines": "Zasady i wytyczne demonlisty",
    "Player Profile": "Profil gracza",
    "Completions": "Ukończenia",
    "Progress Records": "Rekordy z postępem",
    "Accepted Records": "Zaakceptowane rekordy",
    "Under Consideration": "W trakcie rozpatrywania",
    "Accepted": "Zaakceptowano",
    "Rejected": "Odrzucono",
    "Needs Changes": "Wymaga zmian",
    "Pending": "Oczekuje",
    "Community list for reviewed nerfed demon records": "Społecznościowa lista zweryfikowanych rekordów",
    "Table of contents": "Spis treści",
    "Strict Ban Criteria": "Ścisłe kryteria bana",
    "Fake or added click sounds": "Fałszywe lub dodane dźwięki kliknięć",
    "Speedhack, noclip, macros, replay bots, auto-clickers": "Speedhack, noclip, makra, replay boty, auto-clickery",
    "Hitbox-changing tools, input correction, level-modifying hacks": "Narzędzia zmieniające hitboxy, korekcja wejścia, hacki modyfikujące poziom",
    "Skipped endscreen or wrong NDL level ID": "Pominięty ekran końcowy lub błędne ID poziomu NDL",
    "Nerf Fidelity Requirement": "Wymóg wierności nerfa",
    "Original replay/macro compatibility is a structural eligibility check only. Player records must still be completed legitimately without macros or replay bots.": "Zgodność z oryginalnym makrem/powtórką to tylko weryfikacja kwalifikacji. Rekordy graczy muszą zostać wykonane legalnie bez makr i botów.",
    "The official verification criteria, video proof standards, mod policies, and scoring mechanics enforced by NDL staff.": "Oficjalne kryteria weryfikacji, standardy dowodów wideo, zasady modyfikacji i mechanika punktacji egzekwowane przez zespół NDL.",
    "General policy": "Zasady ogólne",
    "Record requirements": "Wymagania dotyczące rekordów",
    "Video and raw footage": "Wideo i surowe nagrania (Raw footage)",
    "Click audio and microphone proof": "Dźwięk kliknięć i mikrofon",
    "Physics, mods, and bypass tools": "Fizyka, mody i narzędzia bypass",
    "Level eligibility and verification": "Kwalifikacja poziomów i weryfikacja",
    "Points, tiers, and leaderboards": "Punkty, poziomy listy i rankingi",
    "Moderation, review states, and appeals": "Moderacja, statusy zgłoszeń i odwołania",
  },
  ru: {
    "Main List (#1 - #75)": "Главный список (#1 - #75)",
    "Main List": "Главный список",
    "Extended List (#76 - #150)": "Расширенный список (#76 - #150)",
    "Extended List": "Расширенный список",
    "Legacy List": "Архивный список",
    "Qualifying": "Квалификация",
    "Victors": "Победители",
    "Points": "Очки",
    "Rank": "Ранг",
    "Current rank": "Текущий ранг",
    "Current status": "Текущий статус",
    "Status": "Статус",
    "Placement date": "Дата добавления",
    "100% Points": "Очки за 100%",
    "Level": "Уровень",
    "Players": "Игроки",
    "Countries": "Страны",
    "Stats": "Статистика",
    "Creators": "Креаторы",
    "Archive": "Архив",
    "Submit": "Отправить",
    "Suggest": "Предложить",
    "Staff": "Команда",
    "Rules": "Правила",
    "News": "Новости",
    "Submit record": "Отправить рекорд",
    "Submit a record": "Отправить рекорд",
    "Suggest a level": "Предложить уровень",
    "Suggest correction": "Предложить исправление",
    "In-Game Rating": "Оценка в игре",
    "Soundtrack": "Саундтрек",
    "Length": "Длина",
    "Objects": "Объекты",
    "Game Version": "Версия игры",
    "GD Downloads": "Загрузки в GD",
    "GD Likes": "Лайки в GD",
    "Copy / Password": "Копия / Пароль",
    "Free Copy": "Свободная копия",
    "Copy ID": "Скопировать ID",
    "Share Level": "Поделиться уровнем",
    "Description": "Описание",
    "Version notes": "Заметки о версии",
    "Points & Scoring": "Очки и начисление",
    "Proof expectations": "Требования к доказательствам",
    "Quick links": "Быстрые ссылки",
    "Update history": "История обновлений",
    "Position history": "История позиций",
    "Back to ranked list": "Назад к списку",
    "Interactive World Map": "Интерактивная карта мира",
    "States & Subdivisions": "Штаты и регионы",
    "Subdivisions": "Регионы",
    "Auto-Detect from IP": "Определить по IP",
    "Search demon or creator...": "Поиск демона или креатора...",
    "Search players...": "Поиск игроков...",
    "Search countries...": "Поиск стран...",
    "Verified by": "Верифицировано",
    "Verifier": "Верификатор",
    "Nerfed by": "Нерф от",
    "Published by": "Опубликовано",
    "Official Verification": "Официальная верификация",
    "Verification proof": "Доказательство верификации",
    "Completion video": "Видео прохождения",
    "Progress video": "Видео прогресса",
    "Login": "Войти",
    "Log In": "Войти",
    "Logout": "Выйти",
    "Log Out": "Выйти",
    "Register": "Регистрация",
    "Settings": "Настройки",
    "Profile": "Профиль",
    "Europe": "Европа",
    "North America": "Северная Америка",
    "South America": "Южная Америка",
    "Asia": "Азия",
    "Oceania": "Океания",
    "Africa": "Африка",
    "Central America": "Центральная Америка",
    "All": "Все",
    "Unrated / Custom": "Без оценки / Кастомный",
  },
  es: {
    "Main List (#1 - #75)": "Lista Principal (#1 - #75)",
    "Main List": "Lista Principal",
    "Extended List (#76 - #150)": "Lista Extendida (#76 - #150)",
    "Extended List": "Lista Extendida",
    "Legacy List": "Lista Legado",
    "Qualifying": "Clasificación",
    "Victors": "Vencedores",
    "Points": "Puntos",
    "Rank": "Rango",
    "Current rank": "Rango actual",
    "Current status": "Estado actual",
    "Status": "Estado",
    "100% Points": "Puntos 100%",
    "Level": "Nivel",
    "Players": "Jugadores",
    "Countries": "Países",
    "Stats": "Estadísticas",
    "Creators": "Creadores",
    "Archive": "Archivo",
    "Submit": "Enviar",
    "Suggest": "Sugerir",
    "Staff": "Equipo",
    "Rules": "Reglas",
    "News": "Noticias",
    "Submit record": "Enviar récord",
    "Submit a record": "Enviar récord",
    "Suggest a level": "Sugerir nivel",
    "Suggest correction": "Sugerir corrección",
    "In-Game Rating": "Dificultad en el juego",
    "Soundtrack": "Banda sonora",
    "Length": "Longitud",
    "Objects": "Objetos",
    "Game Version": "Versión del juego",
    "GD Downloads": "Descargas en GD",
    "GD Likes": "Likes en GD",
    "Copy / Password": "Copia / Contraseña",
    "Free Copy": "Copia libre",
    "Copy ID": "Copiar ID",
    "Share Level": "Compartir nivel",
    "Description": "Descripción",
    "Version notes": "Notas de la versión",
    "Points & Scoring": "Puntos y puntuación",
    "Proof expectations": "Requisitos de pruebas",
    "Quick links": "Enlaces rápidos",
    "Update history": "Historial de cambios",
    "Position history": "Historial de posición",
    "Back to ranked list": "Volver a la lista",
    "Interactive World Map": "Mapa mundial interactivo",
    "States & Subdivisions": "Estados y subdivisiones",
    "Subdivisions": "Subdivisiones",
    "Auto-Detect from IP": "Detectar por IP",
    "Search demon or creator...": "Buscar demon o creador...",
    "Search players...": "Buscar jugadores...",
    "Search countries...": "Buscar países...",
    "Verified by": "Verificado por",
    "Verifier": "Verificador",
    "Nerfed by": "Nerfeado por",
    "Published by": "Publicado por",
    "Official Verification": "Verificación oficial",
    "Verification proof": "Prueba de verificación",
    "Completion video": "Video de completado",
    "Progress video": "Video de progreso",
    "Login": "Entrar",
    "Log In": "Entrar",
    "Logout": "Cerrar sesión",
    "Log Out": "Cerrar sesión",
    "Register": "Registrarse",
    "Settings": "Ajustes",
    "Profile": "Perfil",
    "Europe": "Europa",
    "North America": "Norteamérica",
    "South America": "Sudamérica",
    "Asia": "Asia",
    "Oceania": "Oceanía",
    "Africa": "África",
    "Central America": "Centroamérica",
    "All": "Todos",
    "Unrated / Custom": "Sin calificar / Personalizado",
  },
  de: {
    "Main List (#1 - #75)": "Hauptliste (#1 - #75)",
    "Main List": "Hauptliste",
    "Extended List (#76 - #150)": "Erweiterte Liste (#76 - #150)",
    "Extended List": "Erweiterte Liste",
    "Legacy List": "Archivierte Liste",
    "Qualifying": "Qualifikation",
    "Victors": "Bezwinger",
    "Points": "Punkte",
    "Rank": "Rang",
    "Current rank": "Aktueller Rang",
    "Current status": "Aktueller Status",
    "Status": "Status",
    "100% Points": "100% Punkte",
    "Level": "Level",
    "Players": "Spieler",
    "Countries": "Länder",
    "Stats": "Statistiken",
    "Creators": "Ersteller",
    "Archive": "Archiv",
    "Submit": "Einreichen",
    "Suggest": "Vorschlagen",
    "Staff": "Team",
    "Rules": "Regeln",
    "News": "Neuigkeiten",
    "Submit record": "Rekord einreichen",
    "Submit a record": "Rekord einreichen",
    "Suggest a level": "Level vorschlagen",
    "Suggest correction": "Korrektur vorschlagen",
    "In-Game Rating": "Schwierigkeit im Spiel",
    "Soundtrack": "Soundtrack",
    "Length": "Länge",
    "Objects": "Objekte",
    "Game Version": "Spielversion",
    "GD Downloads": "GD Downloads",
    "GD Likes": "GD Likes",
    "Copy / Password": "Kopieren / Passwort",
    "Free Copy": "Freie Kopie",
    "Copy ID": "ID kopieren",
    "Share Level": "Level teilen",
    "Description": "Beschreibung",
    "Version notes": "Versionshinweise",
    "Points & Scoring": "Punkte & Wertung",
    "Proof expectations": "Nachweiserwartungen",
    "Quick links": "Schnelllinks",
    "Update history": "Verlauf",
    "Position history": "Positionsverlauf",
    "Back to ranked list": "Zurück zur Liste",
    "Interactive World Map": "Interaktive Weltkarte",
    "States & Subdivisions": "Bundesländer & Regionen",
    "Subdivisions": "Regionen",
    "Auto-Detect from IP": "Automatisch per IP",
    "Search demon or creator...": "Demon oder Ersteller suchen...",
    "Search players...": "Spieler suchen...",
    "Search countries...": "Länder suchen...",
    "Verified by": "Verifiziert von",
    "Verifier": "Verifizierer",
    "Nerfed by": "Gesteuert von",
    "Published by": "Veröffentlicht von",
    "Official Verification": "Offizielle Verifizierung",
    "Verification proof": "Verifizierungsnachweis",
    "Completion video": "Abschluss-Video",
    "Progress video": "Fortschritts-Video",
    "Login": "Anmelden",
    "Log In": "Anmelden",
    "Logout": "Abmelden",
    "Log Out": "Abmelden",
    "Register": "Registrieren",
    "Settings": "Einstellungen",
    "Profile": "Profil",
    "Europe": "Europa",
    "North America": "Nordamerika",
    "South America": "Südamerika",
    "Asia": "Asien",
    "Oceania": "Ozeanien",
    "Africa": "Afrika",
    "Central America": "Mittelamerika",
    "All": "Alle",
    "Unrated / Custom": "Unbewertet / Eigene",
  },
};

function applyTranslationsToDOM(lang: SupportedLanguage) {
  if (lang === "en") return;
  const dict = DICTIONARIES[lang];
  if (!dict || Object.keys(dict).length === 0) return;

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue;
      if (!text || !text.trim()) return;

      // Check if inside notranslate or translate=no
      let parent = node.parentElement;
      while (parent) {
        if (
          parent.classList?.contains("notranslate") ||
          parent.getAttribute("translate") === "no" ||
          parent.tagName === "SCRIPT" ||
          parent.tagName === "STYLE" ||
          parent.tagName === "CODE" ||
          parent.tagName === "PRE"
        ) {
          return;
        }
        parent = parent.parentElement;
      }

      const trimmed = text.trim();
      if (dict[trimmed]) {
        // Protect brand names
        if (trimmed.toLowerCase() !== "nerfed demonlist" && trimmed.toLowerCase() !== "ndl") {
          node.nodeValue = text.replace(trimmed, dict[trimmed]);
          return;
        }
      }

      // Pattern replacements
      let replaced = text;
      for (const [key, val] of Object.entries(dict)) {
        if (key.length > 2 && replaced.includes(key)) {
          if (key.toLowerCase() === "nerfed demonlist" || key.toLowerCase() === "ndl") continue;
          replaced = replaced.split(key).join(val);
        }
      }
      if (replaced !== text) {
        node.nodeValue = replaced;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (
        el.classList?.contains("notranslate") ||
        el.getAttribute("translate") === "no" ||
        el.tagName === "SCRIPT" ||
        el.tagName === "STYLE"
      ) {
        return;
      }

      // Check placeholders
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        if (el.placeholder && dict[el.placeholder.trim()]) {
          el.placeholder = dict[el.placeholder.trim()];
        }
      }

      for (let i = 0; i < node.childNodes.length; i++) {
        walk(node.childNodes[i]);
      }
    }
  }

  walk(document.body);
}

export function ClientAutoTranslator() {
  const { lang } = useTranslation();

  useEffect(() => {
    if (lang === "en") return;

    // Run initial pass
    applyTranslationsToDOM(lang);

    // Observe future DOM changes (route navigations, client rendering)
    let timeout: NodeJS.Timeout;
    const observer = new MutationObserver(() => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        applyTranslationsToDOM(lang);
      }, 100);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [lang]);

  return null;
}
