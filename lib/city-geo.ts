import type { MarketCode } from "@/lib/markets";

export type CityGeo = { lat: number; lon: number; region: string };

// Stadtzentrum (WGS84) und Bundesland/Kanton (ISO 3166-2, passend zu data/city-map.json) je Stadtseite.
// Schlüssel: "<markt>:<pfad>".
export const CITY_GEO: Record<string, CityGeo> = {
  "de:/partnersuche/augsburg/": { lat: 48.3705, lon: 10.8978, region: "DE-BY" },
  "de:/partnersuche/berlin/": { lat: 52.52, lon: 13.405, region: "DE-BE" },
  "de:/partnersuche/bochum/": { lat: 51.4818, lon: 7.2162, region: "DE-NW" },
  "de:/partnersuche/bonn/": { lat: 50.7374, lon: 7.0982, region: "DE-NW" },
  "de:/partnersuche/bremen/": { lat: 53.0793, lon: 8.8017, region: "DE-HB" },
  "de:/partnersuche/dortmund/": { lat: 51.5136, lon: 7.4653, region: "DE-NW" },
  "de:/partnersuche/dresden/": { lat: 51.0504, lon: 13.7373, region: "DE-SN" },
  "de:/partnersuche/duesseldorf/": { lat: 51.2277, lon: 6.7735, region: "DE-NW" },
  "de:/partnersuche/essen/": { lat: 51.4556, lon: 7.0116, region: "DE-NW" },
  "de:/partnersuche/frankfurt-am-main/": { lat: 50.1109, lon: 8.6821, region: "DE-HE" },
  "de:/partnersuche/freiburg/": { lat: 47.999, lon: 7.8421, region: "DE-BW" },
  "de:/partnersuche/hamburg/": { lat: 53.5511, lon: 9.9937, region: "DE-HH" },
  "de:/partnersuche/hannover/": { lat: 52.3759, lon: 9.732, region: "DE-NI" },
  "de:/partnersuche/karlsruhe/": { lat: 49.0069, lon: 8.4037, region: "DE-BW" },
  "de:/partnersuche/kassel/": { lat: 51.3127, lon: 9.4797, region: "DE-HE" },
  "de:/partnersuche/leipzig/": { lat: 51.3397, lon: 12.3731, region: "DE-SN" },
  "de:/partnersuche/magdeburg/": { lat: 52.1205, lon: 11.6276, region: "DE-ST" },
  "de:/partnersuche/mainz/": { lat: 49.9929, lon: 8.2473, region: "DE-RP" },
  "de:/partnersuche/muenchen/": { lat: 48.1351, lon: 11.582, region: "DE-BY" },
  "de:/partnersuche/muenster/": { lat: 51.9607, lon: 7.6261, region: "DE-NW" },
  "de:/partnersuche/nordrhein-westfalen/koeln/": { lat: 50.9375, lon: 6.9603, region: "DE-NW" },
  "de:/partnersuche/nuernberg/": { lat: 49.4521, lon: 11.0767, region: "DE-BY" },
  "de:/partnersuche/paderborn/": { lat: 51.7189, lon: 8.7575, region: "DE-NW" },
  "de:/partnersuche/stuttgart/": { lat: 48.7758, lon: 9.1829, region: "DE-BW" },
  "de:/partnersuche/trier/": { lat: 49.7499, lon: 6.6371, region: "DE-RP" },
  "de:/partnersuche/wuerzburg/": { lat: 49.7913, lon: 9.9534, region: "DE-BY" },
  "at:/partnersuche/amstetten/": { lat: 48.1229, lon: 14.8721, region: "AT-3" },
  "at:/partnersuche/bregenz/": { lat: 47.5031, lon: 9.7471, region: "AT-8" },
  "at:/partnersuche/dornbirn/": { lat: 47.4125, lon: 9.7417, region: "AT-8" },
  "at:/partnersuche/eisenstadt/": { lat: 47.8456, lon: 16.5233, region: "AT-1" },
  "at:/partnersuche/graz/": { lat: 47.0707, lon: 15.4395, region: "AT-6" },
  "at:/partnersuche/innsbruck/": { lat: 47.2692, lon: 11.4041, region: "AT-7" },
  "at:/partnersuche/klagenfurt/": { lat: 46.6247, lon: 14.3053, region: "AT-2" },
  "at:/partnersuche/leoben/": { lat: 47.3765, lon: 15.0911, region: "AT-6" },
  "at:/partnersuche/linz/": { lat: 48.3069, lon: 14.2858, region: "AT-4" },
  "at:/partnersuche/salzburg/": { lat: 47.8095, lon: 13.055, region: "AT-5" },
  "at:/partnersuche/st-poelten/": { lat: 48.2047, lon: 15.6256, region: "AT-3" },
  "at:/partnersuche/steyr/": { lat: 48.0427, lon: 14.4213, region: "AT-4" },
  "at:/partnersuche/villach/": { lat: 46.6103, lon: 13.8558, region: "AT-2" },
  "at:/partnersuche/wels/": { lat: 48.1575, lon: 14.0289, region: "AT-4" },
  "at:/partnersuche/wien/": { lat: 48.2082, lon: 16.3738, region: "AT-9" },
  "ch:/partnersuche/aarau/": { lat: 47.3925, lon: 8.0444, region: "CH-AG" },
  "ch:/partnersuche/basel/": { lat: 47.5596, lon: 7.5886, region: "CH-BS" },
  "ch:/partnersuche/bern/": { lat: 46.948, lon: 7.4474, region: "CH-BE" },
  "ch:/partnersuche/biel/": { lat: 47.1368, lon: 7.2468, region: "CH-BE" },
  "ch:/partnersuche/lausanne/": { lat: 46.5197, lon: 6.6323, region: "CH-VD" },
  "ch:/partnersuche/luzern/": { lat: 47.0502, lon: 8.3093, region: "CH-LU" },
  "ch:/partnersuche/st-gallen/": { lat: 47.4245, lon: 9.3767, region: "CH-SG" },
  "ch:/partnersuche/thun/": { lat: 46.758, lon: 7.628, region: "CH-BE" },
  "ch:/partnersuche/winterthur/": { lat: 47.4988, lon: 8.7237, region: "CH-ZH" },
  "ch:/partnersuche/zuerich/": { lat: 47.3769, lon: 8.5417, region: "CH-ZH" },
};

export function cityGeo(market: MarketCode, path: string): CityGeo | null {
  return CITY_GEO[`${market}:${path}`] ?? null;
}
