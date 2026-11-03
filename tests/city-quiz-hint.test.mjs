import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { cityQuizHint } from "../lib/city-quiz-hint.ts";

test("Kassel-Quiz-Hinweis nur auf der deutschen Kassel-Seite", () => {
  const hint = cityQuizHint("de", "/partnersuche/kassel/");
  assert.ok(hint);
  assert.equal(hint.href, "https://kasseler-singles.de/#quiz");
  assert.equal(hint.anchor, "Kasseler Singles nach Interessen");
  assert.equal(cityQuizHint("de", "/partnersuche/frankfurt-am-main/"), null);
  assert.equal(cityQuizHint("at", "/partnersuche/kassel/"), null);
});

test("Stadtvorlage rendert den Hinweis als normalen Link ohne sponsored/nofollow", () => {
  const source = readFileSync(new URL("../components/city-page.tsx", import.meta.url), "utf8");
  const line = source.split("\n").find(row => row.includes("quizHint.href"));
  assert.ok(line);
  assert.doesNotMatch(line, /nofollow|sponsored/);
});
