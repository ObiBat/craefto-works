import Link from "next/link";
import type { ClientRequest } from "@/lib/portal/types";
import { RequestStatusPill } from "./status-pill";
import { sydneyDate } from "./thread";

/** Requests as rows: what was asked, where it stands, when it last moved. */
export function RequestList({ requests }: { requests: ClientRequest[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {requests.map((request) => (
        <li key={request.id}>
          <Link
            href={`/portal/requests/${request.id}`}
            className="group flex flex-col gap-2 rounded-2xl bg-[hsl(var(--color-background-subtle))] px-5 py-4 transition-colors hover:bg-[hsl(var(--color-accent-subtle))] sm:flex-row sm:items-center sm:justify-between sm:gap-6"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium text-[hsl(var(--color-foreground))] group-hover:text-[hsl(var(--color-accent))]">
                {request.title}
              </span>
              <span className="mt-0.5 block text-sm text-[hsl(var(--color-foreground-subtle))]">
                Updated {sydneyDate(request.updated_at)}
              </span>
            </span>
            <span className="self-start sm:self-auto">
              <RequestStatusPill status={request.status} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
