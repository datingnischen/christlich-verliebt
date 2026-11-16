export const CHRISTIAN_VITA_URL = "https://datingnischen.de/christian/";
export const CHRISTIAN_PERSON_ID = CHRISTIAN_VITA_URL + "#person";
export const CHRISTIAN_NAME = "Christian M. Haas";

export function christianPerson() {
  return {
    "@type": "Person",
    "@id": CHRISTIAN_PERSON_ID,
    name: CHRISTIAN_NAME,
    url: CHRISTIAN_VITA_URL,
    sameAs: [
      "https://www.linkedin.com/in/christian-m-haas-457323379",
      "https://www.xing.com/profile/ChristianM_Haas/web_profiles",
      "https://creators.spotify.com/pod/profile/christian-m-haas/",
      "https://www.amazon.com/author/christian-m-haas",
      "https://gravatar.com/automatic8c1daff973",
      "https://www.wikidata.org/wiki/Q142183607",
    ],
  };
}
