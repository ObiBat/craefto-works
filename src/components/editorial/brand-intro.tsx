import { LogoMark } from "@/components/ui/logo-mark";

/**
 * Home page intro, on the first visit of a session (the boot script sets
 * html.logo-intro-home and removes it when the intro ends; add ?intro to the
 * URL to replay it). The mark draws large in the centre, the veil parts along
 * the mark's diagonal, and the mark glides into the header, handing over to
 * the real header logo. Pure CSS (see "Logo intro" in globals.css): it plays
 * from the first paint, clicks pass straight through, and it is skipped with
 * reduced motion.
 */
export function BrandIntro() {
  return (
    <div className="brand-intro" aria-hidden="true">
      <span className="brand-intro-veil brand-intro-veil-a" />
      <span className="brand-intro-veil brand-intro-veil-b" />
      <span className="brand-intro-slot">
        <LogoMark width={40} height={40} />
      </span>
    </div>
  );
}
