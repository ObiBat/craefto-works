"use client";

import dynamic from "next/dynamic";

const Metaballs = dynamic(() => import("@/components/ui/metaballs").then((mod) => mod.Metaballs), { ssr: false });

/** The home page's 3D form, filling the window, for the generator to capture. */
export function FormCanvas() {
  return <Metaballs className="fixed inset-0" />;
}
