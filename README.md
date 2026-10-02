# christlich-verliebt.de · .at · .ch

Gemeinsames Next.js/Vercel-Frontend für die **öffentlichen redaktionellen Inhalte** der drei christlich-verliebt-Märkte.

## Abgrenzung

**Next.js:** öffentliche Start-, Ratgeber-, Magazin- und regionale Partnersuche-Seiten, Canonicals, marktbezogene Sitemaps und Robots-Dateien.

**ICONY/Legacy:** Registrierung, Login, Suche, Mitglieder/Profile, Nachrichten, Formulare, Hilfe/Support, Vertragsfunktionen sowie Impressum, Datenschutz und AGB. Es werden weder Mitgliederdaten noch Profilbilder importiert.

> Die Preview kann bereitgestellt werden. DNS-/Domain-Cutover bleibt gesperrt, bis für alle drei Domains ein separat erreichbarer Legacy-Origin für die ICONY-Routen nachgewiesen und der Migration-Contract vollständig validiert ist.

## Vorschau-Routen

- `/de` → Deutschland
- `/at` → Österreich
- `/ch` → Schweiz

Produktionshosts werden ohne sichtbaren Länderpräfix auf die jeweilige Marktansicht umgeschrieben.

## Datenimport

```bash
npm install
npm run import
```

Der Importer liest ausschließlich definierte HTTPS-Quellen, entfernt ausführbares Markup und private Mitgliederbereiche, lädt erlaubte redaktionelle Bilder lokal herunter und erzeugt:

- `data/public-pages.json`
- `data/route-ownership.json`
- `data/asset-provenance.json`
- `public/imported/<market>/…`

Jedes lokale Asset hat einen SHA-256-Eintrag. Der Rechtestatus bleibt bis zur Produktionsfreigabe bewusst als zu verifizieren markiert.

## Qualitätsprüfung

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev
```

## AID-Konvention

- Location-/Partnersuche-Seiten: `aid=location`
- Magazin-Seiten: `aid=magazin`

## Cutover-Gate

```bash
python scripts/validate_migration_contract.py migration-contract.yaml
python scripts/validate_migration_contract.py --require-cutover-ready migration-contract.yaml
```

Der zweite Befehl muss unmittelbar vor einer Domain- oder DNS-Änderung erfolgreich sein. Der Vertrag liegt in `migration-contract.yaml` und ist bewusst noch ungültig: offene Nachweise stehen dort als `[REQUIRED] …` bzw. `false` (u. a. Legacy-Origin, Rollback-DNS, Routenprüfung, Review-Range, Roh-Quellen-Hash). Bis Legacy-Origin, Sessions, Formulare, rechtliche Routen, Rollback-Daten und unabhängige Prüfung belegt sind, bleibt der Cutover blockiert.

## WordPress-kompatibler REST-Endpunkt (für ICONY)

ICONY liest auf den Plattform-Startseiten drei Magazin-Teaser im WordPress-Format. Der Endpunkt bleibt unter der alten Adresse erreichbar, wird aber aus den Repo-Dateien erzeugt (`lib/wp-rest-compat.ts`). Je Markt ein eigener Endpunkt (intern `/<market>/magazin/wp-json/...`, auf den Produktionshosts ohne Präfix):

- `https://christlich-verliebt.de/magazin/wp-json/wp/v2/posts` (auch `.at` und `.ch`; Vorschau: `https://christlich-verliebt.vercel.app/magazin/wp-json/wp/v2/posts` bzw. `/at/magazin/wp-json/...`)
- Weitere Routen: `/wp/v2/posts/<id>`, `categories`, `tags`, `media/<id>`; dazu `/magazin/?rest_route=/wp/v2/posts` und `/magazin/index.php?rest_route=/wp/v2/posts`
- Parameter: `per_page` (max. 100), `page`, `_embed` (`wp:featuredmedia`, `wp:term`), `_fields`, `orderby`, `order`, `categories`, `slug`, `search`, `include`, `after`, `before`. Header: CORS `*`, `X-WP-Total`, `X-WP-TotalPages`, `Cache-Control` (s-maxage 3600), `X-Robots-Tag: noindex`; `OPTIONS` und `HEAD` funktionieren.
- Nur Magazin-Beiträge des jeweiligen Marktes. Ein Magazin gibt es bisher nur in Deutschland (60 Beiträge); `.at` und `.ch` antworten mit einer leeren Liste (200, `X-WP-Total: 0`). `/wp/v2/users`, `/wp/v2/pages` und alles Unbekannte antworten 404; `author` ist nur eine ID.
- `link` ist die kanonische Live-URL des Marktes. Beitragsbild, Bilder und Audio im Fließtext liegen absolut auf dem Asset-Host (`/app-assets/...`), verkleinerte Größen laufen über `/_next/image/` des Asset-Hosts. `excerpt.rendered` ist die Meta-Description des Artikels.

**nginx/ICONY:** `/magazin/wp-json/*`, `/magazin/index.php` und `/magazin/` mit `?rest_route=` müssen je Domain an Vercel durchgereicht werden (wie die übrigen Seitenrouten, bei `.at`/`.ch` mit dem Länderpräfix des Upstreams). Aufruf ohne Slash am Ende liefert 200 JSON: `proxy.ts` nimmt diese Pfade von der Slash-Umleitung aus.

**IDs und Daten:** Der Seitenimport kennt weder WordPress-IDs noch Veröffentlichungsdaten. `data/wp-posts.json` enthält deshalb einen Abzug der echten Werte (Beitrags-ID, Datum, Änderungsdatum, Autor-ID, Kategorien, Schlagwörter, Beitragsbild-ID) aus dem damals noch erreichbaren WordPress-REST (`python scripts/fetch_wp_post_meta.py`, nur solange `/magazin/wp-json/` noch WordPress ist). Eigene Artikel ohne WordPress-Quelle (`data/editorial-pages.json`) bekommen `100000 + FNV-1a(Slug) mod 900000`, ihr Beitragsbild `1000000 + Beitrags-ID` und als Datum ihr `updated` (00:00 Uhr). Bildmaße stehen in `data/wp-media.json` (`python scripts/build_wp_media.py` nach jedem Import). Autoren- und Werkzeugseiten unter `/magazin/` ohne WordPress-Beitrag (`christian-m-haas`, `christen-fit-faktor`) sind keine Beiträge.
