import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

export function useFeatureFlag(key: string, userId: Id<"users"> | null) {
  const isEnabled = useAction(api.featureFlags.isEnabled);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void isEnabled({ key, userId }).then((result) => {
      if (!cancelled) setEnabled(result);
    });
    return () => {
      cancelled = true;
    };
  }, [isEnabled, key, userId]);

  return userId ? enabled : null;
}
