/**
 * Whether a preview node has ever had a finished Jenkins deploy worth running
 * domain cleanup for. `last_build_at` is set when deploy/rebuild is triggered,
 * so completion must come from status / artifact URL.
 */
export function nodeHasCompletedBuild(node) {
  const status = String(node?.build_status ?? "").toLowerCase();
  if (status === "success") return true;
  const link = node?.preview_link;
  if (link != null && String(link).trim() !== "") return true;
  return false;
}
