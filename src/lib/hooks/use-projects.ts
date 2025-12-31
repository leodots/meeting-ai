import useSWR, { mutate } from "swr";

interface Project {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  _count?: { meetings: number };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const PROJECTS_KEY = "/api/projects";

export function useProjects() {
  const { data, error, isLoading, mutate: boundMutate } = useSWR<Project[]>(
    PROJECTS_KEY,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  return {
    projects: data ?? [],
    isLoading,
    error,
    refresh: boundMutate,
  };
}

/**
 * Refresh projects cache globally.
 * Can be called from anywhere to force all components using useProjects to re-fetch.
 */
export function refreshProjects() {
  return mutate(PROJECTS_KEY);
}
