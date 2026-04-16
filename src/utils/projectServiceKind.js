/**
 * Project.tag: frontend | backend
 */
export const PROJECT_TAG = {
  WEB: "frontend",
  API: "backend",
};

export function isApiPreviewProject(tag) {
  const s = String(tag ?? "").toLowerCase();
  return s === PROJECT_TAG.API || s === "api";
}

export function isWebPreviewProject(tag) {
  return !isApiPreviewProject(tag);
}

export function previewKindShortLabel(tag) {
  if (tag == null || tag === "") return "—";
  const s = String(tag).toLowerCase();
  if (
    s === PROJECT_TAG.API ||
    s === "api" ||
    s === PROJECT_TAG.WEB ||
    s === "frontend"
  ) {
    return "Service";
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Jenkins `TAG` param: always `frontend` or `backend` (matches server normalizeBuildTag). */
export function jenkinsPreviewTag(projectTag) {
  return isApiPreviewProject(projectTag) ? "backend" : "frontend";
}
