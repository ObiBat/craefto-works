import Link from "next/link";
import { PageTitle } from "@/components/portal/page-title";

export default function PortalNotFound() {
  return (
    <div className="max-w-2xl">
      <PageTitle title="Not found">
        <p>That page isn&apos;t here. It may have moved, or the link may be wrong.</p>
      </PageTitle>
      <Link href="/portal" className="font-medium text-[hsl(var(--color-accent))] hover:underline">
        Back to your overview
      </Link>
    </div>
  );
}
