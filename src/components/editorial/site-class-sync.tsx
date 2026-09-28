"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Keeps html.site correct after client-side navigation between the site and admin/portal. */
export function SiteClassSync() {
  const pathname = usePathname();
  useEffect(() => {
    (window as unknown as { __cwMarkSite?: () => void }).__cwMarkSite?.();
  }, [pathname]);
  return null;
}
