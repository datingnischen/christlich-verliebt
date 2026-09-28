"use client";

import Image from "next/image";
import { useState } from "react";
import { staticAsset } from "@/lib/static-asset";
import { videoDurationLabel, videoEmbedUrl, type SiteVideo } from "@/lib/videos";
import styles from "./video-embed.module.css";

// Zwei-Klick-Einbettung: erst das lokale Vorschaubild, YouTube (youtube-nocookie.com) lädt erst nach Klick.
export function VideoEmbed({ video, priority = false }: { video: SiteVideo; priority?: boolean }) {
  const [playing, setPlaying] = useState(false);
  return <figure className={styles.embed} id="video">
    <div className={styles.frame}>
      {playing
        ? <iframe
            src={videoEmbedUrl(video)}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        : <button type="button" className={styles.poster} onClick={() => setPlaying(true)} aria-label={`Video abspielen: ${video.title}`}>
            <Image src={staticAsset(video.thumbnail)} alt="" fill sizes="(max-width: 960px) 100vw, 800px" priority={priority} />
            <span className={styles.play} aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></span>
            <span className={styles.duration} aria-hidden="true">{videoDurationLabel(video)}</span>
          </button>}
    </div>
    <figcaption className={styles.caption}>
      <strong>{video.title}</strong>
      <span>Das Video startet erst nach Deinem Klick. Beim Abspielen werden Daten an YouTube (Google) übertragen.</span>
    </figcaption>
  </figure>;
}
