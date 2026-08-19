import Image from "next/image";
import { getMarket, MARKET_CODES, previewPath, publicUrl, type MarketCode } from "@/lib/markets";
import styles from "./site-shell.module.css";

export function SiteShell({ children, market, registrationHref }: { children: React.ReactNode; market: MarketCode; registrationHref?: string }) {
  const config = getMarket(market);
  const registration = registrationHref ?? publicUrl(market, "/registration/");
  const login = publicUrl(market, "/login/");
  const nav = [
    ["Start", "/"],
    ["Partnersuche", "/partnersuche/"],
    ...(market === "de" ? [["Magazin", "/magazin/"]] : []),
    ...(market === "ch" ? [["Ratgeber", "/ratgeber/"]] : []),
    ["Dating-Tipps", "/dating-tipps/"],
    ["FAQ", "/faq/"],
  ];

  return <div className={styles.shell}>
    <header className={styles.header}>
      <div className={styles.topbar}>Christliche Partnersuche mit Respekt, Sicherheit und gemeinsamen Werten</div>
      <div className={styles.headerInner}>
        <a className={styles.brand} href={previewPath(market)}>
          <Image src={config.logoPath} alt={`${config.domain} Logo`} width={300} height={48} priority />
        </a>
        <nav aria-label="Hauptnavigation" className={styles.nav}>
          {nav.map(([label, href]) => <a key={href} href={previewPath(market, href)}>{label}</a>)}
        </nav>
        <div className={styles.actions}>
          <a className={styles.login} href={login}>Login</a>
          <a className={styles.primary} href={registration}>Kostenlos registrieren</a>
        </div>
      </div>
    </header>
    {children}
    <footer className={styles.footer}>
      <div className={styles.footerCta}>
        <div><span>Glaube verbindet</span><h2>Finde einen Menschen, der Deine Werte teilt.</h2></div>
        <a href={registration}>Jetzt kostenlos registrieren</a>
      </div>
      <div className={styles.footerGrid}>
        <section><h3>Entdecken</h3><a href={previewPath(market, "/partnersuche/")}>Partnersuche nach Region</a>{market === "de" ? <a href={previewPath(market, "/magazin/")}>Magazin</a> : null}<a href={previewPath(market, "/dating-tipps/")}>Dating-Tipps</a><a href={previewPath(market, "/faq/")}>Häufige Fragen</a></section>
        <section><h3>Mitgliedschaft</h3><a href={registration}>Kostenlos registrieren</a><a href={login}>Login</a><a href={publicUrl(market, "/kostenlose-basis-mitgliedschaft.html")}>Basis-Mitgliedschaft</a><a href={publicUrl(market, "/premium-mitgliedschaft.html")}>Premium-Mitgliedschaft</a></section>
        <section><h3>Vertrauen</h3><a href={publicUrl(market, "/sicherheit-und-datenschutz.html")}>Sicherheit & Datenschutz</a><a href={publicUrl(market, "/redaktionelle-kontrolle.html")}>Redaktionelle Kontrolle</a><a href={publicUrl(market, "/unsere-erfolgsgeschichten.html")}>Erfolgsgeschichten</a></section>
        <section><h3>Service & Länder</h3><a href={publicUrl(market, "/hilfe/")}>Hilfe & Support</a><a href={publicUrl(market, "/datenschutz.html")}>Datenschutz</a><a href={publicUrl(market, "/impressum.html")}>Impressum</a>{MARKET_CODES.filter(code => code !== market).map(code => <a key={code} href={publicUrl(code)}>{getMarket(code).countryName} · {getMarket(code).domain}</a>)}</section>
      </div>
      <p className={styles.legal}>Die Anmeldung und Dein persönlicher Mitgliederbereich werden sicher über unsere bewährte Datingplattform bereitgestellt.</p>
    </footer>
  </div>;
}
