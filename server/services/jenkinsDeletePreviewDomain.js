import axios from "axios";
import {
  JENKINS_USER,
  JENKINS_PASSWORD,
  JOB_DELETE_DOMAIN,
  jenkinsBuildWithParamsUrl,
  jenkinsQueueItemUrl,
  jenkinsBuildApiUrl,
  jenkinsArtifactUrl,
} from "../config/jenkinsServer.js";

/**
 * Run the Jenkins delete-domain job to completion (same behavior as POST /api/jenkins/delete-preview-job).
 * @param {string} DOMAIN_NAME
 * @returns {Promise<{ success: boolean; message: string; [key: string]: unknown }>}
 */
export async function deletePreviewDomainViaJenkins(DOMAIN_NAME) {
  if (!DOMAIN_NAME) {
    return {
      success: false,
      message: "Missing required parameter: DOMAIN_NAME",
    };
  }

  const jenkinsUrl = jenkinsBuildWithParamsUrl(JOB_DELETE_DOMAIN);
  try {
    const response = await axios.post(
      `${jenkinsUrl}?token=domain&DOMAIN_NAME=${DOMAIN_NAME}`,
      null,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${JENKINS_USER}:${JENKINS_PASSWORD}`).toString("base64")}`,
        },
        timeout: 30000,
      },
    );

    if (response.status !== 201 && response.status !== 200) {
      console.error(
        "Jenkins delete job trigger failed:",
        response.status,
        response.statusText,
      );
      return {
        success: false,
        message: `Failed to trigger Jenkins delete job: ${response.statusText}`,
        status: response.status,
      };
    }

    const queueUrl = response.headers.location;
    const queueId = queueUrl.split("/").slice(-2, -1)[0];
    let buildNumber = null;

    while (!buildNumber) {
      const queueResponse = await axios.get(jenkinsQueueItemUrl(queueId), {
        auth: {
          username: JENKINS_USER,
          password: JENKINS_PASSWORD,
        },
      });

      const queueData = queueResponse.data;
      if (queueData.executable) {
        buildNumber = queueData.executable.number;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    let buildComplete = false;
    let artifactFilePath = null;
    let artifactData = null;

    while (!buildComplete) {
      const buildResponse = await axios.get(
        jenkinsBuildApiUrl(JOB_DELETE_DOMAIN, buildNumber),
        {
          auth: {
            username: JENKINS_USER,
            password: JENKINS_PASSWORD,
          },
        },
      );

      const buildData = buildResponse.data;

      if (!buildData.building) {
        buildComplete = true;

        if (buildData.result !== "SUCCESS") {
          return {
            success: false,
            message: `Delete job failed with result: ${buildData.result}`,
            buildNumber: buildNumber,
            result: buildData.result,
          };
        }

        if (buildData.artifacts && buildData.artifacts.length > 0) {
          artifactFilePath = buildData.artifacts[0].relativePath;
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    if (artifactFilePath) {
      try {
        const domainOutput = await axios.get(
          jenkinsArtifactUrl(JOB_DELETE_DOMAIN, buildNumber, artifactFilePath),
          {
            auth: {
              username: JENKINS_USER,
              password: JENKINS_PASSWORD,
            },
          },
        );
        if (domainOutput.data.error) {
          return {
            success: false,
            message: domainOutput.data.error,
            buildNumber: buildNumber,
            artifactPath: artifactFilePath,
          };
        }

        artifactData = domainOutput.data;
      } catch (artifactError) {
        console.warn(
          "⚠️ Warning: Failed to parse artifact output",
          artifactError?.message || artifactError,
        );
      }
    }

    return {
      success: true,
      message: "Domain deletion completed successfully",
      jobUrl: jenkinsUrl,
      buildNumber: buildNumber,
      result: "SUCCESS",
      artifactData: artifactData,
      artifactPath: artifactFilePath,
    };
  } catch (error) {
    console.error("Error triggering Jenkins delete job:", error);
    if (error.response) {
      return {
        success: false,
        message: `Jenkins delete job failed: ${error.response.status} - ${error.response.statusText}`,
        status: error.response.status,
      };
    }
    return {
      success: false,
      message: error.message || "Internal error while running Jenkins delete job",
    };
  }
}
