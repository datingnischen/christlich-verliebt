"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./faq.module.css";

function normalize(value: string) {
  return value.toLocaleLowerCase("de").normalize("NFKD").replace(/\p{Diacritic}/gu, "");
}

export function FaqSearch({ targetId, count }: { targetId: string; count: number }) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState(count);
  const [allOpen, setAllOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function search(value: string) {
    setQuery(value);
    const root = document.getElementById(targetId);
    if (!root) return;
    const needle = normalize(value.trim());
    let visible = 0;
    root.querySelectorAll<HTMLElement>("[data-faq-group]").forEach(group => {
      let groupVisible = 0;
      group.querySelectorAll<HTMLDetailsElement>("[data-faq-item]").forEach(item => {
        const hit = !needle || normalize(item.textContent ?? "").includes(needle);
        item.hidden = !hit;
        if (needle && hit) item.open = true;
        if (hit) groupVisible++;
      });
      group.hidden = groupVisible === 0;
      visible += groupVisible;
    });
    setMatches(visible);
  }

  useEffect(() => {
    const openFromHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const item = id ? document.getElementById(id) : null;
      if (item instanceof HTMLDetailsElement) item.open = true;
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  function toggleAll() {
    const next = !allOpen;
    document.getElementById(targetId)?.querySelectorAll<HTMLDetailsElement>("[data-faq-item]").forEach(item => { item.open = next; });
    setAllOpen(next);
  }

  return <div className={styles.search} role="search">
    <label className={styles.searchField}>
      <span className={styles.srOnly}>FAQ durchsuchen</span>
      <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2.2" /><path d="m20 20-3.6-3.6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
      <input ref={input} type="search" value={query} onChange={event => search(event.target.value)} placeholder="Frage suchen, z. B. Kosten, Kündigung, Fake-Profile …" autoComplete="off" />
      {query ? <button type="button" className={styles.clear} onClick={() => { search(""); input.current?.focus(); }} aria-label="Suche zurücksetzen">×</button> : null}
    </label>
    <button type="button" className={styles.toggleAll} onClick={toggleAll} aria-controls={targetId}>{allOpen ? "Alle schließen" : "Alle öffnen"}</button>
    <p className={styles.searchStatus} aria-live="polite">{query ? (matches ? `${matches} passende ${matches === 1 ? "Antwort" : "Antworten"}` : "Keine passende Frage gefunden – schau in die Hilfe oder schreib uns.") : `${count} Antworten durchsuchbar`}</p>
  </div>;
}
