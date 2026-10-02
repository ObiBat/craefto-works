import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";

// Pull Quote Component - Centered editorial style: a large accent quote mark
// sets it apart (no rules), and the words ink in as you scroll to them.
export function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="my-20 md:my-28 max-w-[42ch] mx-auto text-center">
      <span aria-hidden="true" className="block font-heading text-[5rem] md:text-[6.5rem] leading-[0.7] text-accent/30 select-none">
        &ldquo;
      </span>
      <div
        data-ink
        className="font-heading text-[1.375rem] md:text-[1.75rem] leading-[1.4] tracking-[-0.01em] text-foreground [&_p]:my-0 [&_p]:max-w-none [&_p]:[font-size:inherit] [&_p]:[line-height:inherit] [&_p]:[color:inherit] [&_p]:[letter-spacing:inherit]"
      >
        {children}
      </div>
    </blockquote>
  );
}

// Callout Component - Modern editorial style
export function Callout({
  type = "note",
  children,
}: {
  type?: "note" | "warning" | "tip";
  children: React.ReactNode;
}) {
  const styles = {
    note: "bg-blue-50 border-blue-200 text-blue-900 [&_svg]:text-blue-500",
    warning: "bg-amber-50 border-amber-200 text-amber-900 [&_svg]:text-amber-500",
    tip: "bg-emerald-50 border-emerald-200 text-emerald-900 [&_svg]:text-emerald-500",
  };

  const labels = {
    note: "Note",
    warning: "Warning",
    tip: "Tip",
  };

  const icons = {
    note: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    tip: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  };

  return (
    <aside className={cn("my-8 p-5 rounded-xl border-l-4 shadow-sm", styles[type])}>
      <div className="flex items-start gap-4">
        <span className="shrink-0 mt-0.5">{icons[type]}</span>
        <div>
          <p className="font-medium text-sm uppercase font-mono tracking-[0.06em] mb-2 opacity-80">{labels[type]}</p>
          <div className="text-base leading-relaxed [&>p]:my-0 [&>p:not(:first-child)]:mt-3">{children}</div>
        </div>
      </div>
    </aside>
  );
}

// Custom Link Component
function CustomLink({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isInternal = href?.startsWith("/") || href?.startsWith("#");

  if (isInternal) {
    return (
      <Link href={href || "#"} {...props} className="text-accent hover:underline">
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent hover:underline inline-flex items-center gap-1"
      {...props}
    >
      {children}
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

// Helper to generate heading ID
function generateHeadingId(children: React.ReactNode): string | undefined {
  if (typeof children === "string") {
    return children.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
  }
  return undefined;
}

// Anchor link component for headings
function HeadingAnchor({ id, children }: { id?: string; children: React.ReactNode }) {
  if (!id) return null;
  return (
    <a
      href={`#${id}`}
      className="ml-3 opacity-0 group-hover:opacity-100 transition-all duration-200 text-accent/60 hover:text-accent text-[0.65em]"
      aria-label={`Link to section: ${children}`}
    >
      #
    </a>
  );
}

// Heading Components - Professional newspaper-style hierarchy (2026 standards)
// Clear visual separation between levels with generous spacing

function Heading1({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const headingId = id || generateHeadingId(children);
  return (
    <h1 id={headingId} className="font-heading text-foreground group text-[1.75rem] md:text-[2rem] font-semibold mt-14 mb-6 leading-[1.15] tracking-[-0.02em]" {...props}>
      {children}
    </h1>
  );
}

function Heading2({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const headingId = id || generateHeadingId(children);
  return (
    <h2 id={headingId} className="font-heading text-foreground group text-[1.625rem] md:text-[2rem] font-semibold mt-20 mb-6 scroll-mt-24 leading-[1.15] tracking-[-0.02em]" {...props}>
      {children}
      <HeadingAnchor id={headingId}>{children}</HeadingAnchor>
    </h2>
  );
}

function Heading3({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const headingId = id || generateHeadingId(children);
  return (
    <h3 id={headingId} className="font-heading text-foreground group text-[1.3125rem] md:text-[1.5rem] font-semibold mt-14 mb-5 scroll-mt-24 leading-[1.2] tracking-[-0.01em]" {...props}>
      {children}
      <HeadingAnchor id={headingId}>{children}</HeadingAnchor>
    </h3>
  );
}

function Heading4({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const headingId = id || generateHeadingId(children);
  return (
    <h4 id={headingId} className="font-heading text-foreground group text-[1.125rem] md:text-[1.25rem] font-semibold mt-12 mb-4 scroll-mt-24 leading-[1.25]" {...props}>
      {children}
      <HeadingAnchor id={headingId}>{children}</HeadingAnchor>
    </h4>
  );
}

function Heading5({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const headingId = id || generateHeadingId(children);
  return (
    <h5 id={headingId} className="font-heading text-foreground group text-base md:text-[1.0625rem] font-semibold mt-10 mb-3 scroll-mt-24" {...props}>
      {children}
      <HeadingAnchor id={headingId}>{children}</HeadingAnchor>
    </h5>
  );
}

function Heading6({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const headingId = id || generateHeadingId(children);
  return (
    <h6 id={headingId} className="font-heading text-foreground-muted group text-sm font-semibold mt-8 mb-2 scroll-mt-24 uppercase tracking-[0.05em]" {...props}>
      {children}
      <HeadingAnchor id={headingId}>{children}</HeadingAnchor>
    </h6>
  );
}

// Image Component - Natural aspect ratio for smooth scrolling
function CustomImage({
  src,
  alt,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <figure className="my-10 md:my-14 max-w-2xl mx-auto">
      <div data-reveal="unmask" suppressHydrationWarning className="overflow-hidden rounded-lg bg-background-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt || ""}
          className="w-full h-auto shadow-sm"
          loading="lazy"
          decoding="async"
          {...props}
        />
      </div>
      {alt && (
        <figcaption className="mt-4 text-center text-sm text-foreground-muted">
          {alt}
        </figcaption>
      )}
    </figure>
  );
}

// Export all MDX components
export const mdxComponents = {
  h1: Heading1,
  h2: Heading2,
  h3: Heading3,
  h4: Heading4,
  h5: Heading5,
  h6: Heading6,
  a: CustomLink,
  img: CustomImage,
  pre: CodeBlock,
  blockquote: PullQuote,
  Callout,
  PullQuote,

  // Default element styling - Professional editorial typography (2026 standards)
  // Body: 19px desktop / 17px mobile, 1.65 line-height, 65ch max width
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => {
    // Check if children contains block-level elements (like images wrapped in figure)
    // If so, render as div to prevent hydration errors
    const hasBlockChild = React.Children.toArray(children).some((child) => {
      if (React.isValidElement(child)) {
        // Check for img elements which will become figures
        const childType = child.type;
        if (childType === 'img' || childType === CustomImage) {
          return true;
        }
      }
      return false;
    });

    if (hasBlockChild) {
      return <div className="my-7" {...props}>{children}</div>;
    }

    return (
      <p className="my-7 text-[1.0625rem] md:text-[1.1875rem] leading-[1.7] md:leading-[1.65] text-foreground/90 max-w-[65ch] tracking-[0.005em]" {...props}>
        {children}
      </p>
    );
  },
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="my-7 ml-5 list-disc space-y-3 text-[1.0625rem] md:text-[1.1875rem] leading-[1.65] text-foreground/90 max-w-[65ch] marker:text-foreground-subtle" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="my-7 ml-5 list-decimal space-y-3 text-[1.0625rem] md:text-[1.1875rem] leading-[1.65] text-foreground/90 max-w-[65ch] marker:text-foreground-muted marker:font-medium" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="leading-[1.65] pl-2" {...props}>
      {children}
    </li>
  ),
  // Section break: three dots, the typographic way, instead of a rule.
  hr: () => (
    <div role="separator" className="my-16 md:my-20 flex items-center justify-center gap-3">
      <span className="w-1.5 h-1.5 rounded-full bg-accent/45" />
      <span className="w-1.5 h-1.5 rounded-full bg-accent/45" />
      <span className="w-1.5 h-1.5 rounded-full bg-accent/45" />
    </div>
  ),
  table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-10 overflow-x-auto">
      {/* Rows read by soft alternating tiles rather than rules. */}
      <table
        className="w-full border-separate border-spacing-y-1 text-base [&_tbody_tr:nth-child(odd)_td]:bg-background-subtle [&_tbody_td:first-child]:rounded-l-xl [&_tbody_td:last-child]:rounded-r-xl"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th className="px-5 pb-3 text-left font-medium text-xs uppercase font-mono tracking-[0.06em] text-foreground-subtle" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-5 py-4 text-foreground/90" {...props}>
      {children}
    </td>
  ),
  code: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <code className="rounded-md bg-background-muted px-2 py-1 font-mono text-[0.9em] text-foreground border border-border-subtle" {...props}>
      {children}
    </code>
  ),
  // Strong and emphasis
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic text-foreground/95" {...props}>
      {children}
    </em>
  ),
  // Highlight/mark for emphasized callouts
  mark: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <mark className="bg-yellow-100 text-foreground px-1 py-0.5 rounded" {...props}>
      {children}
    </mark>
  ),
};
