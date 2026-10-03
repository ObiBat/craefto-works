import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormCanvas } from "./form-canvas";

// The 3D form on its own, for scripts/company-profile.mjs to capture as the
// cover image (public/images/brand/craefto-form.png). Development only.

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function FormCapture() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main id="form">
      <style>{"html, body { background: transparent !important; } nextjs-portal { display: none !important; }"}</style>
      <FormCanvas />
    </main>
  );
}
