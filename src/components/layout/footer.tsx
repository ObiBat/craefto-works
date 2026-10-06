"use client";

import Link from "next/link";
import { Container } from "./container";
import { Logo } from "@/components/ui/logo";
import { navigation, siteConfig } from "@/lib/constants";
import { capabilities, capabilityHref } from "@/content/capabilities";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="relative z-10 bg-[hsl(var(--color-foreground))] text-[hsl(var(--color-background))] pb-[env(safe-area-inset-bottom)]"
      role="contentinfo"
      aria-label="Site footer"
    >
      {/* Main Footer Content */}
      <Container>
        <div className="py-16 md:py-20">
          {/* Top: Logo and Description */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12 mb-12 pb-12 border-b border-white/10">
            <div className="max-w-sm">
              <Link
                href="/"
                className="inline-block mb-4"
                aria-label="Craefto Works, home"
              >
                <Logo size="md" inverted />
              </Link>
              <p className="font-mono text-xs uppercase tracking-[0.06em] text-white/45">
                Creative &amp; Technology Studio
              </p>
              <p className="mt-3 text-sm text-white/60 leading-relaxed">
                Based in Sydney, working globally.
              </p>
            </div>

            {/* Navigation Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 md:gap-12">
              {/* Navigate */}
              <nav aria-label="Footer navigation">
                <p className="text-xs font-medium uppercase font-mono tracking-[0.06em] mb-4" style={{ color: '#ffffff' }}>
                  Navigate
                </p>
                <ul className="space-y-2.5">
                  {navigation.main.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm text-white/70 hover:text-white transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                  {navigation.secondary.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm text-white/70 hover:text-white transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href={navigation.cta.href}
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      {navigation.cta.name}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/changelog"
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      Changelog
                    </Link>
                  </li>
                </ul>
              </nav>

              {/* Journal */}
              <nav aria-label="Journal">
                <p className="text-xs font-medium uppercase font-mono tracking-[0.06em] mb-4" style={{ color: '#ffffff' }}>
                  Journal
                </p>
                <ul className="space-y-2.5">
                  <li>
                    <Link
                      href="/journal"
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      All Articles
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/journal/pillar/engineering"
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      Engineering
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/journal/pillar/design"
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      Design
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/journal/pillar/product"
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      Product
                    </Link>
                  </li>
                </ul>
              </nav>

              {/* Services */}
              <nav aria-label="Services">
                <p className="text-xs font-medium uppercase font-mono tracking-[0.06em] mb-4" style={{ color: '#ffffff' }}>
                  Services
                </p>
                <ul className="space-y-2.5">
                  {capabilities.map((capability) => (
                    <li key={capability.id}>
                      <Link
                        href={capabilityHref(capability.id)}
                        className="text-sm text-white/70 hover:text-white transition-colors"
                      >
                        {capability.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Connect */}
              <div>
                <p className="text-xs font-medium uppercase font-mono tracking-[0.06em] mb-4" style={{ color: '#ffffff' }}>
                  Connect
                </p>
                <ul className="space-y-2.5">
                  <li>
                    <a
                      href="/craefto-works-company-profile.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      Company Profile ↓
                    </a>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      Contact
                    </Link>
                  </li>
                  {siteConfig.links.linkedin && (
                    <li>
                      <a
                        href={siteConfig.links.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-white/70 hover:text-white transition-colors"
                      >
                        LinkedIn
                      </a>
                    </li>
                  )}
                  {siteConfig.links.twitter && (
                    <li>
                      <a
                        href={siteConfig.links.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-white/70 hover:text-white transition-colors"
                      >
                        X
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-white/40">
            <p>&copy; {currentYear} {siteConfig.studioName}</p>
            <p className="whitespace-nowrap">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              {" · "}
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              {" · "}
              <Link href="/privacy#cookies" className="hover:text-white transition-colors">Cookies</Link>
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
