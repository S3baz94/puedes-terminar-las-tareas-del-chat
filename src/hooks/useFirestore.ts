import { useMemo } from 'react';

export function useMockCollection<T>(items: T[]) {
  return useMemo(
    () => ({
      data: items,
      loading: false,
      error: null as string | null,
    }),
    [items],
  );
}
