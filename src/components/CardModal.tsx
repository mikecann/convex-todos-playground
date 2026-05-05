import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { CurrentUser } from "../useAuth";

const STATUS_LABEL: Record<"todo" | "in_progress" | "done", string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

export function CardModal({
  cardId,
  user,
  onClose,
}: {
  cardId: Id<"cards">;
  user: CurrentUser;
  onClose: () => void;
}) {
  const card = useQuery(api.cards.get, { cardId });
  const comments = useQuery(api.comments.listByCard, { cardId });
  const updateCard = useMutation(api.cards.update);
  const removeCard = useMutation(api.cards.remove);
  const addComment = useMutation(api.comments.create);
  const removeComment = useMutation(api.comments.remove);

  // When editing, these hold the in-progress draft. null = not editing.
  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [descDraft, setDescDraft] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (card === undefined) {
    return (
      <Backdrop onClose={onClose}>
        <div className="h-64 w-full max-w-2xl rounded-2xl bg-slate-900/80 border border-white/10 animate-pulse" />
      </Backdrop>
    );
  }
  if (card === null) {
    onClose();
    return null;
  }

  const saveTitle = async () => {
    if (titleDraft === null) return;
    const t = titleDraft.trim();
    setTitleDraft(null);
    if (t.length === 0 || t === card.title) return;
    await updateCard({ cardId, title: t });
  };

  const saveDescription = async () => {
    if (descDraft === null) return;
    const d = descDraft;
    setDescDraft(null);
    if (d === card.description) return;
    await updateCard({ cardId, description: d });
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim().length === 0) return;
    await addComment({ cardId, authorId: user._id, body: comment.trim() });
    setComment("");
  };

  return (
    <Backdrop onClose={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto kanban-scroll rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-2xl animate-scale-in"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              {titleDraft !== null ? (
                <input
                  autoFocus
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={() => {
                    void saveTitle();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void saveTitle();
                    }
                    if (e.key === "Escape") {
                      setTitleDraft(null);
                    }
                  }}
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-xl font-semibold outline-none focus:border-emerald-400/60"
                />
              ) : (
                <h2
                  onClick={() => setTitleDraft(card.title)}
                  className="text-xl font-semibold tracking-tight cursor-text rounded-lg px-3 py-2 -mx-3 hover:bg-white/5 transition"
                >
                  {card.title}
                </h2>
              )}
              <div className="mt-1.5 px-3 -mx-3 flex items-center gap-2 text-xs text-white/50">
                <StatusPill status={card.status} />
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/50 hover:text-white text-xl leading-none px-2"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <section className="mt-6">
            <SectionTitle>Description</SectionTitle>
            {descDraft !== null ? (
              <div>
                <textarea
                  autoFocus
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  rows={5}
                  placeholder="Add a more detailed description…"
                  className="w-full resize-y bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400/60"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      void saveDescription();
                    }}
                    className="rounded-md bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-3 py-1.5 text-xs font-semibold"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setDescDraft(null)}
                    className="text-xs text-white/60 hover:text-white px-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setDescDraft(card.description)}
                className={`min-h-16 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/5 cursor-text px-3 py-2 text-sm whitespace-pre-wrap transition ${
                  card.description.trim().length === 0 ? "text-white/40" : ""
                }`}
              >
                {card.description.trim().length === 0
                  ? "Add a more detailed description…"
                  : card.description}
              </div>
            )}
          </section>

          <section className="mt-6">
            <SectionTitle>
              Comments
              {comments && (
                <span className="ml-2 text-xs text-white/40 tabular-nums">
                  {comments.length}
                </span>
              )}
            </SectionTitle>

            <form
              onSubmit={(e) => {
                void submitComment(e);
              }}
              className="flex gap-2 mb-3"
            >
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment…"
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-emerald-400/60"
              />
              <button
                type="submit"
                disabled={comment.trim().length === 0}
                className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-3 text-xs font-semibold disabled:opacity-40"
              >
                Post
              </button>
            </form>

            <div className="space-y-2">
              {comments?.map((c) => {
                const isMine = c.authorId === user._id;
                return (
                  <div
                    key={c._id}
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-3 animate-fade-in"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center text-[10px] font-bold text-slate-900">
                          {c.authorName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-white/80">
                          {c.authorName}
                        </span>
                        <span className="text-[10px] text-white/30">
                          {new Date(c._creationTime).toLocaleString()}
                        </span>
                      </div>
                      {isMine && (
                        <button
                          onClick={() => void removeComment({ commentId: c._id })}
                          className="text-[10px] text-white/30 hover:text-rose-300 transition"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-white/80 whitespace-pre-wrap">
                      {c.body}
                    </p>
                  </div>
                );
              })}
              {comments?.length === 0 && (
                <p className="text-xs text-white/30 text-center py-4">
                  No comments yet.
                </p>
              )}
            </div>
          </section>

          <div className="mt-8 pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={() => {
                if (confirmingDelete) {
                  void removeCard({ cardId }).then(() => onClose());
                } else {
                  setConfirmingDelete(true);
                  setTimeout(() => setConfirmingDelete(false), 2500);
                }
              }}
              className={`text-xs px-3 py-1.5 rounded-md border transition ${
                confirmingDelete
                  ? "border-rose-400/60 text-rose-200 bg-rose-500/15"
                  : "border-white/10 text-white/50 hover:text-white hover:border-white/30"
              }`}
            >
              {confirmingDelete ? "Click again to confirm" : "Delete card"}
            </button>
          </div>
        </div>
      </div>
    </Backdrop>
  );
}

function Backdrop({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] px-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
      {children}
    </h3>
  );
}

function StatusPill({ status }: { status: "todo" | "in_progress" | "done" }) {
  const styles: Record<typeof status, string> = {
    todo: "bg-sky-500/15 text-sky-300 border-sky-400/30",
    in_progress: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    done: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${styles[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}
