import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const BOARD_COLORS = [
  "from-emerald-400 to-teal-500",
  "from-sky-400 to-blue-500",
  "from-amber-400 to-orange-500",
  "from-cyan-400 to-blue-500",
  "from-lime-400 to-emerald-500",
  "from-orange-400 to-rose-400",
];

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("boards").order("desc").take(200);
  },
});

export const get = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    return await ctx.db.get("boards", args.boardId);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (name.length === 0) throw new Error("Board name is required");
    const color = BOARD_COLORS[Math.floor(Math.random() * BOARD_COLORS.length)];
    return await ctx.db.insert("boards", {
      name,
      ownerId: args.ownerId,
      color,
    });
  },
});

export const rename = mutation({
  args: { boardId: v.id("boards"), name: v.string() },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (name.length === 0) throw new Error("Board name is required");
    await ctx.db.patch("boards", args.boardId, { name });
  },
});

export const remove = mutation({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    const cards = await ctx.db
      .query("cards")
      .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
      .collect();
    for (const c of cards) {
      const cs = await ctx.db
        .query("comments")
        .withIndex("by_card", (q) => q.eq("cardId", c._id))
        .collect();
      for (const cm of cs) await ctx.db.delete("comments", cm._id);
      await ctx.db.delete("cards", c._id);
    }
    await ctx.db.delete("boards", args.boardId);
  },
});
