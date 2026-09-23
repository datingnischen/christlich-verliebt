import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { faqJsonLd, parseFaq } from "../lib/faq.ts";

const snapshot = JSON.parse(await readFile(new URL("../data/public-pages.json", import.meta.url), "utf8"));
const faqPages = snapshot.pages.filter(page => page.path === "/faq/");

test("FAQ pages of all markets parse into grouped questions", () => {
  assert.deepEqual(faqPages.map(page => page.market).sort(), ["at", "ch", "de"]);
  for (const page of faqPages) {
    const faq = parseFaq(page.contentHtml);
    assert.ok(faq, `${page.market}: FAQ not parsed`);
    assert.ok(faq.count >= 20, `${page.market}: only ${faq.count} questions`);
    assert.ok(faq.groups.length >= 5, `${page.market}: only ${faq.groups.length} groups`);
    assert.ok(faq.intro?.startsWith("Du interessierst dich"), `${page.market}: intro missing`);
    const ids = faq.groups.flatMap(group => group.items.map(item => item.id));
    assert.equal(new Set(ids).size, ids.length, `${page.market}: duplicate question ids`);
    for (const item of faq.groups.flatMap(group => group.items)) {
      assert.match(item.question, /\?$/, `${page.market}: not a question: ${item.question}`);
      assert.ok(item.answerText.length > 30, `${page.market}: short answer for ${item.question}`);
      assert.doesNotMatch(item.answerHtml, /\s\}<\/p>/);
    }
  }
});

test("DE FAQ keeps the transparency questions in the last group", () => {
  const faq = parseFaq(faqPages.find(page => page.market === "de").contentHtml);
  const last = faq.groups.at(-1);
  assert.match(last.title, /^Transparenz/);
  assert.doesNotMatch(last.title, /</);
  assert.ok(last.lead);
  assert.ok(last.items.some(item => item.question.includes("Fake-Profile oder Bots")));
});

test("FAQ JSON-LD exposes every question as FAQPage mainEntity", () => {
  const page = faqPages.find(entry => entry.market === "de");
  const faq = parseFaq(page.contentHtml);
  const graph = faqJsonLd(page, faq, "Titel", "Beschreibung")["@graph"];
  const faqPage = graph.find(node => node["@type"] === "FAQPage");
  assert.equal(faqPage.mainEntity.length, faq.count);
  for (const question of faqPage.mainEntity) {
    assert.equal(question["@type"], "Question");
    assert.equal(question.acceptedAnswer["@type"], "Answer");
    assert.doesNotMatch(question.acceptedAnswer.text, /<[^>]+>/);
    assert.ok(question.url.startsWith("https://christlich-verliebt.de/faq/#"));
  }
  assert.ok(graph.some(node => node["@type"] === "BreadcrumbList"));
});
