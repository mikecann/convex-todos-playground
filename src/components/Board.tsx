import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { CurrentUser } from "../useAuth";
import { CardModal } from "./CardModal";

type Status = "todo" | "in_progress" | "done";

const COLUMNS: { id: Status; title: string; accent: string }[] = [
  { id: "todo", title: "To Do", accent: "from-sky-400 to-blue-500" },
  {
    id: "in_progress",
    title: "In Progress",
    accent: "from-amber-400 to-orange-500",
  },
  { id: "done", title: "Done", accent: "from-emerald-400 to-teal-500" },
];

export function Board({
  boardId,
  user,
}: {
  boardId: Id<"boards">;
  user: CurrentUser;
}) {
  const cards = useQuery(api.cards.listByBoard, { boardId });
  const createCard = useMutation(api.cards.create);
  const moveCard = useMutation(api.cards.move).withOptimisticUpdate(
    (localStore, { cardId, status, order }) => {
      const existing = localStore.getQuery(api.cards.listByBoard, { boardId });
      if (!existing) return;
      localStore.setQuery(
        api.cards.listByBoard,
        { boardId },
        existing.map((c) =>
          c._id === cardId ? { ...c, status, order } : c,
        ),
      );
    },
  );

  const [activeId, setActiveId] = useState<Id<"cards"> | null>(null);
  const [openCardId, setOpenCardId] = useState<Id<"cards"> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const grouped = useMemo(() => {
    const map: Record<Status, Doc<"cards">[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    if (!cards) return map;
    for (const c of cards) map[c.status].push(c);
    for (const s of COLUMNS) map[s.id].sort((a, b) => a.order - b.order);
    return map;
  }, [cards]);

  const findCard = (id: Id<"cards">) =>
    cards?.find((c) => c._id === id) ?? null;
  const activeCard = activeId ? findCard(activeId) : null;

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id as Id<"cards">);
  };

  // While dragging across columns, optimistically move the card so the
  // placeholder appears in the destination column.
  const onDragOver = (_e: DragOverEvent) => {
    // Visual feedback is handled by dnd-kit. Final position is computed on drop.
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over || !cards) return;

    const activeCardId = active.id as Id<"cards">;
    const overId = over.id as string;
    const activeCard = cards.find((c) => c._id === activeCardId);
    if (!activeCard) return;

    // Determine destination column.
    let destStatus: Status;
    let overIndex: number; // position to insert at within the destination list

    const overIsColumn = COLUMNS.some((c) => c.id === overId);
    if (overIsColumn) {
      destStatus = overId as Status;
      overIndex = grouped[destStatus].length; // append
    } else {
      const overCard = cards.find((c) => c._id === (overId as Id<"cards">));
      if (!overCard) return;
      destStatus = overCard.status;
      const list = grouped[destStatus];
      overIndex = list.findIndex((c) => c._id === overCard._id);
      if (overIndex < 0) overIndex = list.length;
    }

    const sourceList = grouped[activeCard.status];
    const destList = grouped[destStatus];

    // Build the resulting destination list (after the move) to compute order.
    let resultList: Doc<"cards">[];
    if (activeCard.status === destStatus) {
      const sourceIndex = sourceList.findIndex((c) => c._id === activeCardId);
      if (sourceIndex === overIndex) return;
      resultList = arrayMove(sourceList, sourceIndex, overIndex);
    } else {
      resultList = [...destList];
      resultList.splice(overIndex, 0, activeCard);
    }

    const newIndex = resultList.findIndex((c) => c._id === activeCardId);
    const before = resultList[newIndex - 1];
    const after = resultList[newIndex + 1];

    let newOrder: number;
    if (!before && !after) newOrder = 1000;
    else if (!before && after) newOrder = after.order - 1000;
    else if (before && !after) newOrder = before.order + 1000;
    else if (before && after) newOrder = (before.order + after.order) / 2;
    else return;

    void moveCard({ cardId: activeCardId, status: destStatus, order: newOrder });
  };

  if (cards === undefined) {
    return (
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-6 max-w-7xl mx-auto w-full">
        {COLUMNS.map((c) => (
          <div
            key={c.id}
            className="h-96 rounded-2xl border border-white/10 bg-white/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-6 max-w-7xl mx-auto w-full">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              title={col.title}
              accent={col.accent}
              cards={grouped[col.id]}
              onCreateCard={(title) =>
                createCard({
                  boardId,
                  status: col.id,
                  title,
                  authorId: user._id,
                })
              }
              onOpenCard={setOpenCardId}
            />
          ))}
        </div>
        <DragOverlay>
          {activeCard ? <CardView card={activeCard} dragging /> : null}
        </DragOverlay>
      </DndContext>

      {openCardId && (
        <CardModal
          cardId={openCardId}
          user={user}
          onClose={() => setOpenCardId(null)}
        />
      )}
    </>
  );
}

function Column({
  id,
  title,
  accent,
  cards,
  onCreateCard,
  onOpenCard,
}: {
  id: Status;
  title: string;
  accent: string;
  cards: Doc<"cards">[];
  onCreateCard: (title: string) => Promise<Id<"cards">>;
  onOpenCard: (id: Id<"cards">) => void;
}) {
  const { setNodeRef, isOver } = useSortable({ id, data: { type: "column" } });
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.trim().length === 0) return;
    setSubmitting(true);
    try {
      await onCreateCard(draft.trim());
      setDraft("");
      setAdding(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl border bg-white/5 backdrop-blur transition ${
        isOver
          ? "border-emerald-400/40 bg-white/10"
          : "border-white/10"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${accent}`} />
          <h2 className="text-sm font-semibold tracking-wide uppercase text-white/80">
            {title}
          </h2>
          <span className="text-xs text-white/40 tabular-nums">{cards.length}</span>
        </div>
      </div>

      <SortableContext
        items={cards.map((c) => c._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="kanban-scroll flex-1 min-h-32 max-h-[calc(100vh-260px)] overflow-y-auto p-2 space-y-2">
          {cards.map((card) => (
            <SortableCard
              key={card._id}
              card={card}
              onClick={() => onOpenCard(card._id)}
            />
          ))}
          {cards.length === 0 && (
            <div className="text-center text-xs text-white/30 py-8 select-none">
              Drop cards here
            </div>
          )}
        </div>
      </SortableContext>

      <div className="p-2 border-t border-white/5">
        {adding ? (
          <form
            onSubmit={(e) => {
              void submit(e);
            }}
            className="space-y-2"
          >
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submit(e);
                }
                if (e.key === "Escape") {
                  setAdding(false);
                  setDraft("");
                }
              }}
              placeholder="Card title…"
              rows={2}
              className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-emerald-400/60"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting || draft.trim().length === 0}
                className="rounded-md bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                Add card
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setDraft("");
                }}
                className="text-xs text-white/60 hover:text-white px-2"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full rounded-lg px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition text-left"
          >
            + Add a card
          </button>
        )}
      </div>
    </div>
  );
}

function SortableCard({
  card,
  onClick,
}: {
  card: Doc<"cards">;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card._id, data: { type: "card", status: card.status } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Avoid firing when this was a drag (PointerSensor moved >4px).
        if (isDragging) return;
        e.stopPropagation();
        onClick();
      }}
    >
      <CardView card={card} />
    </div>
  );
}

function CardView({
  card,
  dragging = false,
}: {
  card: Doc<"cards">;
  dragging?: boolean;
}) {
  const hasDescription = card.description.trim().length > 0;
  return (
    <div
      className={`group rounded-xl border border-white/10 bg-slate-900/70 hover:border-white/20 hover:bg-slate-900 p-3 cursor-pointer transition shadow-md ${
        dragging ? "rotate-1 shadow-2xl ring-1 ring-emerald-400/50" : ""
      }`}
    >
      <div className="text-sm text-white/95 leading-snug">{card.title}</div>
      {hasDescription && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-white/40">
          <svg
            className="h-3 w-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="14" y2="18" />
          </svg>
          <span>Description</span>
        </div>
      )}
    </div>
  );
}
