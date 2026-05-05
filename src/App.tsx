import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { useAuth } from "./useAuth";
import { SignIn } from "./components/SignIn";
import { TopBar } from "./components/TopBar";
import { BoardsList } from "./components/BoardsList";
import { Board } from "./components/Board";

type Route =
  | { kind: "boards" }
  | { kind: "board"; boardId: Id<"boards"> };

function parseHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, "");
  const parts = h.split("/").filter(Boolean);
  if (parts[0] === "board" && parts[1]) {
    return { kind: "board", boardId: parts[1] as Id<"boards"> };
  }
  return { kind: "boards" };
}

function setHash(route: Route) {
  if (route.kind === "boards") window.location.hash = "/";
  else window.location.hash = `/board/${route.boardId}`;
}

export default function App() {
  const { currentUser, isLoading, signIn, signOut } = useAuth();
  const [route, setRoute] = useState<Route>(() => parseHash());

  useEffect(() => {
    const handler = () => setRoute(parseHash());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const navigate = (r: Route) => {
    setHash(r);
    setRoute(r);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/50 text-sm">Loading…</div>
      </div>
    );
  }

  if (!currentUser) {
    return <SignIn onSignIn={signIn} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        user={currentUser}
        onSignOut={signOut}
        onHome={() => navigate({ kind: "boards" })}
        breadcrumb={
          route.kind === "board" ? (
            <BoardBreadcrumb boardId={route.boardId} />
          ) : null
        }
      />
      {route.kind === "boards" ? (
        <BoardsList
          user={currentUser}
          onOpen={(boardId) => navigate({ kind: "board", boardId })}
        />
      ) : (
        <Board boardId={route.boardId} user={currentUser} />
      )}
    </div>
  );
}

function BoardBreadcrumb({ boardId }: { boardId: Id<"boards"> }) {
  const board = useQuery(api.boards.get, { boardId });
  return (
    <span className="text-sm text-white/80 truncate">
      {board?.name ?? "…"}
    </span>
  );
}
