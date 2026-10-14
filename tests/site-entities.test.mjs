import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { AUTHOR_PERSON_ID } from "../lib/videos.ts";
import { buildMagazineArticleGraph, buildSiteGraph, withBerlinOffset } from "../lib/site-entities.ts";

const source = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const siteRoot = "https://christlich-verliebt.de/";
const sameAs = ["https://www.facebook.com/christlichverliebt/", "https://www.youtube.com/@Christlich-Verliebt"];

function assertNoDanglingIds(graph) {
  const nodes = graph["@graph"];
  const defined = new Set(nodes.map(node => node["@id"]).filter(Boolean));
  const refs = [];
  const walk = value => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (!value || typeof value !== "object") return;
    const keys = Object.keys(value);
    if (keys.length === 1 && keys[0] === "@id") refs.push(value["@id"]);
    else Object.values(value).forEach(walk);
  };
  nodes.forEach(node => Object.entries(node).forEach(([key, value]) => key !== "@id" && walk(value)));
  for (const ref of refs) assert.ok(defined.has(ref), `dangling @id ${ref}`);
}

test("site graph links ICONY as operator, the brand with its own profiles and the website", () => {
  const graph = buildSiteGraph({
    siteRoot,
    sameAs,
    page: {
      type: "AboutPage",
      url: "https://christlich-verliebt.de/ueber-uns/",
      name: "Über uns",
      description: "Beschreibung",
      breadcrumb: [{ name: "Startseite", url: siteRoot }, { name: "Über uns", url: "https://christlich-verliebt.de/ueber-uns/" }],
    },
  });
  const nodes = graph["@graph"];
  assert.deepEqual(nodes.map(node => node["@type"]), ["Organization", "Brand", "WebSite", "AboutPage", "BreadcrumbList"]);
  const [operator, brand, website, page] = nodes;
  assert.equal(operator["@id"], "https://christlich-verliebt.de/#operator");
  assert.equal(operator.name, "ICONY GmbH");
  assert.equal(operator.url, "https://www.icony.com");
  assert.equal(brand["@id"], "https://christlich-verliebt.de/#brand");
  assert.equal(brand.name, "christlich-verliebt");
  assert.deepEqual(brand.sameAs, sameAs);
  assert.equal(website["@id"], "https://christlich-verliebt.de/#website");
  assert.equal(website.publisher["@id"], operator["@id"]);
  assert.equal(website.about["@id"], brand["@id"]);
  assert.equal(page.isPartOf["@id"], website["@id"]);
  assertNoDanglingIds(graph);
});

test("site graph follows the market domain and language", () => {
  const nodes = buildSiteGraph({ siteRoot: "https://christlich-verliebt.ch/", sameAs })["@graph"];
  const website = nodes.find(node => node["@type"] === "WebSite");
  assert.equal(website.url, "https://christlich-verliebt.ch/");
  assert.equal(website.name, "christlich-verliebt.ch");
  assert.equal(website.inLanguage, "de-CH");
  assert.equal(website.publisher["@id"], "https://christlich-verliebt.ch/#operator");
});

test("brand sameAs comes from the marked brand profiles in SOCIAL_CHANNELS, never from review portals", async () => {
  const about = await source("lib/about.ts");
  const channels = about.slice(about.indexOf("export const SOCIAL_CHANNELS"), about.indexOf("export function brandSameAs"));
  const brandProfiles = [...channels.matchAll(/href: "([^"]+)"[^\n]*brandProfile: true/g)].map(match => match[1]);
  assert.deepEqual(brandProfiles, sameAs);
  assert.match(about, /filter\(channel => channel\.brandProfile\)/);
  assert.match(await source("components/site-json-ld.tsx"), /sameAs: brandSameAs\(\)/);
  assert.doesNotMatch(channels, /trustpilot|singleboersen/i);
});

test("magazine posts get a BlogPosting by Christian M. Haas with the profile @id and a breadcrumb", () => {
  const url = "https://christlich-verliebt.de/magazin/advent/";
  const graph = buildMagazineArticleGraph({
    siteRoot,
    sameAs,
    magazineName: "Magazin",
    magazineUrl: "https://christlich-verliebt.de/magazin/",
    url,
    headline: "Advent – Bedeutung und Ursprung",
    description: "Beschreibung",
    image: "https://christlich-verliebt.vercel.app/app-assets/imported/de/bild.jpg",
    datePublished: "2021-04-08T19:43:20",
    dateModified: "2026-01-10T09:00:00",
  });
  const byType = Object.fromEntries(graph["@graph"].map(node => [node["@type"], node]));
  assert.deepEqual(Object.keys(byType), ["WebPage", "BreadcrumbList", "BlogPosting", "WebSite", "Brand", "Organization"]);
  const article = byType.BlogPosting;
  assert.equal(article["@id"], `${url}#article`);
  assert.equal(article.mainEntityOfPage["@id"], `${url}#webpage`);
  assert.equal(article.author["@type"], "Person");
  assert.equal(article.author.name, "Christian M. Haas");
  assert.equal(article.author["@id"], AUTHOR_PERSON_ID);
  assert.equal(article.author.url, "https://christlich-verliebt.de/magazin/christian-m-haas/");
  assert.equal(article.publisher["@id"], "https://christlich-verliebt.de/#operator");
  assert.equal(article.isPartOf["@id"], "https://christlich-verliebt.de/#website");
  assert.equal(article.datePublished, "2021-04-08T19:43:20+02:00");
  assert.equal(article.dateModified, "2026-01-10T09:00:00+01:00");
  assert.deepEqual(article.image, ["https://christlich-verliebt.vercel.app/app-assets/imported/de/bild.jpg"]);
  assert.deepEqual(byType.BreadcrumbList.itemListElement.map(item => item.name), ["Startseite", "Magazin", "Advent – Bedeutung und Ursprung"]);
  assert.equal(byType.WebPage.breadcrumb["@id"], `${url}#breadcrumb`);
  assertNoDanglingIds(graph);
});

test("magazine pages without a post date get WebPage and breadcrumb only", () => {
  const graph = buildMagazineArticleGraph({
    siteRoot,
    sameAs,
    kind: "page",
    magazineName: "Magazin",
    magazineUrl: "https://christlich-verliebt.de/magazin/",
    url: "https://christlich-verliebt.de/magazin/christen-fit-faktor/",
    headline: "Christen-Fit-Faktor",
    description: "Beschreibung",
  });
  assert.ok(!graph["@graph"].some(node => node["@type"] === "BlogPosting"));
  assert.ok(graph["@graph"].some(node => node["@type"] === "BreadcrumbList"));
});

test("Berlin offset is added to zone-less dates, including date-only values", () => {
  assert.equal(withBerlinOffset("2026-09-28"), "2026-09-28T00:00:00+02:00");
  assert.equal(withBerlinOffset("2026-12-24T18:00:00"), "2026-12-24T18:00:00+01:00");
  assert.equal(withBerlinOffset("2026-12-24T18:00:00Z"), "2026-12-24T18:00:00Z");
  assert.equal(withBerlinOffset(null), undefined);
});

test("homepage, about pages, magazine and articles render the schema graphs", async () => {
  const route = await source("app/[market]/[[...slug]]/page.tsx");
  assert.match(route, /<PageJsonLd page=\{page\} \/><HomePage/);
  assert.match(route, /<PageJsonLd page=\{page\} \/><MagazineHub/);
  assert.match(route, /buildMagazineArticleGraph\(/);
  assert.match(route, /kind: dates \? "post" : "page"/);
  const about = await source("app/[market]/ueber-uns/page.tsx");
  assert.match(about, /<SiteJsonLd siteRoot=\{publicUrl\(market\)\} page=\{aboutPage\(market\)\}/);
  assert.doesNotMatch(about, /#organization/);
  assert.match(await source("app/[market]/ueber-uns/suche/page.tsx"), /<SiteJsonLd /);
  // Das Autorenprofil behält seinen eigenen Graphen mit derselben Person-@id.
  assert.match(await source("app/[market]/magazin/christian-m-haas/page.tsx"), /const PERSON_ID = `\$\{CANONICAL\}#person`/);
});

test("imported magazine content carries no leftover AIOSEO or Yoast schema", async () => {
  const { pages } = JSON.parse(await source("data/public-pages.json"));
  const editorial = JSON.parse(await source("data/editorial-pages.json")).pages;
  for (const page of [...pages, ...editorial]) assert.doesNotMatch(page.contentHtml, /application\/ld\+json|aioseo|yoast/i, page.path);
});
