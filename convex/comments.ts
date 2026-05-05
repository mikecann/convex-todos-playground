import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByCard = query({
  args: { cardId: v.id("cards") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
      .take(200);

    const authorIds = Array.from(new Set(comments.map((c) => c.authorId)));
    const authors: Record<string, string> = {};
    for (const id of authorIds) {
      const u = await ctx.db.get("users", id);
      if (u) authors[u._id] = u.name;
    }
    return comments.map((c) => ({
      ...c,
      authorName: authors[c.authorId] ?? "Unknown",
    }));
  },
});

export const create = mutation({
  args: {
    cardId: v.id("cards"),
    authorId: v.id("users"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const body = args.body.trim();
    if (body.length === 0) throw new Error("Comment is required");
    return await ctx.db.insert("comments", {
      cardId: args.cardId,
      authorId: args.authorId,
      body,
    });
  },
});

export const remove = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    await ctx.db.delete("comments", args.commentId);
  },
});
