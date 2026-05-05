import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (name.length === 0) throw new Error("Name is required");
    return await ctx.db.insert("users", { name });
  },
});

export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get("users", args.userId);
  },
});

export const getMany = query({
  args: { userIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const result: Record<string, { _id: string; name: string }> = {};
    for (const id of args.userIds) {
      const u = await ctx.db.get("users", id);
      if (u) result[u._id] = { _id: u._id, name: u.name };
    }
    return result;
  },
});
