"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { CommandPalette } from "@/components/admin/CommandPalette";
import { NavIcon, IconMenu, IconX, IconLogout } from "@/components/admin/icons";
import styles from "./layout.module.css";

const NAV_ITEMS = [
  { href: "/admin", label: "Command Center", icon: "command" },
  { href: "/admin/clients", label: "Clients", icon: "briefcase" },
  { href: "/admin/members", label: "Members", icon: "card" },
  { href: "/admin/team", label: "Team", icon: "users" },
  { href: "/admin/projects", label: "Projects", icon: "folder" },
  { href: "/admin/finances", label: "Finances", icon: "dollar" },
  { href: "/admin/leads", label: "Leads", icon: "target" },
  { href: "/admin/outreach", label: "Outreach", icon: "mail" },
  { href: "/admin/chats", label: "Chats", icon: "chat" },
  { href: "/admin/applications", label: "Applications", icon: "inbox" },
  { href: "/admin/proposals", label: "Proposals", icon: "file" },
];

// Legacy routes stay accessible by URL but are intentionally not in the sidebar:
// /admin/documents, /admin/subscribers, /admin/journal, /admin/pipeline,
// /admin/analytics, /admin/intelligence, /admin/client-hub


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // The session is an httpOnly cookie the server checks on every admin API
  // call (src/proxy.ts); ask the server whether it's still valid.
  const checkSession = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth", { cache: "no-store" });
      setIsAuthenticated(res.ok);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Leftover flag from the old browser-only gate.
    sessionStorage.removeItem("admin_auth");
    void checkSession();
    // Coming back to the tab after the session expired shows the sign-in form.
    const onVisible = () => {
      if (document.visibilityState === "visible") void checkSession();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [checkSession]);

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      setPassword("");
      setIsAuthenticated(true);
    } else {
      setError("Invalid password");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" }).catch(() => {});
    setIsAuthenticated(false);
    router.push("/admin");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--color-background))] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[hsl(var(--color-accent))] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={`${styles.shell} min-h-screen bg-[hsl(var(--color-background))] flex items-center justify-center p-4`}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-[family-name:var(--font-heading)] font-semibold tracking-tight mb-1 text-[hsl(var(--color-foreground))]">Craefto</h1>
            <p className="text-xs tracking-[0.2em] uppercase text-[hsl(var(--color-foreground-subtle))] mb-4">Operations</p>
            <p className="text-sm text-[hsl(var(--color-foreground-muted))]">Enter password to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))]/50 text-[hsl(var(--color-foreground))] placeholder:text-[hsl(var(--color-foreground-subtle))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50 transition-all"
              autoFocus
            />
            {error && <p className="text-[hsl(var(--color-error))] text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))] font-medium rounded-xl hover:bg-[hsl(var(--color-primary-hover))] transition-colors"
            >
              Login
            </button>
          </form>
          <p className="text-center mt-6">
            <Link href="/" className="text-sm text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] transition-colors">
              &larr; Back to site
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.shell} min-h-screen bg-[hsl(var(--color-background))]`}>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 px-4 flex items-center justify-between bg-[hsl(var(--color-background-subtle))] border-b border-[hsl(var(--color-border))]">
        <div className="flex items-center gap-2">
          <span className="text-lg font-[family-name:var(--font-heading)] font-semibold tracking-tight text-[hsl(var(--color-foreground))]">Craefto</span>
          <span className="text-[10px] tracking-[0.2em] uppercase text-[hsl(var(--color-foreground-subtle))] mt-0.5">Operations</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-[hsl(var(--color-background-muted))] transition-colors text-[hsl(var(--color-foreground))]"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <IconX size={24} /> : <IconMenu size={24} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-[hsl(var(--color-foreground))]/20 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-[260px] flex flex-col z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 bg-[hsl(var(--color-background-subtle))] border-r border-[hsl(var(--color-border))] ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile close button */}
        <div className="lg:hidden h-14 flex items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-[hsl(var(--color-foreground))]">Craefto</span>
            <span className="text-[10px] tracking-[0.15em] uppercase text-[hsl(var(--color-foreground-subtle))] mt-0.5">Ops</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-[hsl(var(--color-background-muted))] transition-colors text-[hsl(var(--color-foreground))]"
            aria-label="Close menu"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Desktop header - Wordmark */}
        <div className="hidden lg:flex flex-col px-5 pt-6 pb-2">
          <span className="text-xl font-[family-name:var(--font-heading)] font-semibold tracking-tight text-[hsl(var(--color-foreground))]">Craefto</span>
          <span className="text-[10px] tracking-[0.2em] uppercase text-[hsl(var(--color-foreground-subtle))] mt-0.5">Operations</span>
        </div>

        {/* Command Palette Trigger */}
        <div className="hidden lg:block px-4 py-3">
          <CommandPalette />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                  isActive
                    ? "bg-[hsl(var(--color-accent))]/10 text-[hsl(var(--color-foreground))]"
                    : "text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-background-muted))]/50"
                }`}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[hsl(var(--color-accent))]" />
                )}
                <NavIcon icon={item.icon} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 pt-2 border-t border-[hsl(var(--color-border))]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-background-muted))]/50 rounded-lg transition-all duration-150"
          >
            <IconLogout size={20} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-[260px] min-h-screen">
        <div className="h-14 lg:hidden" />
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
