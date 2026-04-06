function trimTrailingSlashes(s) {
  return String(s ?? "").replace(/\/+$/, "");
}

/** Jenkins UI origin (no trailing slash). Used for stored job links only. */
export const JENKINS_BASE_URL = trimTrailingSlashes(
  import.meta.env.VITE_JENKINS_BASE_URL,
);

/** Single Jenkins job for all preview builds (params: TAG, REPO_URL, …). */
export const JENKINS_JOB_PREVIEW = import.meta.env.VITE_JENKINS_JOB_PREVIEW;

/**
 * Parameter names the Jenkins preview job accepts (buildWithParameters).
 * The backend proxy must forward only these to Jenkins, and the API accepts only
 * this same set on POST …/jenkins/trigger-preview-job.
 */
export const JENKINS_PREVIEW_JOB_PARAM_NAMES = [
  "TAG",
  "REPO_URL",
  "BRANCH_NAME",
  "PORT",
  "DOMAIN_NAME",
  "ENV_JSON",
];

/** Only the Jenkins job parameters — used as the JSON body for trigger-preview-job. */
export function pickPreviewTriggerRequestBody(raw) {
  if (raw == null || typeof raw !== "object") return {};
  const out = {};
  for (const k of JENKINS_PREVIEW_JOB_PARAM_NAMES) {
    if (raw[k] !== undefined) out[k] = raw[k];
  }
  return out;
}

/** Folder URL for a Jenkins job (trailing slash), for display / DB metadata. */
export function jenkinsJobFolderUrl(jobName) {
  return `${JENKINS_BASE_URL}/job/${jobName}/`;
}

/** App API base (trailing slash), e.g. `http://localhost:4000/api/`. */
export function appApiBase() {
  const b = import.meta.env.VITE_BACKEND_URL || "";
  return b.endsWith("/") ? b : `${b}/`;
}
