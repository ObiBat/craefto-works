import { devices, type Page } from "@playwright/test";
import { test, expect } from "./fixtures";

// Ask Craefto, the website assistant. Opening the panel sends nothing to the
// AI and saves nothing, so these are safe to run against production.

/** A chat that comes back (from its id) at a summary card, waiting for the visitor to send it. */
const WAITING_AT_CARD = {
  messages: [
    { id: "m1", role: "user", parts: [{ type: "text", text: "I need a marketing website, as soon as possible. What would it cost?" }] },
    {
      id: "m2",
      role: "assistant",
      parts: [{ type: "text", text: "A marketing website is one of our published prices, and the Discovery Call is the quickest way to get a fixed price. What's your budget, roughly?" }],
    },
    { id: "m3", role: "user", parts: [{ type: "text", text: "A$3k to A$5k. I'm Urna, urna@example.com" }] },
    {
      id: "m4",
      role: "assistant",
      parts: [
        { type: "step-start" },
        { type: "text", text: "Thanks, Urna. Here's your enquiry: have a look, and send it when it's right.", state: "done" },
        {
          type: "tool-fileEnquiry",
          toolCallId: "call-1",
          state: "approval-requested",
          input: {
            name: "Urna",
            email: "urna@example.com",
            service: "web",
            budget: "3-5k",
            timeline: "asap",
            summary: "Wants a marketing website and would like it as soon as possible. Asked about cost and the fastest turnaround. Also interested in booking a Discovery Call.",
          },
          approval: { id: "approval-1" },
        },
      ],
    },
  ],
};

/** Opens the panel on a chat waiting at its summary card. Answering the card is turned away: nothing reaches the AI. */
async function openAtCard(page: Page) {
  await page.route(/\/api\/assistant\?id=/, (route) => route.fulfill({ json: WAITING_AT_CARD }));
  await page.route(/\/api\/assistant$/, (route) => route.fulfill({ status: 503, json: { error: "Not sent: this is a test." } }));
  await page.goto("/");
  await page.getByRole("button", { name: "Ask Craefto", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Ask Craefto" });
  const card = dialog.getByRole("group", { name: "Send this to Craefto Works?" });
  await expect(card).toBeVisible();
  return { dialog, card, log: dialog.getByRole("log", { name: "Conversation" }) };
}

/** The card is in view from its title, clear of the conversation's faded top edge (24px), down to its buttons. */
async function cardFits(card: ReturnType<Page["locator"]>, log: ReturnType<Page["locator"]>) {
  const title = card.getByText("Send this to Craefto Works?");
  await expect
    .poll(async () => {
      const [top, box, view] = await Promise.all([title.boundingBox(), card.boundingBox(), log.boundingBox()]);
      return Boolean(top && box && view && top.y >= view.y + 24 && box.y + box.height <= view.y + view.height + 1);
    })
    .toBe(true);
}

test.describe("Ask Craefto", () => {
  test("opens from a page, says it's an AI, and closes with Escape", async ({ page }) => {
    await page.goto("/");
    const launcher = page.getByRole("button", { name: "Ask Craefto", exact: true });
    await launcher.click();
    const dialog = page.getByRole("dialog", { name: "Ask Craefto" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("AI assistant", { exact: true })).toBeVisible();
    await expect(dialog.getByText(/pass your project to Craefto Works, where a person reads every enquiry/)).toBeVisible();
    await expect(page.getByLabel("Your message")).toBeFocused();
    await expect(dialog.getByRole("group", { name: "Ways to start" }).getByRole("button")).toHaveCount(3);
    // The button stays under the open panel (which grows over it), out of reach until it closes.
    const underneath = page.getByRole("button", { name: "Ask Craefto", exact: true, includeHidden: true });
    await expect(underneath).toHaveAttribute("aria-expanded", "true");
    await expect(underneath).toHaveAttribute("inert", "");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(launcher).toBeFocused();
    await expect(launcher).toHaveAttribute("aria-expanded", "false");
  });

  test("a summary card fits in view, in the message box's place, until it's answered", async ({ page }) => {
    const { dialog, card, log } = await openAtCard(page);
    await expect(page.getByLabel("Your message")).toBeHidden();
    await cardFits(card, log);
    await expect(card.getByRole("button", { name: "Send enquiry" })).toBeVisible();
    // Craefto Works, not a person, reads and replies.
    await expect(dialog).not.toContainText("Obi");
    await card.getByRole("button", { name: "Change something" }).click();
    await expect(page.getByLabel("Your message")).toBeVisible();
    await expect(page.getByLabel("Your message")).toBeFocused();
  });

  test.describe("on a phone", () => {
    // A Pixel 7, in this run's browser (which can't change inside a run).
    const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = devices["Pixel 7"];
    test.use({ viewport, userAgent, deviceScaleFactor, isMobile, hasTouch });

    test("a summary card fits the sheet too", async ({ page }) => {
      const { card, log } = await openAtCard(page);
      await expect(page.getByLabel("Your message")).toBeHidden();
      await cardFits(card, log);
      await card.getByRole("button", { name: "Change something" }).click();
      await expect(page.getByLabel("Your message")).toBeVisible();
    });
  });

  test.describe("on a small phone", () => {
    // An iPhone SE's screen under Safari's bars.
    test.use({ viewport: { width: 375, height: 548 }, isMobile: true, hasTouch: true });

    test("a summary card still fits", async ({ page }) => {
      const { card, log } = await openAtCard(page);
      await cardFits(card, log);
    });
  });

  test("isn't on the admin pages", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("button", { name: "Ask Craefto" })).toHaveCount(0);
  });

  test("the chat API refuses requests it can't read", async ({ request }) => {
    // 400 for a bad request; 403 where BotID, on Vercel, turns away a request that isn't from the page.
    const status = (await request.post("/api/assistant", { data: { id: "not-a-chat" } })).status();
    expect([400, 403]).toContain(status);
    expect((await request.get("/api/assistant?id=not-a-chat")).status()).toBe(404);
  });
});
