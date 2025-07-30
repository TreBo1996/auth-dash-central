import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

interface UseInfiniteScrollReturn {
  isFetching: boolean;
  setIsFetching: (fetching: boolean) => void;
  lastElementRef: (node: HTMLElement | null) => void;
}

export const useInfiniteScroll = (
  hasNextPage: boolean,
  fetchMore: () => void,
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn => {
  const {
    threshold = 1.0,
    rootMargin = '0px',
    enabled = true
  } = options;

  const [isFetching, setIsFetching] = useState(false);
  const observer = useRef<IntersectionObserver>();

  const lastElementRef = useCallback((node: HTMLElement | null) => {
    if (isFetching || !enabled) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && !isFetching) {
        setIsFetching(true);
        fetchMore();
      }
    }, {
      threshold,
      rootMargin
    });

    if (node) observer.current.observe(node);
  }, [isFetching, hasNextPage, fetchMore, enabled, threshold, rootMargin]);

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  return { isFetching, setIsFetching, lastElementRef };
};