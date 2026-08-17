import { useRef } from "react";

type noop = (...args: any[]) => any;

/**
 * usePersistFn instead of useCallback to reduce cognitive load
 */
export function usePersistFn<T extends noop>(fn: T) {
  const fnRef = useRef<T>(fn);

  // Always update the ref to the latest function
  fnRef.current = fn;

  // Create a stable function that always calls the latest fnRef.current
  const persistFn = useRef<T>(
    ((...args: any[]) => fnRef.current(...args)) as T
  );

  return persistFn.current;
}
