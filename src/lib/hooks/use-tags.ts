import useSWR, { mutate } from "swr";

interface Tag {
  id: string;
  name: string;
  color: string;
  _count?: { meetings: number };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const TAGS_KEY = "/api/tags";

export function useTags() {
  const { data, error, isLoading, mutate: boundMutate } = useSWR<Tag[]>(
    TAGS_KEY,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  return {
    tags: data ?? [],
    isLoading,
    error,
    refresh: boundMutate,
  };
}

/**
 * Refresh tags cache globally.
 * Can be called from anywhere to force all components using useTags to re-fetch.
 */
export function refreshTags() {
  return mutate(TAGS_KEY);
}
