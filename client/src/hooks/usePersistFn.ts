import { useRef } from "react";

type noop = (...args: any[]) => any;

export function usePersistFn<T extends noop>(fn: T) {
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  const persistFn = useRef<T>(
    ((...args: any[]) => fnRef.current(...args)) as T
  );

  return persistFn.current;
}
