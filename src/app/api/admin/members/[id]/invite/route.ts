import { NextRequest, NextResponse } from "next/server";
import { accountById, createSignIn } from "@/lib/portal/accounts";
import { sendInvite } from "@/lib/portal/notify";
import { siteOrigin } from "@/lib/portal/origin";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/members/[id]/invite - Email the client a link that signs them in to their portal
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await accountById(id);
  if (!account) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  try {
    const { tokenHash, type } = await createSignIn(account);
    const link = `${await siteOrigin()}/portal/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=${type}`;
    await sendInvite(account, link);
    return NextResponse.json({ sent: true, to: account.email });
  } catch (error) {
    console.error("Inviting a client failed:", error);
    return NextResponse.json({ error: "The invite didn't send. Try again." }, { status: 500 });
  }
}
