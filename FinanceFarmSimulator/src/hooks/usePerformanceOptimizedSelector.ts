import { useSelector, shallowEqual } from 'react-redux';
import { useMemo, useRef, useCallback } from 'react';
import { RootState } from '../store/store';

// Custom hook for performance-optimized selectors with shallow comparison
export function usePerformanceOptimizedSelector<T>(
  selector: (state: RootState) => T,
  equalityFn: (left: T, right: T) => boolean = shallowEqual
): T {
  return useSelector(selector, equalityFn);
}

// Hook for memoized selectors with custom dependencies
export function useMemoizedSelector<T, D extends readonly unknown[]>(
  selector: (state: RootState) => T,
  deps: D,
  equalityFn: (left: T, right: T) => boolean = shallowEqual
): T {
  const memoizedSelector = useMemo(() => selector, deps);
  return useSelector(memoizedSelector, equalityFn);
}

// Hook for debounced selectors to prevent rapid re-renders
export function useDebouncedSelector<T>(
  selector: (state: RootState) => T,
  delay: number = 100,
  equalityFn: (left: T, right: T) => boolean = shallowEqual
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastValueRef = useRef<T>();
  const [debouncedValue, setDebouncedValue] = useState<T>();

  const currentValue = useSelector(selector, equalityFn);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (!equalityFn(currentValue, lastValueRef.current as T)) {
        lastValueRef.current = currentValue;
        setDebouncedValue(currentValue);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentValue, delay, equalityFn]);

  // Initialize with current value if not set
  if (debouncedValue === undefined) {
    return currentValue;
  }

  return debouncedValue;
}

// Hook for conditional selectors that only run when needed
export function useConditionalSelector<T>(
  selector: (state: RootState) => T,
  condition: boolean,
  fallbackValue: T,
  equalityFn: (left: T, right: T) => boolean = shallowEqual
): T {
  const conditionalSelector = useCallback(
    (state: RootState) => (condition ? selector(state) : fallbackValue),
    [selector, condition, fallbackValue]
  );

  return useSelector(conditionalSelector, equalityFn);
}

// Hook for batched selectors to reduce multiple selector calls
export function useBatchedSelectors<T extends Record<string, any>>(
  selectors: { [K in keyof T]: (state: RootState) => T[K] },
  equalityFn: (left: T, right: T) => boolean = shallowEqual
): T {
  const batchedSelector = useCallback(
    (state: RootState): T => {
      const result = {} as T;
      for (const [key, selector] of Object.entries(selectors)) {
        result[key as keyof T] = selector(state);
      }
      return result;
    },
    [selectors]
  );

  return useSelector(batchedSelector, equalityFn);
}

// Import statements for the debounced selector
import { useState, useEffect } from 'react';