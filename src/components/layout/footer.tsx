"use client";

import Link from "next/link";
import { Container } from "./container";
import { Logo } from "@/components/ui/logo";
import { navigation, siteConfig, services } from "@/lib/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerServices = services.slice(0, 4).map(s => ({
    name: s.title.split(" & ")[0].split("-")[0].trim(),
    href: s.href,
  }));

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
                aria-label="Craefto - Home"
              >
                <Logo size="md" inverted />
              </Link>
              <p className="text-sm text-white/60 leading-relaxed">
                Design systems and digital products built with craft and intention.
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
                  {footerServices.map((service) => (
                    <li key={service.name}>
                      <Link
                        href={service.href}
                        className="text-sm text-white/70 hover:text-white transition-colors"
                      >
                        {service.name}
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
                      href="/craefto-company-profile.pdf"
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
            <p>&copy; {currentYear} {siteConfig.name}</p>
            <p className="whitespace-nowrap">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              {" · "}
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              {" · "}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('openCookiePreferences'))}
                className="hover:text-white transition-colors"
              >Cookies</button>
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
