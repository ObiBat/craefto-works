import { CopyValue } from "./copy-value";
import { StatusPill } from "./status-pill";
import { STANDINGS, type Standing } from "@/lib/portal/invoice-rules";
import type { InvoiceIssuer } from "@/lib/portal/types";

// Pieces of the portal's billing pages: an invoice's standing, and the bank
// details to pay one with.

export function StandingPill({ standing }: { standing: Standing }) {
  return <StatusPill tone={STANDINGS[standing].tone}>{STANDINGS[standing].label}</StatusPill>;
}

/** Craefto's bank account, each value copyable; the reference is the invoice's number, if there is one. */
export function BankDetails({ bank, reference }: { bank: NonNullable<InvoiceIssuer["bank"]>; reference?: string | null }) {
  const rows: Array<[string, string, boolean]> = [
    ["Bank", bank.name, false],
    ["Account name", bank.account_name, false],
    ["BSB", bank.bsb, true],
    ["Account", bank.account_number, true],
  ];
  if (reference) rows.push(["Reference", reference, true]);
  return (
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-5 gap-y-2 text-sm">
      {rows
        .filter(([, value]) => value)
        .map(([label, value, copy]) => (
          <div key={label} className="contents">
            <dt className="text-[hsl(var(--color-foreground-subtle))]">{label}</dt>
            <dd className="min-w-0">{copy ? <CopyValue value={value} label={label} /> : <span className="font-medium">{value}</span>}</dd>
          </div>
        ))}
    </dl>
  );
}
