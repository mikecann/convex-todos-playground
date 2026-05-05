import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { columnStatusValidator } from "./schema";

export const listByBoard = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cards")
      .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
      .take(200);
  },
});

export const get = query({
  args: { cardId: v.id("cards") },
  handler: async (ctx, args) => {
    return await ctx.db.get("cards", args.cardId);
  },
});

export const create = mutation({
  args: {
    boardId: v.id("boards"),
    status: columnStatusValidator,
    title: v.string(),
    authorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const title = args.title.trim();
    if (title.length === 0) throw new Error("Title is required");

    const last = await ctx.db
      .query("cards")
      .withIndex("by_board_and_status", (q) =>
        q.eq("boardId", args.boardId).eq("status", args.status),
      )
      .order("desc")
      .take(1);
    const order = last.length === 0 ? 1000 : last[0].order + 1000;

    return await ctx.db.insert("cards", {
      boardId: args.boardId,
      status: args.status,
      title,
      description: "",
      order,
      authorId: args.authorId,
    });
  },
});

export const update = mutation({
  args: {
    cardId: v.id("cards"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: { title?: string; description?: string } = {};
    if (args.title !== undefined) {
      const t = args.title.trim();
      if (t.length === 0) throw new Error("Title is required");
      patch.title = t;
    }
    if (args.description !== undefined) {
      patch.description = args.description;
    }
    await ctx.db.patch("cards", args.cardId, patch);
  },
});

export const remove = mutation({
  args: { cardId: v.id("cards") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
      .collect();
    for (const c of comments) await ctx.db.delete("comments", c._id);
    await ctx.db.delete("cards", args.cardId);
  },
});

// Move/reorder a card. The client computes the new order index based on its
// neighbors in the destination column (midpoint between two orders, or
// before-first / after-last).
export const move = mutation({
  args: {
    cardId: v.id("cards"),
    status: columnStatusValidator,
    order: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("cards", args.cardId, {
      status: args.status,
      order: args.order,
    });
  },
});
