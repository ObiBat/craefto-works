"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/portal", label: "Overview" },
  { href: "/portal/requests", label: "Requests" },
  { href: "/portal/calendar", label: "Calendar" },
  { href: "/portal/messages", label: "Messages" },
  { href: "/portal/calls", label: "Calls" },
  { href: "/portal/billing", label: "Billing" },
];

/** The portal's sections; the current one sits on a soft tint. Billing only for clients who pay through Stripe. */
export function PortalNav({ billing = true }: { billing?: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Portal" className="-mx-1 flex gap-0.5 overflow-x-auto px-1 sm:gap-1">
      {LINKS.filter(({ href }) => billing || href !== "/portal/billing").map(({ href, label }) => {
        const current = href === "/portal" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center rounded-full px-2.5 py-2 text-[0.8125rem] font-medium transition-colors sm:px-4 sm:text-sm",
              current
                ? "bg-[hsl(var(--color-accent-subtle))] text-[hsl(var(--color-accent))]"
                : "text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
