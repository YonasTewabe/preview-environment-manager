import { ProjectEnvProfile } from "../models/index.js";

export async function getDefaultEnvProfile(projectId) {
  return ProjectEnvProfile.findOne({
    where: { project_id: projectId, is_default: true },
  });
}

export async function resolveProfileIdForProject(projectId, profileId) {
  if (profileId != null && profileId !== "") {
    const id = String(profileId).trim();
    if (!id) return null;
    const row = await ProjectEnvProfile.findOne({
      where: { id, project_id: projectId },
    });
    return row?.id ?? null;
  }
  const def = await getDefaultEnvProfile(projectId);
  return def?.id ?? null;
}

/** Node's selected profile, or project default */
export async function resolveProfileIdForNode(node) {
  if (node?.project_env_profile_id) return node.project_env_profile_id;
  if (!node?.project_id) return null;
  const def = await getDefaultEnvProfile(node.project_id);
  return def?.id ?? null;
}
