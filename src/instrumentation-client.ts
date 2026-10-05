import { initBotId } from "botid/client/core";

// Vercel BotID: an invisible check on the requests that cost money to serve.
// Ask Craefto's messages are the only ones today (api/assistant/route.ts).
initBotId({
  protect: [{ path: "/api/assistant", method: "POST" }],
});
