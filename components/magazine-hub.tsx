import Image from "next/image";
import { CityIcon, type CityIconName } from "@/components/city-icons";
import { CtaBand } from "@/components/city-page";
import { MagazineFilter } from "@/components/magazine-filter";
import { getChildPages, getMagazineCategories, registrationUrl, selectPageImage, type PublicPage } from "@/lib/content";
import { previewPath, publicUrl } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";
import styles from "./magazine-hub.module.css";

// Anzeige-Reihenfolge, Name, Einleitung und Symbol der WordPress-Kategorien (Slugs bleiben die Sprungziele).
const CATEGORY_META: Record<string, { label: string; intro: string; icon: CityIconName }> = {
  "christliche-singleboersen": { label: "Christliche Singlebörsen", intro: "Portale für gläubige Singles im Porträt – was sie auszeichnet und für wen sie passen.", icon: "people" },
  "christliche-feiertage": { label: "Christliche Feiertage", intro: "Von Advent bis Pfingsten: Ursprung, Bedeutung und Bräuche der Feste im Kirchenjahr.", icon: "calendar" },
  "christliche-persoenlichkeiten": { label: "Christliche Persönlichkeiten", intro: "Menschen, deren Glaube Spuren hinterlassen hat – von Franz von Assisi bis Samuel Koch.", icon: "spark" },
  "beziehung-werte": { label: "Beziehung & Werte", intro: "Rollenbilder, Erwartungen, Verbindlichkeit: wie der Glaube das Kennenlernen und die Partnerschaft prägt.", icon: "heart" },
  allgemein: { label: "Glaube & Alltag", intro: "Gebete, Bibelverse, Symbole und die Fragen, die Christen im Alltag bewegen.", icon: "book" },
};
const LEAD_STORY = "/magazin/trad-wife-rollenbilder-dating/";
const EDITOR_PICKS = ["/magazin/dating-unter-christen-gemeinsame-werte/", "/magazin/katholische-singles/", "/magazin/top-10-staedte-christliche-singles-deutschland/", "/magazin/antrag-ohne-ring/"];
const AUTHOR_PROFILE = "/magazin/christian-m-haas/";
// Aufmacher plus sechs Karten sichtbar, der Rest steckt aufklappbar darunter.
const VISIBLE_CARDS = 7;

export const MAGAZINE_TITLE = "Magazin für christliche Singles: Glaube, Liebe & Beziehung";
export const MAGAZINE_DESCRIPTION = "Impulse für christliche Singles: Feiertage, Gebete, Bibelverse, bekannte Christen, Singlebörsen im Porträt und Gedanken zu Beziehung und Werten.";

function readingMinutes(page: PublicPage) {
  const words = page.contentHtml.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 200));
}

function cleanTitle(page: PublicPage) {
  return page.heroTitle.replace(/^\p{Extended_Pictographic}\s*/u, "");
}

function excerpt(text: string, max = 150) {
  return text.length > max ? `${text.slice(0, max - 1).replace(/\s+\S*$/, "").trim()}…` : text;
}

function categoryLabel(page: PublicPage) {
  const slug = [...page.categories].sort((a, b) => (a === "allgemein" ? 1 : 0) - (b === "allgemein" ? 1 : 0))[0];
  return slug ? CATEGORY_META[slug]?.label ?? "Magazin" : "Magazin";
}

function ArticleCard({ article, label, lead = false }: { article: PublicPage; label: string; lead?: boolean }) {
  const image = selectPageImage(article);
  const title = cleanTitle(article);
  return <article className={lead ? `${styles.card} ${styles.cardLead}` : styles.card} data-mag-card data-path={article.path} data-search={`${title} ${article.description} ${label}`.toLowerCase()}>
    <div className={styles.cardMedia}>
      {image
        ? <Image src={image} alt="" width={lead ? 880 : 520} height={lead ? 560 : 330} sizes={lead ? "(max-width: 760px) 100vw, 640px" : "(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 380px"} />
        : <div className={styles.cardFallback} aria-hidden="true"><CityIcon name="church" /></div>}
      <span className={styles.cardTag}>{label}</span>
    </div>
    <div className={styles.cardBody}>
      <h3><a className={styles.cardLink} href={previewPath(article.market, article.path)}>{title}</a></h3>
      <p>{excerpt(article.description, lead ? 220 : 130)}</p>
      <span className={styles.cardMeta}><span><CityIcon name="clock" />{readingMinutes(article)} Min. Lesezeit</span><span className={styles.cardMore}>Weiterlesen <CityIcon name="arrow" /></span></span>
    </div>
  </article>;
}

export function MagazineHub({ page }: { page: PublicPage }) {
  const register = registrationUrl(page);
  const articles = getChildPages(page).filter(article => article.path !== AUTHOR_PROFILE);
  const byPath = new Map(articles.map(article => [article.path, article]));
  const lead = byPath.get(LEAD_STORY) ?? articles[0];
  const picks = EDITOR_PICKS.map(path => byPath.get(path)).filter((article): article is PublicPage => Boolean(article));
  const known = new Map(getMagazineCategories().map(category => [category.slug, category]));
  const categoryGroups = Object.keys(CATEGORY_META)
    .filter(slug => known.has(slug))
    .map(slug => ({ slug, ...CATEGORY_META[slug], pages: articles.filter(article => article.categories.includes(slug)) }))
    .filter(category => category.pages.length);
  const categorized = new Set(categoryGroups.flatMap(category => category.pages.map(article => article.path)));
  // Einzelne Beiträge ohne WordPress-Kategorie laufen unter „Glaube & Alltag“ mit.
  const rest = articles.filter(article => !categorized.has(article.path));
  const groups = categoryGroups.map(category => category.slug === "allgemein" ? { ...category, pages: [...category.pages, ...rest] } : category);
  const leadImage = lead ? selectPageImage(lead) : null;

  return <main className={styles.page}>
    <section className={styles.hero}>
      <div className={styles.heroGrid}>
        <div className={styles.heroCopy}>
          <p className={styles.heroEyebrow}>✦ Das Magazin von christlich-verliebt</p>
          <h1>Glaube, Liebe <em>&amp;</em> Beziehung</h1>
          <p className={styles.heroLead}>Wissen, Impulse und Geschichten für christliche Singles – von Feiertagen und Gebeten über bekannte Christen bis zu Fragen rund um Partnersuche und Werte.</p>
          <ul className={styles.heroStats}>
            <li><strong>{articles.length}</strong> Artikel</li>
            <li><strong>{groups.length}</strong> Themenwelten</li>
            <li><strong>100 %</strong> kostenlos lesen</li>
          </ul>
          <div className={styles.heroActions}>
            <a className={styles.buttonPrimary} href="#magazin-kategorien">Themen entdecken</a>
            <a className={styles.buttonGhost} href={register}>Kostenlos registrieren</a>
          </div>
        </div>
        {lead ? <article className={styles.leadStory}>
          {leadImage ? <Image className={styles.leadImage} src={leadImage} alt="" width={900} height={1000} sizes="(max-width: 960px) 100vw, 520px" priority /> : null}
          <div className={styles.leadShade} aria-hidden="true" />
          <div className={styles.leadCopy}>
            <span className={styles.leadTag}>Titelthema · {categoryLabel(lead)}</span>
            <h2><a className={styles.cardLink} href={previewPath(lead.market, lead.path)}>{cleanTitle(lead)}</a></h2>
            <p>{excerpt(lead.description, 170)}</p>
            <span className={styles.leadMeta}><CityIcon name="clock" />{readingMinutes(lead)} Min. Lesezeit<span className={styles.leadMore}>Jetzt lesen <CityIcon name="arrow" /></span></span>
          </div>
        </article> : null}
      </div>
    </section>

    {picks.length ? <section className={styles.picks} aria-labelledby="redaktionstipps">
      <div className={styles.picksHead}><CityIcon name="heart" /><h2 id="redaktionstipps">Redaktionstipps</h2></div>
      <ul>
        {picks.map(pick => {
          const image = selectPageImage(pick);
          return <li key={pick.path}>
            {image ? <Image src={image} alt="" width={180} height={180} sizes="96px" /> : null}
            <div><span>{categoryLabel(pick)}</span><a className={styles.cardLink} href={previewPath(pick.market, pick.path)}>{cleanTitle(pick)}</a><small>{readingMinutes(pick)} Min. Lesezeit</small></div>
          </li>;
        })}
      </ul>
    </section> : null}

    <nav className={styles.topics} id="magazin-kategorien" aria-label="Magazinkategorien">
      <div className={styles.topicsHead}>
        <p className={styles.eyebrow}>Themenwelten</p>
        <h2>Worüber möchtest Du lesen?</h2>
      </div>
      <div className={styles.topicList}>
        {groups.map(category => <a href={`#kategorie-${category.slug}`} key={category.slug}>
          <span className={styles.topicIcon}><CityIcon name={category.icon} /></span>
          <span><strong>{category.label}</strong><small>{category.pages.length} Artikel</small></span>
        </a>)}
      </div>
      <MagazineFilter total={articles.length} />
    </nav>

    {groups.map((category, index) => <div key={category.slug}>
      <section className={styles.category} id={`kategorie-${category.slug}`} data-mag-section>
        <header className={styles.categoryHead}>
          <span className={styles.categoryIcon}><CityIcon name={category.icon} /></span>
          <div>
            <p className={styles.eyebrow}>{category.pages.length} Artikel</p>
            <h2>{category.label}</h2>
            <p>{category.intro}</p>
          </div>
          <a className={styles.backLink} href="#magazin-kategorien">Alle Themen <span aria-hidden="true">↑</span></a>
        </header>
        <div className={category.pages.length === 1 ? `${styles.grid} ${styles.gridSingle}` : styles.grid}>
          {category.pages.slice(0, VISIBLE_CARDS).map((article, position) => <ArticleCard key={article.path} article={article} label={category.label} lead={position === 0} />)}
        </div>
        {category.pages.length > VISIBLE_CARDS ? <details className={styles.more} data-mag-more>
          <summary><span className={styles.moreClosed}>Alle {category.pages.length} Artikel zu „{category.label}“ zeigen</span><span className={styles.moreOpen}>Weniger anzeigen</span></summary>
          <div className={styles.grid}>
            {category.pages.slice(VISIBLE_CARDS).map(article => <ArticleCard key={article.path} article={article} label={category.label} />)}
          </div>
        </details> : null}
      </section>
      {index === 1 ? <div className={styles.cta}><CtaBand market={page.market} register={register} heading="Glaube teilen – am liebsten zu zweit" /></div> : null}
    </div>)}

    <section className={styles.author}>
      <Image src={staticAsset("/brand/christian-m-haas.jpg")} alt="Christian M. Haas" width={200} height={200} />
      <div>
        <p className={styles.eyebrow}>Aus der Redaktion</p>
        <h2>Geschrieben mit Herz und Haltung</h2>
        <p><strong>Christian M. Haas</strong> ist Datingexperte für werteorientierte Partnersuche. Im Magazin verbindet er Wissen rund um Glauben und Kirchenjahr mit ehrlichen Gedanken zu Liebe und Beziehung.</p>
        <a href={page.market === "de" ? previewPath("de", AUTHOR_PROFILE) : publicUrl("de", AUTHOR_PROFILE)}>Mehr über Christian M. Haas <CityIcon name="arrow" /></a>
      </div>
    </section>
  </main>;
}
