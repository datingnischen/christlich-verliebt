from __future__ import annotations

import hashlib
import html
import ipaddress
import json
import mimetypes
import posixpath
import re
import socket
import time
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse
from xml.etree import ElementTree as ET

import requests
from bs4 import BeautifulSoup, Comment

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
ASSET_DIR = ROOT / "public" / "imported"
DOMAINS = {
    "de": "christlich-verliebt.de",
    "at": "christlich-verliebt.at",
    "ch": "christlich-verliebt.ch",
}
LOCALES = {"de": "de-DE", "at": "de-AT", "ch": "de-CH"}
SITEMAPS = {
    "de": [
        "https://christlich-verliebt.de/partner_sitemap.php",
        "https://christlich-verliebt.de/magazin/sitemap.xml",
    ],
    "at": ["https://christlich-verliebt.at/sitemap.php"],
    "ch": ["https://christlich-verliebt.ch/sitemap.php"],
}
PLATFORM_PATTERNS = [
    re.compile(r"^/(?:registration|login|suche|gutschein|hilfe|kontakt)(?:/|$)"),
    re.compile(r"^/(?:fragenflirt|fotoflirt|videodate|videodating|unsere-erfolgsgeschichten|kostenlose-basis-mitgliedschaft|premium-mitgliedschaft|sicherheit-und-datenschutz|redaktionelle-kontrolle|datenschutz|impressum|agb|barrierefreiheit)\.html/?$"),
]
EXCLUDED_EDITORIAL_PATHS = {"/magazin/beispiel-seite/"}
DROP_SELECTORS = [
    "script", "style", "iframe", "form", "button", "input", "select", "textarea", "noscript",
    ".grid-view", ".userimage", ".registration-form", "#reg-form-panel", ".platform-footer", "header", "footer",
    ".entry-header", ".aioseo-author-bio-compact",
]
ALLOWED_TAGS = {
    "p", "br", "h2", "h3", "h4", "ul", "ol", "li", "strong", "em", "b", "i", "blockquote",
    "a", "img", "audio", "source", "figure", "figcaption", "div", "section", "span", "table", "thead", "tbody", "tr", "th", "td",
}
ALLOWED_ATTRS = {
    "a": {"href", "title", "rel"},
    "img": {"src", "alt", "width", "height", "loading"},
    "audio": {"controls", "preload"},
    "source": {"src", "type"},
    "div": {"class"}, "section": {"class"}, "span": {"class"},
    "th": {"scope"}, "td": {"colspan", "rowspan"},
}
USER_MEDIA_HOSTS = {"cdn1.icony-hosting.de", "cdn2.icony-hosting.de", "cdn3.icony-hosting.de"}
APPROVED_ASSET_HOSTS = {
    "static-cms.icony-hosting.de", "static2.icony-hosting.de", "christlich-verliebt.de",
    "christlich-verliebt.at", "christlich-verliebt.ch",
}
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "christlich-verliebt-migration/1.0 (+public editorial snapshot)"})


def assert_public_https_url(url: str) -> None:
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    if parsed.scheme != "https" or parsed.username or parsed.password or parsed.port not in (None, 443):
        raise RuntimeError(f"Unsafe source URL: {url}")
    if host not in APPROVED_ASSET_HOSTS | set(DOMAINS.values()):
        raise RuntimeError(f"Source host not approved: {host}")
    for result in socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM):
        address = ipaddress.ip_address(result[4][0])
        if not address.is_global:
            raise RuntimeError(f"Non-public source address rejected for {host}: {address}")


def fetch_response(url: str) -> requests.Response:
    current = url
    for _ in range(6):
        assert_public_https_url(current)
        response = SESSION.get(current, timeout=(10, 45), allow_redirects=False)
        if response.is_redirect or response.is_permanent_redirect:
            location = response.headers.get("location")
            if not location:
                raise RuntimeError(f"Redirect without location: {current}")
            current = urljoin(current, location)
            continue
        response.raise_for_status()
        return response
    raise RuntimeError(f"Too many redirects: {url}")


def fetch(url: str, *, binary: bool = False) -> bytes | str:
    response = fetch_response(url)
    if len(response.content) > 15_000_000:
        raise RuntimeError(f"Response too large: {url}")
    return response.content if binary else response.text


def sitemap_urls(url: str, seen: set[str] | None = None) -> list[str]:
    seen = seen or set()
    if url in seen:
        return []
    seen.add(url)
    raw = str(fetch(url))
    root = ET.fromstring(raw)
    locs: list[str] = []
    for entry in list(root):
        if not (entry.tag.endswith("url") or entry.tag.endswith("sitemap")):
            continue
        direct_loc = next((node for node in list(entry) if node.tag.endswith("loc")), None)
        if direct_loc is not None:
            locs.append(html.unescape((direct_loc.text or "").strip()).replace("<![CDATA[", "").replace("]]>", ""))
    nested, pages = [], []
    for loc in locs:
        if loc.endswith(("sitemap.xml", "sitemap.php")) or "-sitemap.xml" in loc:
            nested.extend(sitemap_urls(loc, seen))
        else:
            pages.append(loc)
    return pages + nested


def is_platform_path(path: str) -> bool:
    return any(pattern.search(path) for pattern in PLATFORM_PATTERNS)


def normalized_url_path(url: str) -> str:
    path = urlparse(url).path.replace("\\", "/")
    for _ in range(3):
        decoded = unquote(path).replace("\\", "/")
        if decoded == path:
            break
        path = decoded
    return posixpath.normpath("/" + path.lstrip("/")).lower()


def unwrap_media_proxy_url(url: str) -> str:
    parsed = urlparse(url)
    if (parsed.hostname or "").lower() != "sp-ao.shortpixel.ai":
        return url
    nested_start = url.find("https://", len("https://"))
    return url[nested_start:] if nested_start >= 0 else url


def stable_asset_path(url: str, market: str) -> tuple[str, dict] | None:
    url = unwrap_media_proxy_url(url)
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    if host in USER_MEDIA_HOSTS or "/user-media/" in normalized_url_path(url):
        return None
    if host not in APPROVED_ASSET_HOSTS:
        return None
    try:
        data = fetch(url, binary=True)
    except Exception:
        return None
    assert isinstance(data, bytes)
    digest = hashlib.sha256(data).hexdigest()
    ext = Path(parsed.path).suffix.lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif", ".avif"}:
        content_type = mimetypes.guess_type(url)[0] or ""
        ext = mimetypes.guess_extension(content_type) or ".bin"
    rel = Path("imported") / market / f"{digest[:20]}{ext}"
    destination = ROOT / "public" / rel
    destination.parent.mkdir(parents=True, exist_ok=True)
    if not destination.exists():
        destination.write_bytes(data)
    return "/" + rel.as_posix(), {
        "sourceUrl": url,
        "localPath": "/" + rel.as_posix(),
        "sha256": digest,
        "bytes": len(data),
        "rightsStatus": "legacy-brand-or-editorial-asset; verify provenance before production cutover",
    }


def source_container(soup: BeautifulSoup, path: str):
    if path == "/":
        cms = soup.select_one("#cms-content .text-container") or soup.select_one("#cms-content")
        return cms or soup.find("main")
    if path == "/magazin/":
        return soup.select_one("article .entry-content") or soup.select_one(".entry-content") or soup.find("main")
    if path.startswith("/magazin/"):
        return soup.find("article") or soup.select_one(".entry-content") or soup.find("main")
    main = soup.find("main")
    if main and main.get("id") == "static":
        panels = main.select(".panel")
        return max(panels, key=lambda item: len(item.get_text(" ", strip=True)), default=main)
    if main and "city-container" in (main.get("class") or []):
        panels = main.select(".panel")
        return max(panels, key=lambda item: len(item.get_text(" ", strip=True)), default=main)
    return main or soup.find("article") or soup.body


def clean_content(container, source_url: str, market: str, provenance: list[dict]) -> str:
    fragment = BeautifulSoup(str(container), "html.parser")
    for selector in DROP_SELECTORS:
        for node in fragment.select(selector):
            node.decompose()
    for comment in fragment.find_all(string=lambda value: isinstance(value, Comment)):
        comment.extract()
    for node in list(fragment.find_all(True)):
        if node.name not in ALLOWED_TAGS:
            node.unwrap()
            continue
        allowed = ALLOWED_ATTRS.get(node.name, set())
        node.attrs = {key: value for key, value in node.attrs.items() if key in allowed and not key.lower().startswith("on")}
        if node.name == "a":
            href = str(node.get("href") or "").strip()
            if not href or href.lower().startswith(("javascript:", "data:", "file:")):
                node.unwrap()
                continue
            absolute = urljoin(source_url, href)
            parsed = urlparse(absolute)
            if parsed.scheme not in {"http", "https"}:
                node.unwrap()
                continue
            node["href"] = absolute
            if parsed.hostname not in DOMAINS.values():
                node["rel"] = "nofollow noopener"
        elif node.name == "img":
            src = unwrap_media_proxy_url(urljoin(source_url, str(node.get("src") or "")))
            result = stable_asset_path(src, market)
            if result is None:
                node.decompose()
                continue
            local_path, record = result
            provenance.append(record)
            node["src"] = local_path
            node["loading"] = "lazy"
            node["alt"] = str(node.get("alt") or "").strip()
        elif node.name == "source":
            if node.parent is None or node.parent.name != "audio":
                node.decompose()
                continue
            src = unwrap_media_proxy_url(urljoin(source_url, str(node.get("src") or "")))
            result = stable_asset_path(src, market)
            if result is None:
                node.decompose()
                continue
            local_path, record = result
            provenance.append(record)
            node["src"] = local_path
            node["type"] = str(node.get("type") or "audio/mpeg")
    for empty in list(fragment.find_all(["div", "section", "span", "p"])):
        if not empty.get_text(" ", strip=True) and not empty.find(["img", "audio"]):
            empty.decompose()
    return "\n".join(str(node) for node in fragment.body.contents if str(node).strip()).strip() if fragment.body else str(fragment).strip()


def preferred_image(content: str, path: str, provenance: list[dict]) -> str | None:
    sources = {item["localPath"]: item["sourceUrl"].lower() for item in provenance}
    images = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', content, re.I)
    slug = path.strip("/").split("/")[-1].replace("-", "") if path != "/" else ""
    ranked: list[tuple[int, str]] = []
    for index, image in enumerate(images):
        source = sources.get(image, image)
        filename = Path(urlparse(source).path).name.lower()
        compact_source = re.sub(r"[^a-z0-9]", "", filename)
        score = -index
        if slug and slug in compact_source:
            score += 20
        if re.search(r"statistik|infografik|logo|seal|siegel|badge|icon|testbericht", filename):
            score -= 100
        if re.search(r"stadt|city|panorama|skyline|kirche|church|dom|muenster", filename):
            score += 8
        ranked.append((score, image))
    best_score, best_image = max(ranked, default=(-1, None))
    return best_image if best_score >= 0 else None


def metadata(soup: BeautifulSoup, source_url: str) -> tuple[str, str, str]:
    title = " ".join((soup.title.get_text(" ", strip=True) if soup.title else "").split())
    description_node = soup.find("meta", attrs={"name": re.compile("^description$", re.I)})
    description = " ".join(str(description_node.get("content") or "").split()) if description_node else ""
    h1 = soup.find("h1")
    hero = " ".join(h1.get_text(" ", strip=True).split()) if h1 else title.split(" | ")[0].split(" - ")[0]
    return title, description, hero


def family_for(path: str) -> str:
    if path == "/": return "home"
    if path == "/partnersuche/": return "location-hub"
    if path.startswith("/partnersuche/"): return "location"
    if path == "/magazin/": return "magazine-hub"
    if path.startswith("/magazin/"): return "magazine"
    if path == "/ratgeber/": return "guide-hub"
    if path.startswith("/ratgeber/"): return "guide"
    return "editorial"


def normalize_path(url: str) -> str:
    path = urlparse(url).path or "/"
    return "/" if path == "/" else "/" + path.strip("/") + "/"


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    records: list[dict] = []
    skipped: list[dict] = []
    provenance: list[dict] = []
    for market, sitemap_list in SITEMAPS.items():
        domain = DOMAINS[market]
        urls: list[str] = [f"https://{domain}/"]
        for sitemap in sitemap_list:
            urls.extend(sitemap_urls(sitemap))
        seen_paths: set[str] = set()
        for url in urls:
            path = normalize_path(url)
            if path in seen_paths:
                continue
            seen_paths.add(path)
            if is_platform_path(path):
                skipped.append({"market": market, "path": path, "sourceUrl": url, "owner": "ICONY platform/legal"})
                continue
            if path in EXCLUDED_EDITORIAL_PATHS:
                skipped.append({"market": market, "path": path, "sourceUrl": url, "owner": "excluded low-value editorial"})
                continue
            try:
                response = fetch_response(url)
                soup = BeautifulSoup(response.text, "html.parser")
                title, description, hero = metadata(soup, response.url)
                container = source_container(soup, path)
                if container is None:
                    raise RuntimeError("No public content container")
                content = clean_content(container, response.url, market, provenance)
                if len(BeautifulSoup(content, "html.parser").get_text(" ", strip=True)) < 80:
                    raise RuntimeError("Public content too short after sanitization")
                records.append({
                    "market": market,
                    "locale": LOCALES[market],
                    "domain": domain,
                    "path": path,
                    "sourceUrl": url,
                    "canonical": f"https://{domain}{path}",
                    "family": family_for(path),
                    "title": title,
                    "description": description,
                    "heroTitle": hero,
                    "heroImage": preferred_image(content, path, provenance),
                    "contentHtml": content,
                })
                print(f"IMPORTED {market} {path}")
            except Exception as error:
                skipped.append({"market": market, "path": path, "sourceUrl": url, "owner": "unresolved", "error": str(error)})
                print(f"SKIPPED {market} {path}: {error}")
            time.sleep(0.03)
    records.sort(key=lambda item: (item["market"], item["path"]))
    skipped.sort(key=lambda item: (item["market"], item["path"]))
    unique_provenance = {item["localPath"]: item for item in provenance}
    referenced_assets = {ROOT / "public" / item["localPath"].lstrip("/") for item in unique_provenance.values()}
    for existing in ASSET_DIR.rglob("*"):
        if existing.is_file() and existing not in referenced_assets:
            existing.unlink()
    payload = {"schemaVersion": 1, "pages": records}
    (DATA_DIR / "public-pages.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    (DATA_DIR / "route-ownership.json").write_text(json.dumps({"migrated": [{"market": p["market"], "path": p["path"], "owner": "nextjs"} for p in records], "notMigrated": skipped}, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    (DATA_DIR / "asset-provenance.json").write_text(json.dumps(sorted(unique_provenance.values(), key=lambda item: item["localPath"]), ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"PAGES={len(records)} SKIPPED={len(skipped)} ASSETS={len(unique_provenance)}")


if __name__ == "__main__":
    main()
