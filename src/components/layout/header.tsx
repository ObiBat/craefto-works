"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Container } from "./container";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { navigation } from "@/lib/constants";
import { SectionIndicator } from "@/components/editorial/section-indicator";
import { pauseSmoothScroll, scrollPageTo } from "@/lib/smooth-scroll";

function MoreDropdown({ items, indexOffset }: { items: { name: string; href: string }[]; indexOffset: number }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
  };

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        className="nav-link group relative px-4 py-2 overflow-hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="nav-link-index" aria-hidden="true">&nbsp;</span>
        <span className="nav-link-text">
          <span className="nav-link-text-primary flex items-center gap-1.5">
            More
            <svg
              className={cn(
                "w-3 h-3 transition-transform duration-300 ease-[cubic-bezier(0.76,0,0.24,1)]",
                isOpen && "rotate-180"
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
          <span className="nav-link-text-secondary flex items-center gap-1.5" aria-hidden="true">
            More
            <svg
              className={cn(
                "w-3 h-3 transition-transform duration-300 ease-[cubic-bezier(0.76,0,0.24,1)]",
                isOpen && "rotate-180"
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </span>
      </button>

      {/* Invisible hover bridge — eliminates the dead zone between trigger and panel */}
      <div
        className={cn(
          "absolute top-full right-0 h-3 w-full",
          !isOpen && "pointer-events-none"
        )}
      />

      {/* Dropdown panel */}
      <div
        className={cn(
          "absolute top-[calc(100%+12px)] right-0 min-w-[220px]",
          "transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          isOpen
            ? "opacity-100 translate-y-0 visible"
            : "opacity-0 -translate-y-2 invisible pointer-events-none"
        )}
      >
        <div
          className={cn(
            "rounded-2xl border border-[hsl(var(--color-border))]",
            "bg-[hsl(var(--color-background))]/98 backdrop-blur-xl",
            "shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)]",
            "overflow-hidden"
          )}
        >
          <div className="p-1.5">
            {items.map((item, index) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 px-3.5 py-3 rounded-xl",
                    "text-sm transition-all duration-200",
                    isActive
                      ? "text-[hsl(var(--color-foreground))] bg-[hsl(var(--color-background-muted))]"
                      : "text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-background-muted))]"
                  )}
                  style={{
                    transitionDelay: isOpen ? `${index * 50}ms` : "0ms",
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen ? "translateX(0)" : "translateX(-6px)",
                    transition: `opacity 250ms cubic-bezier(0.16,1,0.3,1) ${isOpen ? index * 50 : 0}ms, transform 250ms cubic-bezier(0.16,1,0.3,1) ${isOpen ? index * 50 : 0}ms, background-color 150ms ease, color 150ms ease`,
                  }}
                  onClick={() => setIsOpen(false)}
                >
                  <span
                    className={cn(
                      "text-[0.625rem] font-medium tabular-nums transition-all duration-200 min-w-[1rem]",
                      isActive
                        ? "opacity-50"
                        : "opacity-0 -translate-x-1 group-hover:opacity-40 group-hover:translate-x-0"
                    )}
                  >
                    {String(indexOffset + index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-medium tracking-[-0.01em]">{item.name}</span>
                  <svg
                    className={cn(
                      "ml-auto w-3.5 h-3.5 transition-all duration-200",
                      isActive
                        ? "opacity-40"
                        : "opacity-0 -translate-x-2 group-hover:opacity-30 group-hover:translate-x-0"
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                  </svg>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Navigate from mobile menu: close menu first, then navigate
  const handleMobileNav = React.useCallback((href: string) => {
    setIsMobileMenuOpen(false);
    document.body.style.overflow = "";
    // Let the menu start closing, then navigate
    requestAnimationFrame(() => {
      router.push(href);
    });
  }, [router]);

  const handleLogoClick = (e: React.MouseEvent) => {
    setIsMobileMenuOpen(false);
    if (pathname === "/") {
      e.preventDefault();
      scrollPageTo(0);
    }
  };

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    // Smooth scrolling moves the page from script, which overflow can't stop.
    pauseSmoothScroll(isMobileMenuOpen);
    return () => {
      document.body.style.overflow = "";
      pauseSmoothScroll(false);
    };
  }, [isMobileMenuOpen]);

  // Close menu when route changes (safety net)
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
    document.body.style.overflow = "";
  }, [pathname]);

  // Close menu on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <>
      <header
        data-scrolled={isScrolled && !isMobileMenuOpen ? "" : undefined}
        className={cn(
          "site-header feather-edge fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isMobileMenuOpen
            ? "bg-[hsl(var(--color-foreground))] backdrop-blur-0 border-transparent shadow-none"
            : isScrolled
              ? "bg-[hsl(var(--color-background))]/95 backdrop-blur-md"
              : "bg-transparent"
        )}
      >
        <Container>
          <div className="flex h-16 items-center justify-between">
            {/* Logo, and on wide screens the section you are reading */}
            <div className="flex items-center gap-6 min-w-0">
              <Link
                href="/"
                className={cn(
                  "flex-shrink-0 logo-link",
                  isMobileMenuOpen && "logo-inverted"
                )}
                onClick={handleLogoClick}
                aria-label="Craefto Works, home"
              >
                <Logo
                  size="md"
                  inverted={isMobileMenuOpen}
                />
              </Link>
              <SectionIndicator className={cn("inline-flex lg:hidden xl:inline-flex", isMobileMenuOpen && "invisible")} />
            </div>

            {/* Desktop navigation, from 1024px: below that the seven items don't fit
                and the menu button takes over. */}
            <nav className="hidden lg:flex items-center gap-1">
              {navigation.main.map((item, index) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="nav-link group relative px-4 py-2 overflow-hidden"
                >
                  <span className="nav-link-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="nav-link-text">
                    <span className="nav-link-text-primary">{item.name}</span>
                    <span className="nav-link-text-secondary" aria-hidden="true">{item.name}</span>
                  </span>
                </Link>
              ))}

              {/* More dropdown for secondary nav items */}
              {navigation.secondary.length > 0 && (
                <MoreDropdown items={navigation.secondary} indexOffset={navigation.main.length} />
              )}

              <div className="ml-4">
                <Button size="sm" asChild>
                  <Link href={navigation.cta.href}>
                    <span className="btn-text-wrapper">
                      <span className="btn-text-primary">{navigation.cta.name}</span>
                      <span className="btn-text-secondary" aria-hidden="true">Let&apos;s talk</span>
                    </span>
                  </Link>
                </Button>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className={cn(
                "lg:hidden relative z-50 flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300",
                isMobileMenuOpen
                  ? "bg-white/20"
                  : "hover:bg-[hsl(var(--color-background-muted))]"
              )}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              <div className="hamburger-wrapper">
                <span className={cn(
                  "hamburger-line",
                  isMobileMenuOpen && "hamburger-line-active-1 !bg-white"
                )} />
                <span className={cn(
                  "hamburger-line",
                  isMobileMenuOpen && "hamburger-line-active-2"
                )} />
                <span className={cn(
                  "hamburger-line",
                  isMobileMenuOpen && "hamburger-line-active-3 !bg-white"
                )} />
              </div>
            </button>
          </div>
        </Container>
      </header>

      {/* Mobile Menu - Full Screen Overlay */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-40 transition-all duration-500 ease-out",
          isMobileMenuOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        )}
        aria-hidden={!isMobileMenuOpen}
      >
        {/* Background overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-[hsl(var(--color-foreground))] transition-transform duration-500 ease-out origin-top",
            isMobileMenuOpen ? "scale-y-100" : "scale-y-0"
          )}
        />

        {/* Content */}
        <div className="relative h-full flex flex-col pt-24 pb-8 px-6 overflow-y-auto">
          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {[...navigation.main, ...navigation.secondary].map((item, index) => (
              <button
                key={item.name}
                type="button"
                className={cn(
                  "mobile-nav-link group flex items-baseline gap-4 py-4 border-b border-white/15 w-full text-left",
                  isMobileMenuOpen && "mobile-nav-link-active"
                )}
                style={{
                  transitionDelay: isMobileMenuOpen ? `${index * 75 + 150}ms` : "0ms"
                }}
                onClick={() => handleMobileNav(item.href)}
              >
                <span className="mobile-nav-index text-xs font-medium text-white/50 tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="mobile-nav-text text-3xl sm:text-4xl font-semibold text-white tracking-tight">
                  {item.name}
                </span>
                <svg
                  className="ml-auto w-5 h-5 text-white/50 transition-transform duration-300 group-hover:translate-x-2 group-hover:text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            ))}
          </nav>

          {/* Mobile CTA */}
          <div
            className={cn(
              "mt-auto pt-8 transition-all duration-500",
              isMobileMenuOpen
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            )}
            style={{ transitionDelay: isMobileMenuOpen ? "450ms" : "0ms" }}
          >
            <Button
              variant="secondary"
              size="lg"
              className="w-full !bg-[hsl(var(--color-accent))] !text-white !border-0 font-semibold"
              onClick={() => handleMobileNav(navigation.cta.href)}
            >
              <span className="btn-text-wrapper">
                <span className="btn-text-primary">{navigation.cta.name}</span>
                <span className="btn-text-secondary" aria-hidden="true">Let&apos;s talk</span>
              </span>
            </Button>

            {/* Contact info */}
            <div
              className={cn(
                "mt-8 pt-6 border-t border-white/15 transition-all duration-500",
                isMobileMenuOpen ? "opacity-100" : "opacity-0"
              )}
              style={{ transitionDelay: isMobileMenuOpen ? "550ms" : "0ms" }}
            >
              <p className="text-sm text-white/60 mb-2">Get in touch</p>
              <button
                type="button"
                onClick={() => handleMobileNav("/contact")}
                className="text-white font-medium hover:underline text-left"
              >
                hello@craefto.com
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
