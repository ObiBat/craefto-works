import { ogCard } from "@/lib/og/card";

export const alt = "Careers at Craefto Works";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "Careers",
    title: "Join Craefto Works",
    description: "A creative & technology studio: designers, developers, strategists, filmmakers, photographers and technologists, working as one team.",
  });
}
