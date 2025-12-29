import { useEffect, useRef } from 'react';
import { scanForContrastViolations, logViolations } from '@/lib/contrastChecker';

/**
 * Development-only hook that scans the DOM for contrast violations.
 * 
 * This hook runs only in development mode and logs warnings to the console
 * when it detects text colors that may have insufficient contrast against
 * their background colors.
 * 
 * Usage:
 * ```tsx
 * import { useContrastChecker } from '@/hooks/useContrastChecker';
 * 
 * function App() {
 *   useContrastChecker(); // Enable contrast checking in development
 *   return <div>...</div>;
 * }
 * ```
 */
export function useContrastChecker(options: {
  /** Debounce delay in ms before running scan after DOM changes */
  debounceMs?: number;
  /** Whether to scan on initial mount */
  scanOnMount?: boolean;
  /** Whether to scan on DOM mutations */
  scanOnMutation?: boolean;
} = {}): void {
  const {
    debounceMs = 1000,
    scanOnMount = true,
    scanOnMutation = true,
  } = options;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    // Only run in development mode
    if (!import.meta.env.DEV) return;

    const runScan = () => {
      const violations = scanForContrastViolations();
      if (violations.length > 0 || !hasScannedRef.current) {
        logViolations(violations);
        hasScannedRef.current = true;
      }
    };

    const debouncedScan = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(runScan, debounceMs);
    };

    // Initial scan after a short delay for DOM to settle
    if (scanOnMount) {
      timeoutRef.current = setTimeout(runScan, 500);
    }

    // Optional: Watch for DOM mutations
    let observer: MutationObserver | null = null;
    if (scanOnMutation) {
      observer = new MutationObserver(debouncedScan);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class'],
      });
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (observer) {
        observer.disconnect();
      }
    };
  }, [debounceMs, scanOnMount, scanOnMutation]);
}

export default useContrastChecker;
