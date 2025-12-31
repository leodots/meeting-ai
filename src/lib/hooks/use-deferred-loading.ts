import { useSyncExternalStore, useCallback, useRef, useEffect } from "react";

/**
 * Hook that delays showing loading state to prevent skeleton flash on fast loads.
 * Only shows skeleton if loading takes longer than the specified delay.
 *
 * @param isLoading - The actual loading state
 * @param delay - Milliseconds to wait before showing skeleton (default: 150ms)
 * @returns Whether to show the skeleton
 */
export function useDeferredLoading(isLoading: boolean, delay = 150): boolean {
  const showSkeletonRef = useRef(false);
  const listenerRef = useRef<(() => void) | null>(null);

  const subscribe = useCallback((onStoreChange: () => void) => {
    listenerRef.current = onStoreChange;
    return () => {
      listenerRef.current = null;
    };
  }, []);

  const getSnapshot = useCallback(() => showSkeletonRef.current, []);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isLoading) {
      timer = setTimeout(() => {
        showSkeletonRef.current = true;
        listenerRef.current?.();
      }, delay);
    } else {
      showSkeletonRef.current = false;
      listenerRef.current?.();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, delay]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
