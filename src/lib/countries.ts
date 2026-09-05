export type Continent =
  | "Europe"
  | "North America"
  | "South America"
  | "Asia"
  | "Oceania"
  | "Africa";

export type CountryMeta = {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  flag: string;
  continent: Continent;
};

export const COUNTRIES: Record<string, CountryMeta> = {
  US: { code: "US", name: "United States", flag: "🇺🇸", continent: "North America" },
  PL: { code: "PL", name: "Poland", flag: "🇵🇱", continent: "Europe" },
  GB: { code: "GB", name: "United Kingdom", flag: "🇬🇧", continent: "Europe" },
  DE: { code: "DE", name: "Germany", flag: "🇩🇪", continent: "Europe" },
  CA: { code: "CA", name: "Canada", flag: "🇨🇦", continent: "North America" },
  FR: { code: "FR", name: "France", flag: "🇫🇷", continent: "Europe" },
  ES: { code: "ES", name: "Spain", flag: "🇪🇸", continent: "Europe" },
  IT: { code: "IT", name: "Italy", flag: "🇮🇹", continent: "Europe" },
  RU: { code: "RU", name: "Russia", flag: "🇷🇺", continent: "Europe" },
  UA: { code: "UA", name: "Ukraine", flag: "🇺🇦", continent: "Europe" },
  SE: { code: "SE", name: "Sweden", flag: "🇸🇪", continent: "Europe" },
  NO: { code: "NO", name: "Norway", flag: "🇳🇴", continent: "Europe" },
  FI: { code: "FI", name: "Finland", flag: "🇫🇮", continent: "Europe" },
  DK: { code: "DK", name: "Denmark", flag: "🇩🇰", continent: "Europe" },
  NL: { code: "NL", name: "Netherlands", flag: "🇳🇱", continent: "Europe" },
  BE: { code: "BE", name: "Belgium", flag: "🇧🇪", continent: "Europe" },
  CH: { code: "CH", name: "Switzerland", flag: "🇨🇭", continent: "Europe" },
  AT: { code: "AT", name: "Austria", flag: "🇦🇹", continent: "Europe" },
  CZ: { code: "CZ", name: "Czech Republic", flag: "🇨🇿", continent: "Europe" },
  SK: { code: "SK", name: "Slovakia", flag: "🇸🇰", continent: "Europe" },
  HU: { code: "HU", name: "Hungary", flag: "🇭🇺", continent: "Europe" },
  RO: { code: "RO", name: "Romania", flag: "🇷🇴", continent: "Europe" },
  BG: { code: "BG", name: "Bulgaria", flag: "🇧🇬", continent: "Europe" },
  GR: { code: "GR", name: "Greece", flag: "🇬🇷", continent: "Europe" },
  PT: { code: "PT", name: "Portugal", flag: "🇵🇹", continent: "Europe" },
  IE: { code: "IE", name: "Ireland", flag: "🇮🇪", continent: "Europe" },
  JP: { code: "JP", name: "Japan", flag: "🇯🇵", continent: "Asia" },
  KR: { code: "KR", name: "South Korea", flag: "🇰🇷", continent: "Asia" },
  CN: { code: "CN", name: "China", flag: "🇨🇳", continent: "Asia" },
  TW: { code: "TW", name: "Taiwan", flag: "🇹🇼", continent: "Asia" },
  AU: { code: "AU", name: "Australia", flag: "🇦🇺", continent: "Oceania" },
  NZ: { code: "NZ", name: "New Zealand", flag: "🇳🇿", continent: "Oceania" },
  BR: { code: "BR", name: "Brazil", flag: "🇧🇷", continent: "South America" },
  AR: { code: "AR", name: "Argentina", flag: "🇦🇷", continent: "South America" },
  CL: { code: "CL", name: "Chile", flag: "🇨🇱", continent: "South America" },
  MX: { code: "MX", name: "Mexico", flag: "🇲🇽", continent: "North America" },
  CO: { code: "CO", name: "Colombia", flag: "🇨🇴", continent: "South America" },
  PE: { code: "PE", name: "Peru", flag: "🇵🇪", continent: "South America" },
  PH: { code: "PH", name: "Philippines", flag: "🇵🇭", continent: "Asia" },
  ID: { code: "ID", name: "Indonesia", flag: "🇮🇩", continent: "Asia" },
  MY: { code: "MY", name: "Malaysia", flag: "🇲🇾", continent: "Asia" },
  SG: { code: "SG", name: "Singapore", flag: "🇸🇬", continent: "Asia" },
  TH: { code: "TH", name: "Thailand", flag: "🇹🇭", continent: "Asia" },
  VN: { code: "VN", name: "Vietnam", flag: "🇻🇳", continent: "Asia" },
  IN: { code: "IN", name: "India", flag: "🇮🇳", continent: "Asia" },
  IL: { code: "IL", name: "Israel", flag: "🇮🇱", continent: "Asia" },
  TR: { code: "TR", name: "Turkey", flag: "🇹🇷", continent: "Europe" },
  ZA: { code: "ZA", name: "South Africa", flag: "🇿🇦", continent: "Africa" },
  EG: { code: "EG", name: "Egypt", flag: "🇪🇬", continent: "Africa" },
};

export function getCountryMeta(code: string | null | undefined): CountryMeta | null {
  if (!code) return null;
  const upper = code.toUpperCase().trim();
  return COUNTRIES[upper] || {
    code: upper,
    name: upper,
    flag: "🌐",
    continent: "Europe",
  };
}

export function getAllCountries(): CountryMeta[] {
  return Object.values(COUNTRIES).sort((a, b) => a.name.localeCompare(b.name));
}
