/** A portal page's heading: a mono eyebrow, the title and a line of context. */
export function PageTitle({
  eyebrow,
  title,
  children,
  actions,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">{eyebrow}</p>
        )}
        {/* A span sets the size: the site's h1 rule is sized for marketing pages. */}
        <h1>
          <span className="block text-4xl font-semibold tracking-tight md:text-5xl">{title}</span>
        </h1>
        {children && <div className="mt-4 text-lg leading-relaxed text-[hsl(var(--color-foreground-muted))]">{children}</div>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
