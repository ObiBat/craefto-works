// Free resources from the Instagram campaign, each with its own page at
// /free/<slug>. Two kinds:
//   download: files we made (public/free/<slug>/, full pack in public/downloads/)
//   links:    a curated list of other people's tools, with our notes
// Downloads and outbound clicks are counted through /api/analytics/pageview,
// under /free/<slug>/download/<file> and /free/<slug>/out/<item>, carrying the
// visit's UTM tags, so each post's results show up beside its visits.

interface FreeBase {
  slug: string;
  /** "Free pack 001", "Toolkit 001" */
  issue: string;
  kind: string;
  title: string;
  lead: string;
  /** The day its Instagram post goes out. */
  released: string;
  cover: { src: string; alt: string };
  og: { src: string; alt: string };
}

export interface FreePackItem {
  number: string;
  name: string;
  note: string;
  desktop: string;
  phone: string;
}

export interface DownloadPack extends FreeBase {
  type: "download";
  zip: { href: string; size: string };
  formats: { label: string; size: string }[];
  terms: string[];
  items: FreePackItem[];
}

export interface LinkItem {
  id: string;
  number: string;
  name: string;
  category: string;
  description: string;
  /** Our one-line take. */
  note: string;
  url: string;
  /** What the button says, e.g. "cosmos.so" or "Google Fonts". */
  linkLabel: string;
  image: string;
  imageAlt: string;
  facts?: { label: string; value: string }[];
}

export interface LinkList extends FreeBase {
  type: "links";
  /** e.g. "10 tools · all free" */
  summary: string[];
  noteLabel: string;
  /** Width / height of the item images. */
  imageRatio: string;
  items: LinkItem[];
  footnote: string;
}

export type FreeResource = DownloadPack | LinkList;

const bg = (number: string, name: string, slug: string, note: string): FreePackItem => ({
  number,
  name,
  note,
  desktop: `/free/backgrounds/desktop/${number}-${slug}.jpg`,
  phone: `/free/backgrounds/phone/${number}-${slug}.jpg`,
});

const tool = (number: string, id: string, name: string, category: string, description: string, note: string, url: string): LinkItem => ({
  id,
  number,
  name,
  category,
  description,
  note,
  url,
  linkLabel: url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""),
  image: `/free/toolkit/${id}.jpg`,
  imageAlt: `The ${name} website`,
});

const font = (number: string, id: string, name: string, designer: string, use: string, pair: string): LinkItem => ({
  id,
  number,
  name,
  category: `Designed by ${designer}`,
  description: use,
  note: pair,
  url: `https://fonts.google.com/specimen/${name.replace(/ /g, "+")}`,
  linkLabel: "Google Fonts",
  image: `/free/fonts/${id}.jpg`,
  imageAlt: `${name} set in a sample poster`,
  facts: [
    { label: "Designer", value: designer },
    { label: "Licence", value: "SIL Open Font License" },
  ],
});

export const freeResources: FreeResource[] = [
  {
    type: "download",
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
    cover: { src: "/free/backgrounds/cover.jpg", alt: "Stop using boring backgrounds, Free pack 001" },
    og: { src: "/free/backgrounds/og.jpg", alt: "Craefto Free pack 001: eight backgrounds" },
  },
  {
    type: "links",
    slug: "toolkit",
    issue: "Toolkit 001",
    kind: "The anti-slop toolkit",
    title: "The anti-slop toolkit.",
    lead: "Ten free tools for texture, type, colour and motion, for work that feels made, not generated. Each one comes with a line on what we'd use it for.",
    released: "2026-11-10",
    summary: ["10 tools", "All free to start", "Checked November 2026", "Nothing sponsored"],
    noteLabel: "Use it for",
    imageRatio: "16/10",
    items: [
      tool("01", "cosmos", "Cosmos", "References", "A calmer place to collect references than Pinterest. You can blur or hide images flagged as AI-generated.", "Mood boards with no slop in them.", "https://www.cosmos.so"),
      tool("02", "paper-shaders", "Paper Shaders", "Shaders", "Open-source, zero-dependency shaders: grain, dithering, fluted glass, paper texture. Drop them into React or plain JS.", "Real texture, not a stock overlay.", "https://shaders.paper.design"),
      tool("03", "dither-it", "Dither it!", "Texture", "Turns any image into a dithered, limited-palette graphic, right in the browser.", "Instant print feel on a flat photo.", "https://ditherit.com"),
      tool("04", "fffuel", "fffuel", "Texture", "A shelf of free SVG generators: grain, noise, grunge texture, fluid gradients, blobs.", "Try gggrain and tttexture first.", "https://www.fffuel.co"),
      tool("05", "haikei", "Haikei", "Shapes", "Generates SVG waves, blobs and layered shapes you can tweak and export. Free, no sign-up.", "Backgrounds no one else has.", "https://haikei.app"),
      tool("06", "fontshare", "Fontshare", "Type", "Free typefaces from Indian Type Foundry, including Satoshi and Clash Display.", "Better than defaulting to Inter.", "https://www.fontshare.com"),
      tool("07", "uncut", "Uncut", "Type", "A curated catalogue of free, contemporary typefaces from independent designers.", "Finding a face with character. Check each font's licence.", "https://uncut.wtf"),
      tool("08", "fonts-in-use", "Fonts In Use", "Type", "An independent archive of typography on real posters, books, brands and sites.", "Seeing a font in the wild before you pick it.", "https://fontsinuse.com"),
      tool("09", "realtime-colors", "Realtime Colors", "Colour", "Tests a palette and font pairing on a real page layout before you commit.", "Killing the 'looked fine in the swatch' problem.", "https://www.realtimecolors.com"),
      tool("10", "easing-wizard", "Easing Wizard", "Motion", "Design CSS easing curves visually, from bezier to spring, bounce and overshoot.", "Motion that feels physical, not default.", "https://easingwizard.com"),
    ],
    footnote: "Screenshots taken from each site in November 2026. Pricing and features change, so check before you build on one.",
    cover: { src: "/free/toolkit/cover.jpg", alt: "The anti-slop toolkit, Toolkit 001" },
    og: { src: "/free/toolkit/og.jpg", alt: "Craefto Toolkit 001: the anti-slop toolkit" },
  },
  {
    type: "links",
    slug: "fonts",
    issue: "Type Drop 001",
    kind: "Free fonts",
    title: "Free fonts that don't look free.",
    lead: "Eight typefaces with real personality, each shown at work. All on Google Fonts under the SIL Open Font License, so they're free for commercial work.",
    released: "2026-11-17",
    summary: ["8 typefaces", "Free for commercial use", "Google Fonts"],
    noteLabel: "Pair it with",
    imageRatio: "936/640",
    items: [
      font("01", "instrument-serif", "Instrument Serif", "Rodrigo Fuenzalida", "Editorial headlines, quiet luxury, anything that should feel considered.", "Inter Tight or Geist Mono."),
      font("02", "bricolage-grotesque", "Bricolage Grotesque", "Mathieu Triay", "Posters, food and retail brands, anything that should feel friendly but sharp.", "Itself, at text size. Its optical sizes do the work."),
      font("03", "fraunces", "Fraunces", "Undercase Type", "Bakeries, cafés and packaging. Its Soft and Wonk axes give it warmth.", "DM Sans."),
      font("04", "gloock", "Gloock", "Duarte Pinto", "Luxury, fragrance and fashion. High contrast, made for big sizes.", "Geist Mono, small and spaced."),
      font("05", "unbounded", "Unbounded", "NaN", "Tech events, product launches and sport. Wide and confident.", "Inter Tight at regular weight."),
      font("06", "big-shoulders", "Big Shoulders", "Patric King", "Signage, wayfinding and sport, anything set big and tall. Drawn for the City of Chicago.", "Geist Mono for numbers."),
      font("07", "syne", "Syne", "Bonjour Monde", "Galleries, music and culture. Made for an arts centre, and it shows.", "Instrument Serif in italics."),
      font("08", "climate-crisis", "Climate Crisis", "Daniel Coull & Eino Korkala", "Statements with a point. Its weight follows Arctic sea-ice data, melting from 1979 to 2050.", "Inter Tight, plain and out of its way."),
    ],
    footnote: "Designers and licences checked on Google Fonts in November 2026. The sample posters are ours; the fonts belong to their designers.",
    cover: { src: "/free/fonts/cover.jpg", alt: "Free fonts that don't look free, Type Drop 001" },
    og: { src: "/free/fonts/og.jpg", alt: "Craefto Type Drop 001: free fonts that don't look free" },
  },
];

export function getFreeResource(slug: string) {
  return freeResources.find((resource) => resource.slug === slug);
}
