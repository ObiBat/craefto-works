export const siteConfig = {
  name: "Craefto",
  description:
    "Craefto is a creative tech studio. We design and build brands, products, and tools for founders and teams who value craft.",
  url: "https://www.craefto.com",
  email: "hello@craefto.com",
  links: {
    twitter: "https://x.com/craefto",
    linkedin: "https://www.linkedin.com/company/craefto",
  },
};

export const navigation = {
  main: [
    { name: "Case studies", href: "/work" },
    { name: "Services", href: "/services" },
    { name: "How we work", href: "/process" },
    { name: "Journal", href: "/journal" },
    { name: "About", href: "/about" },
  ],
  secondary: [
    { name: "First time here?", href: "/start" },
    { name: "Careers", href: "/careers" },
  ],
  cta: { name: "Contact", href: "/contact" },
};

export const services = [
  {
    title: "Brand Identity & Design Systems",
    description: "Strategic foundations and visual systems that scale.",
    capabilities: ["Visual identity", "Logo systems", "Design tokens", "Brand guidelines", "Typography systems"],
    href: "/services#brand",
    badge: null,
    icon: "brand",
  },
  {
    title: "Web Design & Development",
    description: "Marketing sites, SaaS platforms, and dashboards built for performance.",
    capabilities: ["Marketing sites", "Landing pages", "SaaS interfaces", "Dashboard design", "Payment integration (Stripe, Apple Pay)", "Responsive development"],
    href: "/services#web",
    badge: "Popular",
    icon: "web",
  },
  {
    title: "Digital Products & Platforms",
    description: "MVPs, interactive experiences, and scalable tools from concept to launch.",
    capabilities: ["MVP development", "Client portals", "Interactive experiences", "Workflow automation", "API integrations", "WebGL & 3D"],
    href: "/services#products",
    badge: null,
    icon: "product",
  },
  {
    title: "AI & Automation",
    description: "Intelligent systems, agents, and automation for modern teams.",
    capabilities: ["AI agents", "LLM integrations", "Intelligent workflows", "Data pipelines", "Custom AI tools", "Process automation"],
    href: "/services#ai",
    badge: "High demand",
    icon: "ai",
  },
  {
    title: "Security & Penetration Testing",
    description: "Enterprise-grade security assessments at accessible pricing. We don't just build it, we secure it.",
    capabilities: ["Web application security", "Penetration testing", "Vulnerability assessments", "Compliance readiness", "Executive reporting", "30-day re-testing"],
    href: "/services#security",
    badge: null,
    icon: "security",
  },
];

export const processSteps = [
  {
    number: "01",
    title: "Understand",
    description:
      "We start with questions, not assumptions. What are you building? Who is it for? What does success look like?",
  },
  {
    number: "02",
    title: "Design the system",
    description:
      "Before pixels, we map the structure. Information architecture, user flows, and technical decisions all aligned.",
  },
  {
    number: "03",
    title: "Build with precision",
    description:
      "Design and development happen together. Every component is intentional, every interaction considered.",
  },
  {
    number: "04",
    title: "Evolve",
    description:
      "Launch is the beginning. We build foundations that grow with you.",
  },
];

export const positioningPoints = [
  {
    number: "01",
    title: "Systems, not templates",
    description:
      "Every project is built from first principles — tailored to your goals, not pulled from a library.",
  },
  {
    number: "02",
    title: "Design + engineering",
    description:
      "One team, one vision. No handoffs, no lost context. Strategy to deployment, unified.",
  },
  {
    number: "03",
    title: "Long-term partners",
    description:
      "We build foundations, not quick fixes. Our work is designed to evolve with you.",
  },
];
