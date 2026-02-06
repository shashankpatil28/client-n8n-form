import { useEffect, useRef, useState, useCallback } from "react";

// Default refresh interval: 5 minutes (configurable via env var)
const DEFAULT_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Custom hook for polling data at regular intervals
 * @param fetchFn - Async function that fetches data
 * @param options - Configuration options
 * @returns Object with data, loading state, error, and refresh function
 */
export function usePolling<T>(
  fetchFn: () => Promise<T>,
  options?: {
    intervalMs?: number;
    enabled?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  }
) {
  const {
    intervalMs = parseInt(process.env.NEXT_PUBLIC_API_REFRESH_INTERVAL || String(DEFAULT_REFRESH_INTERVAL)),
    enabled = true,
    onSuccess,
    onError,
  } = options || {};

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async (isInitial: boolean = false) => {
    if (!isMountedRef.current) return;

    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const result = await fetchFn();
      if (isMountedRef.current) {
        setData(result);
        setLastUpdated(new Date());
        onSuccess?.(result);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        const errorMessage = err.message || "Failed to fetch data";
        setError(errorMessage);
        onError?.(err);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [fetchFn, onSuccess, onError]);

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;

    if (enabled) {
      fetchData(true);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set up polling interval
  useEffect(() => {
    if (!enabled || intervalMs <= 0) {
      return;
    }

    intervalRef.current = setInterval(() => {
      fetchData(false);
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalMs, fetchData]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchData(false);
  }, [fetchData]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    refresh,
  };
}

/**
 * Format the last updated time for display
 */
export function formatLastUpdated(date: Date | null): string {
  if (!date) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins === 1) return "1 minute ago";
  if (diffMins < 60) return `${diffMins} minutes ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return "1 hour ago";
  return `${diffHours} hours ago`;
}
