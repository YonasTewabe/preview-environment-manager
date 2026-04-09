"use client";

import { useState, useEffect } from "react";
import { message, Form, Spin, Empty } from "antd";
import {
  useDeleteBranch,
  useCreateBranch,
  useUpdateBranch,
} from "../services/usePreviewServices";
import { useJenkins } from "../hooks/useJenkins";
import { useGitHub } from "../hooks/useGitHub";
import { jenkinsJobFolderUrl, JENKINS_JOB_PREVIEW } from "../config/jenkins";
import BranchModal from "./BranchModal";
import { jenkinsPreviewTag } from "../utils/projectServiceKind";
import BuildProgressModal from "./BuildProgressModal";
import ServiceAccordion from "./ServiceAccordion";
import { useQueryClient } from "@tanstack/react-query";
import {
  invalidateAndRefetchActive,
  queryKeyPart,
} from "../utils/invalidateQueries";

export default function ApiBranchesPanel({
  project,
  servicesArray,
  isLoading,
  githubBranches: githubBranchesProp,
  loadingGithubBranches: loadingGithubBranchesProp,
  onEditService,
  onDeleteService,
  backendNodeId,
  projectId,
}) {
  const [isBranchModalVisible, setIsBranchModalVisible] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [branchForm] = Form.useForm();
  const queryClient = useQueryClient();

  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();

  const {
    isBuildModalVisible,
    buildProgress,
    getBuildArtifacts,
    triggerJenkinsBuild,
    handleBuildModalCancel,
  } = useJenkins();

  const githubHook = useGitHub();
  const githubBranches = githubBranchesProp ?? githubHook.githubBranches;
  const loadingGithubBranches =
    loadingGithubBranchesProp ?? githubHook.loadingGithubBranches;
  const { fetchGithubBranches } = githubHook;

  useEffect(() => {
    if (githubBranchesProp !== undefined) return;
    if (!project?.id || !project?.repository_url) return;
    const slug = project.repository_url.split("/").slice(4).join("/");
    if (!slug) return;
    void fetchGithubBranches(project.repository_url, slug);
  }, [
    githubBranchesProp,
    project?.id,
    project?.repository_url,
    fetchGithubBranches,
  ]);

  const invalidateBackendData = () => {
    const nodeKey = queryKeyPart(backendNodeId);
    const projectKey = queryKeyPart(projectId);
    return invalidateAndRefetchActive(
      queryClient,
      ...(nodeKey != null
        ? [
            ["previewServiceById", nodeKey],
            ["previewNode", nodeKey],
            ["nodeBuildHistory", nodeKey],
          ]
        : []),
      ...(projectKey != null ? [["previewServicesByProject", projectKey]] : []),
      ["previewServicesByProject"],
      ["previewServicesCatalog"],
      ["previewNodesByProject"],
    );
  };

  const handleAddBranchClick = (serviceId) => {
    setSelectedServiceId(serviceId);
    branchForm.resetFields();
    setIsBranchModalVisible(true);
    const selectedService = servicesArray.find(
      (service) => service.id === serviceId,
    );
    if (selectedService?.repository_name) {
      fetchGithubBranches(selectedService.repository_name);
    }
  };

  const handleBranchModalOk = () => {
    branchForm.validateFields().then(async (values) => {
      try {
        const selectedService = servicesArray.find(
          (service) => service.id === selectedServiceId,
        );

        if (!selectedService) {
          message.error("Selected service not found");
          return;
        }

        const existingBranch = selectedService.branches?.find(
          (branch) => branch.name === values.name,
        );
        if (existingBranch) {
          message.error(
            `Branch "${values.name}" already exists for this service. Please choose a different branch.`,
          );
          return;
        }

        let branchNumber = values.name.match(/\d+/)?.[0];
        if (!branchNumber) {
          branchNumber = Math.floor(1000 + Math.random() * 9000);
        }
        const domainName = `${selectedService?.project?.short_code}-${branchNumber}-${selectedService?.id}`;
        const existingDomain = selectedService.branches?.find(
          (branch) => branch.domainName === domainName,
        );
        if (existingDomain) {
          message.error(
            `Domain "${domainName}" already exists. Please choose a different branch name.`,
          );
          return;
        }

        const previewJobFolder = jenkinsJobFolderUrl(JENKINS_JOB_PREVIEW);
        const jenkinsParams = {
          TAG: jenkinsPreviewTag(selectedService?.project?.tag),
          REPO_URL: selectedService.repo_url,
          BRANCH_NAME: values.name,
          PORT: Math.floor(Math.random() * (8000 - 7000 + 1)) + 7000,
          DOMAIN_NAME: domainName,
          ENV_JSON: [],
        };

        const initialBranchData = {
          name: values.name,
          description: values.description,
          status: "active",
          domain_name: domainName,
          port: jenkinsParams.PORT,
          node_id: selectedServiceId,
          created_by: 1,
          build_result: "pending",
          jenkins_job_url: previewJobFolder,
        };

        let createdBranch;
        try {
          createdBranch = await createBranch.mutateAsync(initialBranchData);
          message.success(`Branch "${values.name}" created and build started`);
        } catch (branchError) {
          console.error("Error creating branch record:", branchError);
          message.error(
            "Failed to create branch record. Build will not be tracked.",
          );
          return;
        }

        await triggerJenkinsBuild(
          jenkinsParams,
          async (jenkinsData) => {
            try {
              const updateData = {
                build_number:
                  jenkinsData.jenkinsBuildNumber ?? jenkinsData.buildNumber,
                build_result: jenkinsData.result || "success",
                preview_link: jenkinsData.artifactData?.url,
                jenkins_job_url: jenkinsData.jobUrl || previewJobFolder,
              };
              await updateBranch.mutateAsync({
                id: createdBranch.id,
                data: updateData,
              });
              message.success(
                `Branch "${values.name}" build completed successfully`,
              );
            } catch (updateError) {
              console.error(
                "Error updating branch with success data:",
                updateError,
              );
              message.warning(
                "Branch created but failed to update build status",
              );
            }
            invalidateBackendData();
          },
          async () => {
            try {
              const updateData = {
                build_result: "failed",
                jenkins_job_url: previewJobFolder,
              };
              await updateBranch.mutateAsync({
                id: createdBranch.id,
                data: updateData,
              });
              message.error(`Branch "${values.name}" build failed`);
            } catch (updateError) {
              console.error(
                "Error updating branch with failure data:",
                updateError,
              );
              message.warning(
                "Branch created but failed to update build status",
              );
            }
            invalidateBackendData();
          },
        );

        setIsBranchModalVisible(false);
        branchForm.resetFields();
        invalidateBackendData();
      } catch (error) {
        console.error("Error creating branch:", error);
        message.error("Failed to create branch");
      }
    });
  };

  const handleBranchModalCancel = () => {
    setIsBranchModalVisible(false);
    branchForm.resetFields();
  };

  const handleDeleteBranch = async (serviceId, branchId) => {
    try {
      const selectedService = servicesArray.find(
        (service) => service.id === serviceId,
      );
      const branch = selectedService?.branches?.find((b) => b.id === branchId);

      if (!branch || !branch.domain_name) {
        message.error("Branch or domain name not found");
        return;
      }

      message.success(`Branch "${branch.name}" deleted from database`);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}jenkins/delete-preview-job`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              DOMAIN_NAME: branch.domain_name,
            }),
          },
        );

        const result = await response.json();

        if (result.success) {
          message.success(
            `Domain "${branch.domain_name}" deleted successfully from Jenkins`,
          );
          await deleteBranch.mutateAsync(branchId);
        } else {
          message.warning(
            `Branch deleted from database but failed to delete domain: ${result.message}`,
          );
          await deleteBranch.mutateAsync(branchId);
        }
      } catch (jenkinsError) {
        console.error("Jenkins deletion error:", jenkinsError);
        message.warning(
          `Branch deleted from database but failed to delete domain.`,
        );
        await deleteBranch.mutateAsync(branchId);
      }
      invalidateBackendData();
    } catch (error) {
      console.error("Error deleting branch:", error);
      message.error("Failed to delete branch");
    }
  };

  const handleRebuildBranch = async (serviceId, branchId, branchName) => {
    try {
      const selectedService = servicesArray.find(
        (service) => service.id === serviceId,
      );
      const branch = selectedService?.branches?.find((b) => b.id === branchId);

      if (!branch || !selectedService) {
        message.error("Branch or service not found");
        return;
      }

      await updateBranch.mutateAsync({
        id: branchId,
        data: {
          build_result: "pending",
        },
      });

      const previewJobFolder = jenkinsJobFolderUrl(JENKINS_JOB_PREVIEW);
      const jenkinsParams = {
        TAG: jenkinsPreviewTag(selectedService?.project?.tag),
        REPO_URL: selectedService.repo_url,
        BRANCH_NAME: branch.name,
        PORT:
          branch.port || Math.floor(Math.random() * (8000 - 7000 + 1)) + 7000,
        DOMAIN_NAME: branch.domain_name,
        ENV_JSON: [],
      };

      await triggerJenkinsBuild(
        jenkinsParams,
        async (jenkinsData) => {
          try {
            const updateData = {
              build_number:
                jenkinsData.jenkinsBuildNumber ?? jenkinsData.buildNumber,
              build_result: jenkinsData.result || "success",
              preview_link: jenkinsData.artifactData?.url,
              jenkins_job_url: jenkinsData.jobUrl || previewJobFolder,
            };
            await updateBranch.mutateAsync({
              id: branchId,
              data: updateData,
            });
            message.success(
              `Branch "${branchName}" rebuild completed successfully`,
            );
          } catch (updateError) {
            console.error(
              "Error updating branch with success data:",
              updateError,
            );
            message.warning(
              "Branch rebuild completed but failed to update build status",
            );
          }
          invalidateBackendData();
        },
        async () => {
          try {
            const updateData = {
              build_result: "failed",
              jenkins_job_url: previewJobFolder,
            };
            await updateBranch.mutateAsync({
              id: branchId,
              data: updateData,
            });
            message.error(`Branch "${branchName}" rebuild failed`);
          } catch (updateError) {
            console.error(
              "Error updating branch with failure data:",
              updateError,
            );
            message.warning(
              "Branch rebuild failed but failed to update build status",
            );
          }
          invalidateBackendData();
        },
      );

      message.success(`Rebuild started for branch "${branchName}"`);
      invalidateBackendData();
    } catch (error) {
      console.error("Error starting rebuild:", error);
      message.error("Failed to start rebuild");
    }
  };

  const getServiceTypeColor = (type) => {
    const colors = {
      api: "blue",
      database: "purple",
      cache: "orange",
      queue: "red",
      auth: "green",
      storage: "cyan",
    };
    return colors[type] || "default";
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 280,
        }}
      >
        <Spin size="large" tip="Loading branches…" />
      </div>
    );
  }

  if (!servicesArray?.length) {
    return <Empty description="No service data for branch management." />;
  }

  return (
    <>
      <ServiceAccordion
        backendServices={servicesArray}
        onEditService={onEditService}
        onDeleteService={onDeleteService}
        onAddBranch={handleAddBranchClick}
        onDeleteBranch={handleDeleteBranch}
        onGetBuildArtifacts={getBuildArtifacts}
        onRebuildBranch={handleRebuildBranch}
        getServiceTypeColor={getServiceTypeColor}
      />

      <BranchModal
        isVisible={isBranchModalVisible}
        onOk={handleBranchModalOk}
        onCancel={handleBranchModalCancel}
        form={branchForm}
        githubBranches={githubBranches}
        loadingGithubBranches={loadingGithubBranches}
      />

      <BuildProgressModal
        isVisible={isBuildModalVisible}
        buildProgress={buildProgress}
        onCancel={handleBuildModalCancel}
      />
    </>
  );
}
