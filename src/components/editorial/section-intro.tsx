import { AnimatedSection, SectionLabel } from "@/components/ui";
import { RevealText } from "@/components/editorial/reveal-text";

/** A numbered section opening, as on /about and /start: label, heading, then an optional lead. */
export function SectionIntro({
  id,
  number,
  label,
  title,
  children,
}: {
  id?: string;
  number: string;
  label: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <AnimatedSection>
      <div id={id} className="flex max-w-3xl scroll-mt-28 flex-col gap-4">
        <SectionLabel number={number} label={label} />
        <h2>
          <RevealText text={title} />
        </h2>
        {children && <div className="text-lg leading-relaxed text-[hsl(var(--color-foreground-muted))]">{children}</div>}
      </div>
    </AnimatedSection>
  );
}
