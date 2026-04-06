/** URL-safe slug unique per project for env profiles. */
export function slugifyEnvProfileLabel(name, fallbackId) {
  const raw = String(name ?? "").trim().toLowerCase();
  let s = raw.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!s) s = `env-${fallbackId ?? "x"}`;
  return s.slice(0, 64);
}

export async function uniqueSlugForProject(
  ProjectEnvProfile,
  projectId,
  baseSlug,
  excludeProfileId = null,
) {
  let slug = baseSlug.slice(0, 64) || "env";
  let n = 0;
  for (;;) {
    const candidate = n ? `${slug}-${n}`.slice(0, 64) : slug;
    const existing = await ProjectEnvProfile.findOne({
      where: { project_id: projectId, slug: candidate },
    });
    if (!existing || existing.id === excludeProfileId) return candidate;
    n += 1;
  }
}
