import { ogCard } from "@/lib/og/card";
import { construction } from "@/content/construction";

export const alt = "Construction Operations & AI Integration, by Craefto Works";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "Construction operations",
    title: construction.headline,
    description: "Crew scheduling, timesheets, job costing and the software you already use, connected for subcontractors in Sydney and NSW.",
  });
}
