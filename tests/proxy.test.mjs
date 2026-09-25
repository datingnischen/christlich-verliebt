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

test("versioned city images bypass market rewrites", () => {
  const response = proxy(request("/city-images/de/augsburg.webp"));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-middleware-rewrite"), null);
});

test("page paths without trailing slash on the preview host keep the host", () => {
  const response = proxy(request("/partnersuche/berlin?x=1"));
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "https://preview.example/partnersuche/berlin/?x=1");
});

test("internal market prefix redirects absolutely to the public market domain", () => {
  for (const [path, location] of [
    ["/at/ueber-uns", "https://christlich-verliebt.at/ueber-uns/"],
    ["/ch/ratgeber/glaube-und-liebe?utm=1", "https://christlich-verliebt.ch/ratgeber/glaube-und-liebe/?utm=1"],
    ["/de/magazin", "https://christlich-verliebt.de/magazin/"],
    ["/at", "https://christlich-verliebt.at/"],
  ]) {
    const response = proxy(request(path));
    assert.equal(response.status, 308, path);
    assert.equal(response.headers.get("location"), location, path);
  }
});

test("production host adds the trailing slash on the same host and drops a prefix", () => {
  const at = (path) => proxy(new NextRequest(`https://christlich-verliebt.at${path}`, { headers: { host: "christlich-verliebt.at" } }));
  assert.equal(at("/faq").headers.get("location"), "https://christlich-verliebt.at/faq/");
  assert.equal(at("/at/faq?a=b").headers.get("location"), "https://christlich-verliebt.at/faq/?a=b");
});

test("slashed pages, files and the root are not redirected", () => {
  for (const path of ["/", "/de/", "/de/magazin/", "/sitemap.xml", "/robots.txt", "/favicon.ico", "/brand/logo.svg"]) {
    const response = proxy(request(path));
    assert.notEqual(response.status, 308, path);
  }
});
