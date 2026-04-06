/** Default env profile exists and has at least one variable (see API sanitize: environments = default profile vars). */
export function projectDefaultEnvReady(project) {
  if (!project) return false;
  return (
    Array.isArray(project.env_profiles) &&
    project.env_profiles.length > 0 &&
    Array.isArray(project.environments) &&
    project.environments.length > 0
  );
}
