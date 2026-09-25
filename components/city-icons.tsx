import type { SectionIcon } from "@/lib/city-page";

export type CityIconName = SectionIcon | "route" | "clock" | "check" | "shield" | "arrow";

const PATHS: Record<CityIconName, React.ReactNode> = {
  church: <><path d="M12 2v5M9.5 4.5h5" /><path d="M5 21V12l7-5 7 5v9" /><path d="M10 21v-4a2 2 0 0 1 4 0v4" /><path d="M3 21h18" /></>,
  cup: <><path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" /><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H16" /><path d="M8 3c-.8 1 .8 2 0 3M12 3c-.8 1 .8 2 0 3" /></>,
  people: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.6" /><path d="M16 14.2c2.8.3 5 2.6 5 5.8" /></>,
  tree: <><path d="M12 22v-6" /><path d="M12 3 6 11h3l-4 5h14l-4-5h3z" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /><path d="M12 13.2c-1-1.2-3-.6-3 .9 0 1.4 1.8 2.4 3 3.4 1.2-1 3-2 3-3.4 0-1.5-2-2.1-3-.9z" /></>,
  phone: <><rect x="6.5" y="2.5" width="11" height="19" rx="2.5" /><path d="M11 18.5h2" /><path d="M12 12.5c-1-1.1-2.8-.5-2.8.9 0 1.2 1.6 2.1 2.8 3 1.2-.9 2.8-1.8 2.8-3 0-1.4-1.8-2-2.8-.9z" /></>,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  pin: <><path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z" /><circle cx="12" cy="9.8" r="2.4" /></>,
  spark: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m6.3 6.3 2.2 2.2M15.5 15.5l2.2 2.2M6.3 17.7l2.2-2.2M15.5 8.5l2.2-2.2" /></>,
  music: <><path d="M9 18V6l11-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" /><path d="M12 7v6M9.5 9.2h5" /></>,
  route: <><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  check: <><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.2 2.4 2.4 4.8-4.8" /></>,
  shield: <><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" /><path d="m9 12 2 2 4-4" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
};

export function CityIcon({ name, className }: { name: CityIconName; className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{PATHS[name]}</svg>;
}
