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
python scripts/validate_migration_contract.py .hermes/migration-contract.yaml
python scripts/validate_migration_contract.py --require-cutover-ready .hermes/migration-contract.yaml
```

Der zweite Befehl muss unmittelbar vor einer Domain- oder DNS-Änderung erfolgreich sein. Bis Legacy-Origin, Sessions, Formulare, rechtliche Routen, Rollback-Daten und unabhängige Prüfung belegt sind, bleibt der Cutover blockiert.
