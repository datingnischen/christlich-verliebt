"use client";

import { useState } from "react";
import styles from "./magazine-hub.module.css";

// Blendet die serverseitig gerenderten Artikelkarten nur per hidden-Attribut aus: Alle Links bleiben im HTML.
function applyFilter(needle: string): number {
  const found = new Set<string>();
  document.querySelectorAll<HTMLElement>("[data-mag-card]").forEach(card => {
    const hit = !needle || (card.dataset.search ?? "").includes(needle);
    card.hidden = !hit;
    if (hit) found.add(card.dataset.path ?? "");
  });
  document.querySelectorAll<HTMLDetailsElement>("[data-mag-more]").forEach(more => {
    if (needle) more.open = true;
    more.hidden = Boolean(needle) && !more.querySelector("[data-mag-card]:not([hidden])");
  });
  document.querySelectorAll<HTMLElement>("[data-mag-section]").forEach(section => {
    section.hidden = Boolean(needle) && !section.querySelector("[data-mag-card]:not([hidden])");
  });
  return found.size;
}

export function MagazineFilter({ total }: { total: number }) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState(total);
  const shown = query.trim();

  return <div className={styles.filter} role="search">
    <label htmlFor="magazin-filter">Magazin durchsuchen</label>
    <div className={styles.filterField}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg>
      <input id="magazin-filter" type="search" value={query} onChange={event => {
        setQuery(event.target.value);
        setHits(applyFilter(event.target.value.trim().toLowerCase()));
      }} placeholder="z. B. Ostern, Gebet, Singlebörse" autoComplete="off" maxLength={60} />
    </div>
    <p className={styles.filterStatus} aria-live="polite">{shown
      ? hits ? `${hits} ${hits === 1 ? "Artikel passt" : "Artikel passen"} zu „${shown}“` : `Kein Artikel zu „${shown}“ – versuch es mit einem anderen Begriff.`
      : `${total} Artikel in allen Themen`}</p>
  </div>;
}
