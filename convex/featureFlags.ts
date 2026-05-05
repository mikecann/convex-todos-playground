import { v } from "convex/values";
import { action } from "./_generated/server";
import { posthog } from "./posthog";

export const isEnabled = action({
  args: {
    key: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<boolean> => {
    const result = await posthog.getFeatureFlagResult(ctx, {
      key: args.key,
      distinctId: args.userId,
    });
    return result?.enabled === true;
  },
});
