/**
 * Normalize ids for React Query keys. Route params are strings; API rows often use
 * numbers — without this, invalidateQueries misses active queries (`5` !== `"5"`).
 * @param {unknown} id
 */
export function queryKeyPart(id) {
  if (id == null || id === "") return id;
  return String(id);
}

/**
 * After creates/updates/deletes, mark matching GET queries stale and refetch any that
 * are currently mounted. Uses partial queryKey matching (TanStack Query v5).
 *
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {...unknown[]} queryKeyPrefixes
 */
export async function invalidateAndRefetchActive(
  queryClient,
  ...queryKeyPrefixes
) {
  for (const queryKey of queryKeyPrefixes) {
    if (!Array.isArray(queryKey)) continue;
    await queryClient.invalidateQueries({ queryKey });
    await queryClient.refetchQueries({ queryKey, type: "active" });
  }
}
