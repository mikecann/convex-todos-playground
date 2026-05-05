import type { CurrentUser } from "../useAuth";

export function TopBar({
  user,
  onSignOut,
  onHome,
  breadcrumb,
}: {
  user: CurrentUser;
  onSignOut: () => void;
  onHome: () => void;
  breadcrumb?: React.ReactNode;
}) {
  const initial = user.name.charAt(0).toUpperCase();
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/40 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onHome}
            className="flex items-center gap-2 group"
            title="Boards"
          >
            <div className="h-8 w-8 rounded-lg bg-emerald-500 shadow-md shadow-emerald-500/30 group-hover:scale-105 transition" />
            <span className="font-semibold tracking-tight">Kanban</span>
          </button>
          {breadcrumb && (
            <div className="flex items-center gap-2 min-w-0 ml-2">
              <span className="text-white/30">/</span>
              <div className="min-w-0">{breadcrumb}</div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm text-white/70">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center text-xs font-bold text-slate-900">
              {initial}
            </div>
            <span>{user.name}</span>
          </div>
          <button
            onClick={onSignOut}
            className="text-xs text-white/60 hover:text-white border border-white/10 hover:border-white/30 rounded-md px-2.5 py-1.5 transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
