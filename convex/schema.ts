import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const COLUMN_STATUSES = ["todo", "in_progress", "done"] as const;
export const columnStatusValidator = v.union(
  v.literal("todo"),
  v.literal("in_progress"),
  v.literal("done"),
);

export default defineSchema({
  users: defineTable({
    name: v.string(),
  }),

  boards: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    color: v.string(),
  }).index("by_owner", ["ownerId"]),

  cards: defineTable({
    boardId: v.id("boards"),
    status: columnStatusValidator,
    title: v.string(),
    description: v.string(),
    order: v.number(),
    authorId: v.id("users"),
  })
    .index("by_board", ["boardId"])
    .index("by_board_and_status", ["boardId", "status", "order"]),

  comments: defineTable({
    cardId: v.id("cards"),
    authorId: v.id("users"),
    body: v.string(),
  }).index("by_card", ["cardId"]),
});
