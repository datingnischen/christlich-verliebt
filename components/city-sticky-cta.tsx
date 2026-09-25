"use client";

import { useEffect, useState } from "react";
import styles from "./city-page.module.css";

/** Mobiler Anmelde-Button, erscheint erst nach etwas Scrollen, damit er den Hero nicht verdeckt. */
export function CityStickyCta({ href, city }: { href: string; city: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <a href={href} className={`${styles.stickyCta}${visible ? ` ${styles.stickyCtaVisible}` : ""}`} aria-hidden={!visible} tabIndex={visible ? 0 : -1}>
    <span aria-hidden="true">♥</span> Christliche Singles in {city} treffen
  </a>;
}
