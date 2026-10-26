import data from "../data/it-audio.json" with { type: "json" };

/**
 * Audio-Kurzfassungen für single-cristiani.ch (ElevenLabs eleven_v4, Stimme Tiziana, Christians Wahl 2026-10-26).
 * Schlüssel: „incontri/<città>“ bzw. „magazine/<articolo>“; MP3 unter public/audio/it/, Sprechtext als Trascrizione.
 */
export type ItAudio = { src: string; seconds: number; text: string };

const AUDIO: Record<string, ItAudio> = data;

export function getItAudio(key: string): ItAudio | null {
  return AUDIO[key] ?? null;
}

/** „0:54“ – Dauer für die Beschriftung. */
export function itAudioDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
