import { IT_HOST, itPublicUrl } from "@/lib/it-pilot";
import styles from "./city-page.module.css";

/**
 * Rechtstexte von single-cristiani.ch. Betreiber und Kontakt wie bei den eigenen Vergleichsseiten
 * (vergleichsseiten/apps/singleboersen-ueberblick/content/ch/seiten). Die Plattform christlich-verliebt.ch
 * mit Registrierung und Profilen betreibt ICONY, deren Rechtstexte bleiben dort.
 */
export const IT_LEGAL = {
  "note-legali": {
    metaTitle: "Note legali | single-cristiani.ch",
    title: "Note legali",
    description: "Note legali di single-cristiani.ch: responsabile dei contenuti, contatti e indicazioni sulla responsabilità per contenuti e link esterni.",
  },
  privacy: {
    metaTitle: "Protezione dei dati | single-cristiani.ch",
    title: "Protezione dei dati",
    description: "Quali dati tratta single-cristiani.ch: hosting, statistiche senza cookie con Vercel Web Analytics, finestra dei profili e i tuoi diritti.",
  },
} as const;

export type ItLegalSlug = keyof typeof IT_LEGAL;

const OPERATOR = <p>
  Christian Mogge Internetdienstleistungen<br />
  c/o Grosch Postflex #1280<br />
  Emsdettener Str. 10<br />
  48268 Greven, Germania<br />
  E-mail: kontakt[a]m-perfect.de
</p>;

function NoteLegali() {
  return <>
    <h2>Responsabile dei contenuti</h2>
    {OPERATOR}
    <h2>Piattaforma christlich-verliebt.ch</h2>
    <p>{IT_HOST} è una guida informativa in italiano. Registrazione, profili, messaggi e abbonamenti si trovano sulla piattaforma christlich-verliebt.ch, gestita da ICONY. Per la piattaforma valgono le <a href="https://christlich-verliebt.ch/impressum.html" hrefLang="de-CH">note legali di christlich-verliebt.ch</a>.</p>
    <h2>Responsabilità per i contenuti</h2>
    <p>Curiamo i contenuti di queste pagine con attenzione. Per correttezza, completezza e attualità delle informazioni non possiamo tuttavia assumere alcuna garanzia. Se ci segnali un contenuto non corretto o illecito, lo verifichiamo e lo correggiamo o rimuoviamo senza ritardo.</p>
    <h2>Responsabilità per i link</h2>
    <p>Le nostre pagine contengono link a siti di terzi, sui cui contenuti non abbiamo alcuna influenza. Per i contenuti delle pagine collegate è sempre responsabile il rispettivo gestore. Se veniamo a conoscenza di violazioni, rimuoviamo il link interessato.</p>
    <h2>Diritto d&apos;autore</h2>
    <p>I testi e le immagini di questo sito sono protetti dal diritto d&apos;autore. Riproduzione, modifica e diffusione al di fuori dei limiti di legge richiedono il nostro consenso scritto.</p>
  </>;
}

function Privacy() {
  return <>
    <p>Questa pagina spiega quali dati vengono trattati quando visiti {IT_HOST}. Il sito è una guida informativa: non offre registrazione, commenti, moduli di contatto o newsletter e non imposta cookie propri.</p>
    <h2>Titolare del trattamento</h2>
    {OPERATOR}
    <p>Ulteriori indicazioni si trovano nelle <a href={itPublicUrl("note-legali")}>note legali</a>.</p>
    <h2>Hosting e dati di log</h2>
    <p>Il sito è ospitato da Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA. A ogni visita il tuo browser trasmette dati tecnici: indirizzo IP, data e ora, pagina richiesta, quantità di dati e codice di stato, browser e sistema operativo e, se trasmessa, la pagina di provenienza. Questi dati servono a consegnare le pagine e a garantire la sicurezza del servizio; Vercel li conserva solo per breve tempo. Vercel è certificata secondo l&apos;EU-US Data Privacy Framework; dettagli nella <a href="https://vercel.com/legal/privacy-policy">informativa sulla privacy di Vercel</a>.</p>
    <p>Base giuridica è il nostro interesse legittimo a un sito sicuro e affidabile (art. 6 par. 1 lett. f GDPR).</p>
    <h2>Statistiche con Vercel Web Analytics</h2>
    <p>Per capire quali pagine vengono lette usiamo Vercel Web Analytics di Vercel Inc., USA. Lo script trasmette a Vercel dati sulla visita, ad esempio momento, indirizzo della pagina, pagina di provenienza, indicazioni geografiche approssimative, browser, sistema operativo e tipo di dispositivo. Vercel Web Analytics non usa cookie: per distinguere le visite utilizza un valore hash ricavato dalla richiesta, che viene scartato dopo 24 ore. Questo termine riguarda l&apos;identificativo della visita, non la conservazione delle statistiche aggregate, che usiamo anche nel nostro controllo interno, per esempio visualizzazioni per pagina e mese.</p>
    <p>Base giuridica è il nostro interesse legittimo a comprendere la portata dei nostri contenuti (art. 6 par. 1 lett. f GDPR); puoi opporti in qualsiasi momento all&apos;indirizzo indicato sopra (art. 21 GDPR). I dati possono essere trasferiti negli USA. Maggiori informazioni nella <a href="https://vercel.com/docs/analytics/privacy-policy">documentazione di Vercel Web Analytics</a>.</p>
    <h2>Finestra dei profili di christlich-verliebt.ch</h2>
    <p>Sulle pagine delle città mostriamo una finestra con profili attivi della piattaforma christlich-verliebt.ch. La finestra viene caricata dai server di ICONY (js.icony.com) quando apri la pagina. In questo modo ICONY riceve i dati tecnici della richiesta, in particolare il tuo indirizzo IP, e può trattarli secondo la propria informativa. Per il trattamento da parte di ICONY vale l&apos;<a href="https://christlich-verliebt.ch/datenschutz.html" hrefLang="de-CH">informativa sulla privacy di christlich-verliebt.ch</a>.</p>
    <p>Base giuridica è il nostro interesse legittimo a mostrare in modo concreto la piattaforma presentata (art. 6 par. 1 lett. f GDPR).</p>
    <h2>Link alla piattaforma</h2>
    <p>I pulsanti di registrazione e di accesso portano a christlich-verliebt.ch. Quando apri la piattaforma vale la sua informativa sulla privacy; sul trattamento dei dati in quella sede non abbiamo influenza.</p>
    <h2>Caratteri e immagini</h2>
    <p>Caratteri, immagini e script vengono forniti dal nostro hosting presso Vercel. Ad eccezione della finestra dei profili descritta sopra, non carichiamo contenuti di altri fornitori.</p>
    <h2>Contatto via e-mail</h2>
    <p>Se ci scrivi, trattiamo il tuo indirizzo e-mail e il contenuto del messaggio per rispondere alla tua richiesta (art. 6 par. 1 lett. f GDPR). Cancelliamo i messaggi quando la richiesta è conclusa e non sussistono obblighi di conservazione.</p>
    <h2>Utenti in Svizzera</h2>
    <p>Per le persone in Svizzera si applica inoltre la Legge federale sulla protezione dei dati (LPD). Puoi esercitare i tuoi diritti di accesso, rettifica e cancellazione all&apos;indirizzo indicato sopra. L&apos;autorità di vigilanza svizzera è l&apos;Incaricato federale della protezione dei dati e della trasparenza (IFPDT).</p>
    <h2>I tuoi diritti</h2>
    <ul>
      <li>accesso ai dati trattati (art. 15 GDPR)</li>
      <li>rettifica di dati inesatti (art. 16 GDPR)</li>
      <li>cancellazione (art. 17 GDPR)</li>
      <li>limitazione del trattamento (art. 18 GDPR)</li>
      <li>portabilità dei dati (art. 20 GDPR)</li>
      <li>opposizione a trattamenti basati sull&apos;interesse legittimo (art. 21 GDPR)</li>
    </ul>
    <p>Basta un&apos;e-mail all&apos;indirizzo indicato sopra. Hai inoltre il diritto di presentare reclamo a un&apos;autorità di controllo, ad esempio quella del tuo luogo di residenza o quella competente per noi, la Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen.</p>
    <h2>Sicurezza e modifiche</h2>
    <p>La trasmissione tra il tuo browser e il nostro sito è cifrata con TLS. Aggiorniamo questa informativa quando cambiano la tecnica del sito o la situazione giuridica; vale la versione pubblicata qui.</p>
  </>;
}

export function ItLegalPage({ slug }: { slug: ItLegalSlug }) {
  return <main className={styles.page}>
    <section className={styles.related}>
      <article className={styles.card}>
        <h1>{IT_LEGAL[slug].title}</h1>
        <div className={styles.prose}>{slug === "privacy" ? <Privacy /> : <NoteLegali />}</div>
      </article>
    </section>
  </main>;
}
