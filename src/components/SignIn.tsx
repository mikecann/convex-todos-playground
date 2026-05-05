import { useState } from "react";

export function SignIn({ onSignIn }: { onSignIn: (name: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length === 0) return;
    setSubmitting(true);
    try {
      await onSignIn(name.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={(e) => {
          void submit(e);
        }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl animate-scale-in"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/30" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Welcome to Kanban</h1>
            <p className="text-sm text-white/60">Pick a name to get started</p>
          </div>
        </div>
        <label className="block text-sm font-medium text-white/80 mb-2">Your name</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alex Chen"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-emerald-400/60 focus:bg-white/10 transition"
        />
        <button
          type="submit"
          disabled={submitting || name.trim().length === 0}
          className="mt-5 w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-4 py-2.5 text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "Setting up…" : "Continue"}
        </button>
        <p className="mt-4 text-xs text-white/40 text-center">
          We just store your name + ID in this browser. No password.
        </p>
      </form>
    </div>
  );
}
