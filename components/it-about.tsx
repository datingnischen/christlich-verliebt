import Image from "next/image";
import { Crumbs } from "@/components/it-hubs";
import { IT_ABOUT, IT_AUTHOR, IT_CITIES, IT_PLATFORM, itCityUrl, itMagazineUrl, itPublicUrl } from "@/lib/it-pilot";
import { staticAsset } from "@/lib/static-asset";
import styles from "./city-page.module.css";
import hub from "./it-hubs.module.css";
import itStyles from "./it-pages.module.css";

/**
 * Chi siamo (/chi-siamo/): Redaktion, Arbeitsweise, Autor und Kontakt der italienischen Variante (E-E-A-T).
 * Kein Betreibername auf dieser Seite (Christians Vorgabe 2026-10-20), der steht nur in den Note legali. Texte hier, Meta in lib/it-pilot.ts.
 */
const AUTHOR_LINKS = [
  { label: "Profilo su christlich-verliebt.de (in tedesco)", href: IT_AUTHOR.sameAs[0], hrefLang: "de-DE" },
  { label: "LinkedIn", href: IT_AUTHOR.sameAs[1], hrefLang: undefined },
  { label: "Pagina autore su Amazon", href: IT_AUTHOR.sameAs[2], hrefLang: undefined },
  { label: "Biografia su datingnischen.de (in tedesco)", href: IT_AUTHOR.sameAs[3], hrefLang: "de-DE" },
];

const FAQ = [
  { question: "single-cristiani.ch è gratuito?", answer: "Sì. Le guide e il magazine sono gratuiti e non richiedono alcuna registrazione. Anche iscriversi a christlich-verliebt.ch è gratuito; le funzioni a pagamento sono indicate sulla piattaforma prima di qualsiasi acquisto." },
  { question: "Chi tratta i miei dati se mi iscrivo?", answer: "L'iscrizione avviene su christlich-verliebt.ch: i dati del profilo li tratta ICONY GmbH secondo la propria informativa. Su single-cristiani.ch non esiste alcuna registrazione; quali dati tratta questo sito è spiegato nella pagina Protezione dei dati." },
  { question: "Le chiese e i gruppi indicati hanno pagato per comparire?", answer: "No. Scegliamo luoghi, comunità e appuntamenti in base alla loro utilità per chi vuole conoscere persone con la stessa fede. Nessuna voce è sponsorizzata e non pubblichiamo recensioni a pagamento." },
  { question: "Posso segnalare un gruppo, una chiesa o un evento?", answer: "Volentieri. Scrivici all'indirizzo indicato sopra con nome, luogo, sito e una breve descrizione: verifichiamo la segnalazione e, se è adatta, la inseriamo nella guida della città." },
];

export function ItAboutPage() {
  return <main className={`${styles.page} ${hub.magazine}`}>
    <article className={hub.article}>
      <header className={hub.head}>
        <Crumbs items={[{ label: "Svizzera italiana", href: itPublicUrl() }, { label: IT_ABOUT.title, href: null }]} />
        <p className={styles.eyebrow}>Chi siamo</p>
        <h1>Chi c&apos;è dietro single-cristiani.ch</h1>
        <p className={hub.lead}>{IT_ABOUT.lead}</p>
      </header>

      <div className={`${styles.prose} ${hub.body}`}>
        <section>
          <h2>Una guida, non una piattaforma di incontri</h2>
          <p>single-cristiani.ch non gestisce profili, messaggi o abbonamenti. Pubblichiamo <a href={itCityUrl()}>guide per le città del Ticino</a> ({IT_CITIES.map((city) => city.name).join(", ")}) con chiese e indirizzi, comunità, appuntamenti dell&apos;anno e idee per un primo incontro, e un <a href={itMagazineUrl()}>magazine</a> con consigli pratici per single cristiani.</p>
          <p>La piattaforma di incontri è <a href={IT_PLATFORM.registrationUrl} hrefLang="de-CH">christlich-verliebt.ch</a>, gestita dalla ICONY GmbH per tutta la Svizzera: i pulsanti «Iscriviti» di queste pagine portano lì. single-cristiani.ch è un progetto editoriale indipendente dalla piattaforma; i dati del responsabile si trovano nelle <a href={itPublicUrl("note-legali")}>note legali</a>.</p>
        </section>

        <section>
          <h2>Come lavoriamo</h2>
          <ul>
            <li><strong>Fonti ufficiali.</strong> I dati su popolazione, religione ed economie domestiche provengono dall&apos;Ufficio di statistica del Cantone Ticino (USTAT); le informazioni su parrocchie, comunità e appuntamenti dai siti della Diocesi di Lugano, delle parrocchie e delle Chiese evangeliche riformate. Ogni pagina elenca le proprie fonti in fondo.</li>
            <li><strong>Indirizzi e link verificati.</strong> Controlliamo che i siti indicati esistano e rimandiamo sempre agli orari ufficiali di messe e culti, perché cambiano durante l&apos;anno.</li>
            <li><strong>Immagini dichiarate.</strong> Le illustrazioni in alto nelle pagine sono generate con intelligenza artificiale e indicate come tali: non mostrano persone reali né membri della piattaforma.</li>
            <li><strong>Strumenti.</strong> Nella redazione ci avvaliamo anche di strumenti di intelligenza artificiale. Dati, indirizzi e link vengono però controllati sulle fonti indicate e ogni testo viene rivisto prima della pubblicazione.</li>
            <li><strong>Nessun contenuto a pagamento.</strong> Non pubblichiamo articoli sponsorizzati né recensioni di parrocchie, gruppi o locali.</li>
          </ul>
        </section>

        <section className={itStyles.aboutAuthor} aria-labelledby="chi-cura">
          <Image src={staticAsset(IT_AUTHOR.image)} alt={`Ritratto di ${IT_AUTHOR.name}`} width={160} height={192} />
          <div>
            <h2 id="chi-cura">{IT_AUTHOR.name}</h2>
            <p className={itStyles.aboutRole}>{IT_AUTHOR.jobTitle}</p>
            <p>Christian M. Haas si occupa di online dating dal 2008. Tra il 2008 e il 2016 ha sviluppato e gestito piattaforme di incontri per gruppi specifici; dal 2016 collabora con la ICONY GmbH ed è l&apos;esperto di dating di christlich-verliebt, di cui accompagna il magazine con guide pratiche per single credenti in Germania, Austria e Svizzera.</p>
            <p>Nel 2026 ha pubblicato il libro «Dating ohne Bullshit» (in tedesco), uno sguardo dietro le quinte del business degli incontri online. Il suo obiettivo: far incontrare persone con fede e valori comuni, con rispetto, sicurezza e autenticità.</p>
            <ul className={itStyles.aboutLinks}>
              {AUTHOR_LINKS.map((link) => <li key={link.href}><a href={link.href} hrefLang={link.hrefLang} rel="noopener">{link.label}</a></li>)}
            </ul>
          </div>
        </section>

        <section>
          <h2>Perché la registrazione è ancora in tedesco</h2>
          <p>ICONY sta preparando la versione italiana della piattaforma. Finché non è disponibile, registrazione, profili e messaggi si trovano su <a href={IT_PLATFORM.registrationUrl} hrefLang="de-CH">christlich-verliebt.ch</a> in tedesco. I profili svizzeri, anche del Ticino, sono però già lì e la ricerca per codice postale funziona per tutto il Cantone. Appena la versione italiana sarà online, aggiorneremo i collegamenti su tutte le pagine.</p>
        </section>

        <section>
          <h2>Contatti e segnalazioni</h2>
          <p>Hai trovato un dato non aggiornato, un orario cambiato o un link che non funziona? Vuoi segnalare una comunità, un gruppo o un appuntamento per single cristiani in Ticino? Scrivici, in italiano, tedesco o inglese: <strong>kontakt[a]m-perfect.de</strong>. Verifichiamo ogni segnalazione e correggiamo senza ritardo.</p>
          <p>Per domande sul tuo account, sugli abbonamenti o sui dati del profilo rivolgiti direttamente a christlich-verliebt.ch: single-cristiani.ch non ha accesso ai dati dei membri.</p>
        </section>

        <section className={itStyles.aboutFaq} aria-labelledby="domande-sito">
          <h2 id="domande-sito">Domande frequenti sul sito</h2>
          {FAQ.map((entry) => <details key={entry.question}><summary>{entry.question}</summary><p>{entry.answer}</p></details>)}
        </section>
      </div>
    </article>
  </main>;
}
