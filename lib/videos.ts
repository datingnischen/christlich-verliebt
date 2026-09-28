import { staticAsset } from "./static-asset.ts";

// Eigene YouTube-Videos (Kanal „Datingnischen – Christian M. Haas“), die im Magazin und auf der
// Autorenseite eingebettet werden. Das Bauteil components/video-embed.tsx lädt YouTube erst nach Klick.
export type VideoChapter = { time: string; title: string };

export type SiteVideo = {
  id: string;
  title: string;
  description: string;
  durationSeconds: number;
  uploadDate: string;
  thumbnail: string;
  articlePath: string;
  chapters: VideoChapter[];
};

export const YOUTUBE_CHANNEL = "https://www.youtube.com/@datingnischen";
export const AUTHOR_PERSON_ID = "https://christlich-verliebt.de/magazin/christian-m-haas/#person";

export const VIDEOS: Record<string, SiteVideo> = {
  pRVuae0ts00: {
    id: "pRVuae0ts00",
    title: "Dating unter Christen: Warum gemeinsame Werte allein nicht reichen",
    description: "Gemeinsamer Glaube kann beim Dating verbinden. Er beantwortet aber nicht automatisch, ob zwei Menschen dieselben Erwartungen an Beziehung, Ehe, Gemeinde und Alltag haben. Datingexperte Christian M. Haas erklärt, welche Fragen christliche Singles früh klären sollten und wie eine spezialisierte Partnersuche dabei helfen kann.",
    durationSeconds: 472,
    uploadDate: "2026-09-03",
    thumbnail: "/brand/video-dating-unter-christen.jpg",
    articlePath: "/magazin/dating-unter-christen-gemeinsame-werte/",
    chapters: [
      { time: "00:00", title: "Gemeinsamer Glaube und die Dating-Praxis" },
      { time: "00:32", title: "Christians Erfahrung mit Nischen-Dating" },
      { time: "01:09", title: "Was „christlich“ im Profil wirklich sagt" },
      { time: "01:45", title: "Die bessere Frage zum gelebten Glauben" },
      { time: "02:24", title: "Erwartungen an Beziehung und Ehe" },
      { time: "03:31", title: "Unterschiedliche Konfessionen" },
      { time: "04:02", title: "Vertrauen und Vorsicht beim Online-Dating" },
      { time: "04:47", title: "Was eine christliche Partnersuche besser machen kann" },
      { time: "05:31", title: "Ein aussagekräftiges christliches Datingprofil" },
      { time: "06:13", title: "Drei Gedanken für die ersten Gespräche" },
      { time: "06:35", title: "Gemeinsame Werte sind ein Anfang" },
      { time: "07:07", title: "christlich-verliebt.de und weitere Informationen" },
      { time: "07:32", title: "Ausblick: Warum Chats plötzlich einschlafen" },
    ],
  },
};

export function getVideo(id?: string | null): SiteVideo | null {
  return id ? VIDEOS[id] ?? null : null;
}

export function videoWatchUrl(video: SiteVideo): string {
  return `https://www.youtube.com/watch?v=${video.id}`;
}

export function videoEmbedUrl(video: SiteVideo): string {
  return `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&hl=de`;
}

export function videoDurationLabel(video: SiteVideo): string {
  return `${Math.round(video.durationSeconds / 60)} Min.`;
}

export function videoDurationIso(video: SiteVideo): string {
  const minutes = Math.floor(video.durationSeconds / 60);
  const seconds = video.durationSeconds % 60;
  return `PT${minutes}M${seconds}S`;
}

function chapterSeconds(time: string): number {
  const [minutes, seconds] = time.split(":").map(Number);
  return minutes * 60 + seconds;
}

// VideoObject mit Kapiteln (Clip) für Googles „Wichtige Momente“; Autor ist die Person der Autorenseite.
export function videoJsonLd(video: SiteVideo, id: string) {
  const watch = videoWatchUrl(video);
  return {
    "@type": "VideoObject",
    "@id": id,
    name: video.title,
    description: video.description,
    thumbnailUrl: [staticAsset(video.thumbnail), `https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`],
    uploadDate: video.uploadDate,
    duration: videoDurationIso(video),
    url: watch,
    embedUrl: `https://www.youtube-nocookie.com/embed/${video.id}`,
    inLanguage: "de-DE",
    author: { "@id": AUTHOR_PERSON_ID },
    hasPart: video.chapters.map((chapter, index) => {
      const next = video.chapters[index + 1];
      return {
        "@type": "Clip",
        name: chapter.title,
        startOffset: chapterSeconds(chapter.time),
        endOffset: next ? chapterSeconds(next.time) : video.durationSeconds,
        url: `${watch}&t=${chapterSeconds(chapter.time)}s`,
      };
    }),
  };
}
