import type { FaqContent } from "@/lib/faq";
import { publicUrl, type MarketCode } from "@/lib/markets";
import { FaqSearch } from "./faq-search";
import styles from "./faq.module.css";

export function FaqPage({ faq, market, registrationHref }: { faq: FaqContent; market: MarketCode; registrationHref: string }) {
  const listId = "faq-antworten";
  return <div className={styles.faq}>
    <section className={styles.intro} aria-labelledby="faq-ueberblick">
      <div className={styles.introCopy}>
        <p className={styles.kicker}>Schnell die passende Antwort finden</p>
        <h2 id="faq-ueberblick">{faq.count} Antworten in {faq.groups.length} Themen</h2>
        <p>Suche direkt nach einem Stichwort oder springe zu einem Thema.</p>
      </div>
      <FaqSearch targetId={listId} count={faq.count} />
      <nav className={styles.topics} aria-label="FAQ-Themen">
        {faq.groups.map((group, index) => <a href={`#${group.id}`} key={group.id}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{group.title}<small>{group.items.length}</small></a>)}
      </nav>
    </section>

    <div className={styles.layout}>
      <div className={styles.groups} id={listId}>
        {faq.groups.map((group, groupIndex) => <section className={styles.group} id={group.id} key={group.id} aria-labelledby={`${group.id}-titel`} data-faq-group>
          <header className={styles.groupHeading}>
            <span aria-hidden="true">{String(groupIndex + 1).padStart(2, "0")}</span>
            <div>
              <h2 id={`${group.id}-titel`}>{group.title}</h2>
              {group.lead ? <p>{group.lead}</p> : null}
            </div>
          </header>
          <div className={styles.items}>
            {group.items.map((item, itemIndex) => <details className={styles.item} id={item.id} key={item.id} open={groupIndex === 0 && itemIndex === 0} data-faq-item>
              <summary><h3>{item.question}</h3><span className={styles.icon} aria-hidden="true" /></summary>
              <div className={styles.answer} dangerouslySetInnerHTML={{ __html: item.answerHtml }} />
            </details>)}
          </div>
        </section>)}
      </div>

      <aside className={styles.sidebar}>
        <div className={styles.cta}>
          <span>Gemeinsame Werte</span>
          <h2>Christliche Singles kennenlernen</h2>
          <p>Kostenlos registrieren, Profil anlegen und Menschen entdecken, denen Glaube und Respekt wichtig sind.</p>
          <a href={registrationHref}>Jetzt kostenlos starten</a>
        </div>
        <div className={styles.help}>
          <h2>Deine Frage war nicht dabei?</h2>
          <p>Unser Support-Team hilft Dir persönlich weiter.</p>
          <a href={`${publicUrl(market)}hilfe/`}>Zur Hilfe</a>
          <a href={`${publicUrl(market)}kontakt/`}>Support kontaktieren</a>
        </div>
      </aside>
    </div>

    <section className={styles.closing}>
      <div>
        <p className={styles.kicker}>Alles geklärt?</p>
        <h2>Starte Deine christliche Partnersuche</h2>
        <p>Die Basis-Mitgliedschaft ist kostenlos – Du kannst die Plattform in Ruhe kennenlernen.</p>
      </div>
      <a href={registrationHref}>Kostenlos registrieren</a>
    </section>
  </div>;
}
