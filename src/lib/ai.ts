// What every model call through the Vercel AI Gateway asks for: only
// providers with zero data retention that don't train on prompts (the plan's
// "zero data retention switched on"), and the Gateway's prompt caching where
// the provider supports it.

export const PRIVATE_AI = {
  gateway: { zeroDataRetention: true, disallowPromptTraining: true, caching: "auto" as const },
};
