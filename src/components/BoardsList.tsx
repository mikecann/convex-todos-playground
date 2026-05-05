import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { CurrentUser } from "../useAuth";

export function BoardsList({
  user,
  onOpen,
}: {
  user: CurrentUser;
  onOpen: (id: Id<"boards">) => void;
}) {
  const boards = useQuery(api.boards.list);
  const createBoard = useMutation(api.boards.create);
  const removeBoard = useMutation(api.boards.remove);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length === 0) return;
    setCreating(true);
    try {
      const id = await createBoard({ name: name.trim(), ownerId: user._id });
      setName("");
      onOpen(id);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Boards</h1>
          <p className="text-white/60 text-sm mt-1">
            Create a board to start tracking work.
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          void submit(e);
        }}
        className="mb-8 flex gap-2 rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New board name…"
          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-white/30"
        />
        <button
          type="submit"
          disabled={creating || name.trim().length === 0}
          className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-4 py-2 text-sm font-semibold shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Create board
        </button>
      </form>

      {boards === undefined ? (
        <SkeletonGrid />
      ) : boards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-white/5 flex items-center justify-center text-2xl mb-4">
            +
          </div>
          <p className="text-white/70">No boards yet. Create your first one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((b) => (
            <BoardCard
              key={b._id}
              board={b}
              isOwner={b.ownerId === user._id}
              onOpen={() => onOpen(b._id)}
              onDelete={() => {
                void removeBoard({ boardId: b._id });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BoardCard({
  board,
  isOwner,
  onOpen,
  onDelete,
}: {
  board: Doc<"boards">;
  isOwner: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div
      onClick={onOpen}
      className="group cursor-pointer relative rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur p-5 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5"
    >
      <div
        className={`absolute inset-x-0 top-0 h-1.5 rounded-t-2xl bg-gradient-to-r ${board.color}`}
      />
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold tracking-tight pr-8">{board.name}</h3>
        {isOwner && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirming) {
                onDelete();
              } else {
                setConfirming(true);
                setTimeout(() => setConfirming(false), 2500);
              }
            }}
            className={`text-xs px-2 py-1 rounded-md border transition ${
              confirming
                ? "border-rose-400/60 text-rose-300 bg-rose-500/10"
                : "border-white/10 text-white/40 hover:text-white hover:border-white/30 opacity-0 group-hover:opacity-100"
            }`}
          >
            {confirming ? "Confirm" : "Delete"}
          </button>
        )}
      </div>
      <p className="text-xs text-white/40 mt-2">
        Created {new Date(board._creationTime).toLocaleDateString()}
      </p>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-28 rounded-2xl border border-white/10 bg-white/5 animate-pulse"
        />
      ))}
    </div>
  );
}
