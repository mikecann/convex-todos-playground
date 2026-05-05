import { useMemo } from "react";
import { useMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import { useToast } from "./toast-context";

// Convex wraps thrown errors with a "[CONVEX M(...)] Server Error\nUncaught Error: ..."
// prefix. Pull out the user-facing line so toasts read cleanly.
function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const m = err.message.match(/(?:Uncaught Error|ConvexError):\s*([^\n]+)/);
    if (m) return m[1].trim();
    return err.message;
  }
  return String(err);
}

type ReactMutationLike = ((args: unknown) => Promise<unknown>) & {
  withOptimisticUpdate?: (cb: unknown) => ReactMutationLike;
};

function wrap<F extends ReactMutationLike>(
  fn: F,
  toastError: (msg: string) => void,
): F {
  const wrapped = ((args: unknown) =>
    (fn as ReactMutationLike)(args).catch((e: unknown) => {
      toastError(extractErrorMessage(e));
      throw e;
    })) as F;

  if (typeof fn.withOptimisticUpdate === "function") {
    wrapped.withOptimisticUpdate = (cb: unknown) =>
      wrap(fn.withOptimisticUpdate!(cb), toastError);
  }
  return wrapped;
}

export function useToastedMutation<M extends FunctionReference<"mutation">>(
  mutation: M,
): ReturnType<typeof useMutation<M>> {
  const fn = useMutation(mutation);
  const toast = useToast();
  return useMemo(
    () =>
      wrap(
        fn as unknown as ReactMutationLike,
        toast.error,
      ) as unknown as ReturnType<typeof useMutation<M>>,
    [fn, toast.error],
  );
}
