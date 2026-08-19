import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server.js";
import { proxy } from "../proxy.ts";

function request(path, headers = {}) {
  return new NextRequest(`https://preview.example${path}`, {
    headers: { host: "preview.example", ...headers },
  });
}

test("preview routing ignores spoofed forwarded hosts", () => {
  const response = proxy(request("/de/partnersuche/berlin/", {
    "x-forwarded-host": "christlich-verliebt.at",
  }));
  assert.equal(response.status, 200);
  assert.match(response.headers.get("x-middleware-rewrite") ?? "", /\/de\/partnersuche\/berlin\/$/);
});

test("production host takes precedence over explicit market prefix", () => {
  const response = proxy(new NextRequest("https://christlich-verliebt.at/de/partnersuche/berlin/", {
    headers: { host: "christlich-verliebt.at" },
  }));
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "https://christlich-verliebt.at/partnersuche/berlin/");
});

test("direct internal sitemap implementation route is hidden", () => {
  const response = proxy(request("/de/sitemap-data.xml"));
  assert.equal(response.status, 404);
});
