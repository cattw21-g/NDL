export type Subdivision = {
  code: string;
  name: string;
};

export const SUBDIVISIONS: Record<string, Subdivision[]> = {
  US: [
    { code: "AL", name: "Alabama" },
    { code: "AK", name: "Alaska" },
    { code: "AZ", name: "Arizona" },
    { code: "AR", name: "Arkansas" },
    { code: "CA", name: "California" },
    { code: "CO", name: "Colorado" },
    { code: "CT", name: "Connecticut" },
    { code: "DE", name: "Delaware" },
    { code: "FL", name: "Florida" },
    { code: "GA", name: "Georgia" },
    { code: "HI", name: "Hawaii" },
    { code: "ID", name: "Idaho" },
    { code: "IL", name: "Illinois" },
    { code: "IN", name: "Indiana" },
    { code: "IA", name: "Iowa" },
    { code: "KS", name: "Kansas" },
    { code: "KY", name: "Kentucky" },
    { code: "LA", name: "Louisiana" },
    { code: "ME", name: "Maine" },
    { code: "MD", name: "Maryland" },
    { code: "MA", name: "Massachusetts" },
    { code: "MI", name: "Michigan" },
    { code: "MN", name: "Minnesota" },
    { code: "MS", name: "Mississippi" },
    { code: "MO", name: "Missouri" },
    { code: "MT", name: "Montana" },
    { code: "NE", name: "Nebraska" },
    { code: "NV", name: "Nevada" },
    { code: "NH", name: "New Hampshire" },
    { code: "NJ", name: "New Jersey" },
    { code: "NM", name: "New Mexico" },
    { code: "NY", name: "New York" },
    { code: "NC", name: "North Carolina" },
    { code: "ND", name: "North Dakota" },
    { code: "OH", name: "Ohio" },
    { code: "OK", name: "Oklahoma" },
    { code: "OR", name: "Oregon" },
    { code: "PA", name: "Pennsylvania" },
    { code: "RI", name: "Rhode Island" },
    { code: "SC", name: "South Carolina" },
    { code: "SD", name: "South Dakota" },
    { code: "TN", name: "Tennessee" },
    { code: "TX", name: "Texas" },
    { code: "UT", name: "Utah" },
    { code: "VT", name: "Vermont" },
    { code: "VA", name: "Virginia" },
    { code: "WA", name: "Washington" },
    { code: "WV", name: "West Virginia" },
    { code: "WI", name: "Wisconsin" },
    { code: "WY", name: "Wyoming" },
  ],
  DE: [
    { code: "BW", name: "Baden-Württemberg" },
    { code: "BY", name: "Bavaria (Bayern)" },
    { code: "BE", name: "Berlin" },
    { code: "BB", name: "Brandenburg" },
    { code: "HB", name: "Bremen" },
    { code: "HH", name: "Hamburg" },
    { code: "HE", name: "Hesse (Hessen)" },
    { code: "MV", name: "Mecklenburg-Vorpommern" },
    { code: "NI", name: "Lower Saxony (Niedersachsen)" },
    { code: "NW", name: "North Rhine-Westphalia (NRW)" },
    { code: "RP", name: "Rhineland-Palatinate (Rheinland-Pfalz)" },
    { code: "SL", name: "Saarland" },
    { code: "SN", name: "Saxony (Sachsen)" },
    { code: "ST", name: "Saxony-Anhalt (Sachsen-Anhalt)" },
    { code: "SH", name: "Schleswig-Holstein" },
    { code: "TH", name: "Thuringia (Thüringen)" },
  ],
  GB: [
    { code: "ENG", name: "England" },
    { code: "SCT", name: "Scotland" },
    { code: "WLS", name: "Wales" },
    { code: "NIR", name: "Northern Ireland" },
  ],
  CA: [
    { code: "AB", name: "Alberta" },
    { code: "BC", name: "British Columbia" },
    { code: "MB", name: "Manitoba" },
    { code: "NB", name: "New Brunswick" },
    { code: "NL", name: "Newfoundland and Labrador" },
    { code: "NS", name: "Nova Scotia" },
    { code: "ON", name: "Ontario" },
    { code: "PE", name: "Prince Edward Island" },
    { code: "QC", name: "Quebec" },
    { code: "SK", name: "Saskatchewan" },
  ],
  AU: [
    { code: "NSW", name: "New South Wales" },
    { code: "VIC", name: "Victoria" },
    { code: "QLD", name: "Queensland" },
    { code: "WA", name: "Western Australia" },
    { code: "SA", name: "South Australia" },
    { code: "TAS", name: "Tasmania" },
    { code: "ACT", name: "Australian Capital Territory" },
  ],
  PL: [
    { code: "DS", name: "Lower Silesia (Dolnośląskie)" },
    { code: "KP", name: "Kuyavia-Pomerania (Kujawsko-Pomorskie)" },
    { code: "MA", name: "Lesser Poland (Małopolskie)" },
    { code: "MZ", name: "Masovia (Mazowieckie)" },
    { code: "PM", name: "Pomerania (Pomorskie)" },
    { code: "SL", name: "Silesia (Śląskie)" },
    { code: "WP", name: "Greater Poland (Wielkopolskie)" },
  ],
};

export function getSubdivisions(countryCode?: string | null): Subdivision[] {
  if (!countryCode) return [];
  return SUBDIVISIONS[countryCode.toUpperCase()] || [];
}

export function getSubdivisionName(countryCode?: string | null, subCode?: string | null): string | null {
  if (!countryCode || !subCode) return null;
  const list = getSubdivisions(countryCode);
  const found = list.find((s) => s.code.toLowerCase() === subCode.toLowerCase() || s.name.toLowerCase() === subCode.toLowerCase());
  return found ? found.name : subCode;
}
