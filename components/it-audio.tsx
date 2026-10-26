import { itAudioDuration, type ItAudio } from "@/lib/it-audio";
import { staticAsset } from "@/lib/static-asset";
import styles from "./it-audio.module.css";

/** Kurzfassung zum Anhören, mit Trascrizione zum Nachlesen (barrierefrei) und Hinweis auf die synthetische Stimme. */
export function ItAudioSummary({ audio, heading, compact = false }: { audio: ItAudio | null; heading: string; compact?: boolean }) {
  if (!audio) return null;
  return <section className={`${styles.audio} ${compact ? styles.compact : ""}`} aria-label={heading}>
    <div className={styles.head}>
      <span className={styles.icon} aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M4 13a8 8 0 0 1 16 0v4a2 2 0 0 1-2 2h-1v-6h3M4 13v4a2 2 0 0 0 2 2h1v-6H4" /></svg>
      </span>
      <div>
        <p className={styles.kicker}>Ascolta in breve · {itAudioDuration(audio.seconds)} min</p>
        <h2>{heading}</h2>
      </div>
    </div>
    <audio className={styles.player} controls preload="metadata" src={staticAsset(audio.src)}>
      Il tuo browser non supporta l&apos;elemento audio.
    </audio>
    <p className={styles.note}>Testo redatto e verificato dalla redazione, letto da una voce sintetica.</p>
    <details className={styles.transcript}>
      <summary>Leggi la trascrizione</summary>
      <p>{audio.text}</p>
    </details>
  </section>;
}
