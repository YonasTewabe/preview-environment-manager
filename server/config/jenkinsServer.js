function trimBase(url) {
  return String(url || "").replace(/\/+$/, "");
}

export const JENKINS_BASE = trimBase(
  process.env.JENKINS_BASE_URL,
);

export const JENKINS_USER = process.env.JENKINS_USER;
export const JENKINS_PASSWORD = process.env.JENKINS_PASSWORD;

/** Deletes a preview domain in Jenkins. */
export const JOB_DELETE_DOMAIN = process.env.JENKINS_JOB_DELETE_DOMAIN;

/**
 * Single parameterized preview build job (TAG, REPO_URL, BRANCH_NAME, PORT, DOMAIN_NAME, ENV_JSON).
 * Optional env fallbacks so existing deployments keep working.
 */
export const JOB_PREVIEW = process.env.JENKINS_JOB_PREVIEW;

export function jenkinsApiJsonUrl() {
  return `${JENKINS_BASE}/api/json`;
}

export function jenkinsBuildWithParamsUrl(jobName) {
  return `${JENKINS_BASE}/job/${jobName}/buildWithParameters`;
}

export function jenkinsQueueItemUrl(queueId) {
  return `${JENKINS_BASE}/queue/item/${queueId}/api/json`;
}

export function jenkinsBuildApiUrl(jobName, buildNumber) {
  return `${JENKINS_BASE}/job/${jobName}/${buildNumber}/api/json`;
}

export function jenkinsArtifactUrl(jobName, buildNumber, relativePath) {
  return `${JENKINS_BASE}/job/${jobName}/${buildNumber}/artifact/${relativePath}`;
}
