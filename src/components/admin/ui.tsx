import * as React from "react";
import { cn } from "@/lib/utils";
import { IconSearch } from "./icons";

// ─── Page container ─────────────────────────────────────

export function PageContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-8 md:space-y-10", className)}>{children}</div>;
}

// ─── Page header ────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  eyebrow?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}

export function PageHeader({ title, subtitle, eyebrow, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="space-y-3">
      {breadcrumb && <div>{breadcrumb}</div>}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[hsl(var(--color-foreground-subtle))] mb-1">
              {eyebrow}
            </p>
          )}
          <h1 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl tracking-tight font-semibold text-[hsl(var(--color-foreground))] break-words">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm md:text-base text-[hsl(var(--color-foreground-muted))] mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

// ─── Section ────────────────────────────────────────────

interface SectionProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export function Section({ title, description, actions, children, id, className }: SectionProps) {
  return (
    <section id={id} className={cn("space-y-4", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            {title && (
              <h2 className="font-[family-name:var(--font-heading)] text-xl md:text-2xl tracking-tight font-semibold text-[hsl(var(--color-foreground))]">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-[hsl(var(--color-foreground-muted))] mt-0.5">{description}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

// ─── Card ───────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "default" | "compact" | "hero" | "none";
}

const CARD_PADDING = {
  default: "p-6",
  compact: "p-4",
  hero: "p-8",
  none: "",
} as const;

export function Card({ children, className, padding = "default" }: CardProps) {
  return (
    <div
      className={cn(
        "bg-[hsl(var(--color-background-subtle))]/50 backdrop-blur-sm border border-[hsl(var(--color-border))]/50 rounded-2xl",
        CARD_PADDING[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Stat card ──────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down";
  icon?: React.ReactNode;
  href?: string;
  accent?: "success" | "warning" | "error";
}

const STAT_ACCENT = {
  success: "text-[hsl(var(--color-success))]",
  warning: "text-[hsl(var(--color-warning))]",
  error: "text-[hsl(var(--color-error))]",
} as const;

export function StatCard({ label, value, icon, accent }: StatCardProps) {
  return (
    <div className="bg-[hsl(var(--color-background-subtle))]/50 backdrop-blur-sm border border-[hsl(var(--color-border))]/50 rounded-2xl p-6 hover:border-[hsl(var(--color-border-strong))]/60 hover:bg-[hsl(var(--color-background-subtle))]/80 hover:shadow-lg hover:shadow-black/5 transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-[hsl(var(--color-foreground-muted))] mb-2">{label}</p>
          <p
            className={cn(
              "text-3xl font-semibold tracking-tight tabular-nums font-mono break-words",
              accent ? STAT_ACCENT[accent] : "text-[hsl(var(--color-foreground))]"
            )}
          >
            {value}
          </p>
        </div>
        {icon && (
          <div className="p-2.5 bg-[hsl(var(--color-background-muted))]/50 rounded-xl text-[hsl(var(--color-foreground-muted))]">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center p-8">
      <div className="border-2 border-dashed border-[hsl(var(--color-border))]/30 rounded-2xl p-8 flex flex-col items-center text-center max-w-md">
        {icon && (
          <div className="mb-4 text-[hsl(var(--color-foreground-subtle))]">{icon}</div>
        )}
        <p className="text-lg font-medium text-[hsl(var(--color-foreground-muted))] mb-1">{title}</p>
        {description && (
          <p className="text-sm text-[hsl(var(--color-foreground-subtle))] mb-5">{description}</p>
        )}
        {action}
      </div>
    </div>
  );
}

// ─── Filter bar ─────────────────────────────────────────

export function FilterBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto -mx-4 px-4 pb-2 max-w-[calc(100%+2rem)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Filter chip ────────────────────────────────────────

interface FilterChipProps {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function FilterChip({ active, onClick, children, className }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active ?? false}
      className={cn(
        "px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0",
        active
          ? "bg-[hsl(var(--color-accent))]/15 text-[hsl(var(--color-accent))] border border-[hsl(var(--color-accent))]/25"
          : "text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-background-muted))]",
        className
      )}
    >
      {children}
    </button>
  );
}

// ─── Search input ───────────────────────────────────────

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Accessible name for the input. Defaults to the placeholder. */
  label?: string;
}

export function SearchInput({ value, onChange, placeholder = "Search...", className, label }: SearchInputProps) {
  return (
    <div className={cn("relative flex-1 max-w-sm", className)}>
      <IconSearch
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--color-foreground-subtle))]"
      />
      <input
        type="text"
        aria-label={label ?? placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl text-sm text-[hsl(var(--color-foreground))] placeholder-[hsl(var(--color-foreground-subtle))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/40 focus:border-[hsl(var(--color-accent))]/40 transition-all"
      />
    </div>
  );
}

// ─── Status badge ───────────────────────────────────────

type StatusVariant = "neutral" | "success" | "warning" | "error" | "info" | "accent";

const STATUS_STYLES: Record<StatusVariant, string> = {
  neutral: "bg-[hsl(var(--color-foreground-subtle))]/10 text-[hsl(var(--color-foreground-muted))] border-[hsl(var(--color-border))]/30",
  success: "bg-[hsl(var(--color-success-subtle))] text-[hsl(var(--color-success))] border-[hsl(var(--color-success))]/20",
  warning: "bg-[hsl(var(--color-warning-subtle))] text-[hsl(var(--color-warning))] border-[hsl(var(--color-warning))]/20",
  error: "bg-[hsl(var(--color-error-subtle))] text-[hsl(var(--color-error))] border-[hsl(var(--color-error))]/20",
  info: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  accent: "bg-[hsl(var(--color-accent))]/15 text-[hsl(var(--color-accent))] border-[hsl(var(--color-accent))]/20",
};

export function StatusBadge({
  variant = "neutral",
  children,
  className,
}: {
  variant?: StatusVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
        STATUS_STYLES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// ─── Skeleton loader ────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-[hsl(var(--color-background-muted))]/60 rounded-lg",
        className
      )}
    />
  );
}

// ─── Data table ─────────────────────────────────────────

interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  mobileCardRender?: (row: T) => React.ReactNode;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  mobileCardRender,
  emptyState,
  onRowClick,
}: DataTableProps<T>) {
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {/* Mobile cards */}
      {mobileCardRender && (
        <div className="md:hidden space-y-3">
          {data.map((row) => (
            <div
              key={keyExtractor(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "bg-[hsl(var(--color-background-subtle))]/50 border border-[hsl(var(--color-border))]/50 rounded-xl p-4",
                onRowClick && "cursor-pointer hover:border-[hsl(var(--color-border-strong))]/60 transition-colors"
              )}
            >
              {mobileCardRender(row)}
            </div>
          ))}
        </div>
      )}

      {/* Desktop table */}
      <div className={cn("bg-[hsl(var(--color-background-subtle))]/50 backdrop-blur-sm border border-[hsl(var(--color-border))]/50 rounded-2xl overflow-hidden", mobileCardRender && "hidden md:block")}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[hsl(var(--color-border))]/30">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "text-left px-6 py-3 text-xs font-semibold text-[hsl(var(--color-foreground-muted))]",
                      col.className
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--color-border))]/30">
              {data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "hover:bg-[hsl(var(--color-background-muted))]/30 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-6 py-3.5", col.className)}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── Detail section (for detail pages) ──────────────────

interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function DetailSection({ title, children, className }: DetailSectionProps) {
  return (
    <div className={cn("bg-[hsl(var(--color-background-subtle))]/50 border border-[hsl(var(--color-border))]/50 rounded-2xl p-6", className)}>
      <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))] mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Info field (label + value pair for detail pages) ───

interface InfoFieldProps {
  label: string;
  value: React.ReactNode;
  href?: string;
  external?: boolean;
}

export function InfoField({ label, value, href, external }: InfoFieldProps) {
  return (
    <div>
      <p className="text-xs text-[hsl(var(--color-foreground-subtle))] mb-1">{label}</p>
      {href ? (
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="text-sm text-[hsl(var(--color-accent))] hover:underline break-all"
        >
          {value}
        </a>
      ) : (
        <p className="text-sm text-[hsl(var(--color-foreground))]">{value}</p>
      )}
    </div>
  );
}
