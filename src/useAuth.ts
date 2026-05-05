import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { useToastedMutation } from "./useToastedMutation";

const STORAGE_KEY = "kanban.userId";

export type CurrentUser = {
  _id: Id<"users">;
  name: string;
};

export function useAuth() {
  const [userId, setUserId] = useState<Id<"users"> | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (stored as Id<"users">) : null;
  });

  const user = useQuery(api.users.get, userId ? { userId } : "skip");
  const createUser = useToastedMutation(api.users.create);

  // If the stored userId no longer exists in the DB (e.g. the backend was reset),
  // clear it from localStorage. The render path treats user === null as signed
  // out, so no state update is needed.
  useEffect(() => {
    if (userId && user === null) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [userId, user]);

  const signIn = async (name: string) => {
    const id = await createUser({ name });
    localStorage.setItem(STORAGE_KEY, id);
    setUserId(id);
  };

  const signOut = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUserId(null);
  };

  const isLoading = userId !== null && user === undefined;
  const currentUser: CurrentUser | null =
    user && userId ? { _id: userId, name: user.name } : null;

  return { currentUser, isLoading, signIn, signOut };
}
