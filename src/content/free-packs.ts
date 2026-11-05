// Free packs: the downloads we give away on Instagram, each with its own page
// at /free/<slug>. The files live in public/free/<slug>/ and the full pack in
// public/downloads/. Downloads are counted through /api/analytics/pageview
// with a path of /free/<slug>/download/<file>, so they show up beside visits.

export interface FreePackItem {
  /** "01" … */
  number: string;
  name: string;
  /** A short line on the mood, shown under the name. */
  note: string;
  desktop: string;
  phone: string;
}

export interface FreePack {
  slug: string;
  /** "Free pack 001" */
  issue: string;
  kind: string;
  title: string;
  lead: string;
  released: string;
  zip: { href: string; size: string };
  formats: { label: string; size: string }[];
  terms: string[];
  /** The Instagram post the pack came from, once it's live. */
  instagram?: string;
  items: FreePackItem[];
  og: { src: string; alt: string };
}

const bg = (number: string, name: string, slug: string, note: string): FreePackItem => ({
  number,
  name,
  note,
  desktop: `/free/backgrounds/desktop/${number}-${slug}.jpg`,
  phone: `/free/backgrounds/phone/${number}-${slug}.jpg`,
});

export const freePacks: FreePack[] = [
  {
    slug: "backgrounds",
    issue: "Free pack 001",
    kind: "Backgrounds",
    title: "Stop using boring backgrounds.",
    lead: "Eight backgrounds from our studio, made for decks, websites, wallpapers and posts. Download one, or take the whole set.",
    released: "2026-11-24",
    zip: { href: "/downloads/craefto-backgrounds-001.zip", size: "12.8 MB" },
    formats: [
      { label: "Desktop", size: "3840 × 2160" },
      { label: "Phone", size: "1290 × 2796" },
    ],
    terms: [
      "Use them in your own work and in client work, for free.",
      "Crop, recolour and build on them as much as you like.",
      "Please don't resell or redistribute them as a pack.",
      "A credit or a tag to @craefto is appreciated, never required.",
    ],
    items: [
      bg("01", "Ember", "ember", "Deep red, like coals under ash"),
      bg("02", "Lagoon", "lagoon", "Shallow water and a ribbon of sun"),
      bg("03", "Bloom", "bloom", "Pink haze with a cobalt edge"),
      bg("04", "Moss", "moss", "Soft greens, quiet and low"),
      bg("05", "Pixel Dusk", "pixel-dusk", "A dithered sun, set in pixels"),
      bg("06", "Static", "static", "Green signal rising out of the dark"),
      bg("07", "Ultraviolet", "ultraviolet", "Lilac and lime, loud on purpose"),
      bg("08", "Afterglow", "afterglow", "Red, peach and blush, mid-melt"),
    ],
    og: { src: "/free/backgrounds/og.jpg", alt: "Craefto Free pack 001: eight backgrounds" },
  },
];

export function getFreePack(slug: string) {
  return freePacks.find((pack) => pack.slug === slug);
}
