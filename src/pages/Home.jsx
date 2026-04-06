"use client";
import { useState, useEffect, useMemo } from "react";
import { Card, Layout, Button, Form, message, Empty } from "antd";
import { useNavigate } from "react-router-dom";
import WebNodesList from "../components/WebNodesList";
import ServiceNodeModal from "../components/ServiceNodeModal";
import {
  useCreatePreviewNode,
  useDeletePreviewNode,
  usePreviewNodesByProjectId,
  useUpdatePreviewNode,
} from "../services/usePreviewNodes";
import {
  useCreatePreviewService,
  useDeletePreviewService,
  usePreviewServicesByProjectId,
  useUpdatePreviewService,
} from "../services/usePreviewServices";
import { useAuth } from "../contexts/AuthContext";
import { useGitHub } from "../hooks/useGitHub";
import { isApiPreviewProject } from "../utils/projectServiceKind";
import { nodeHasCompletedBuild } from "../utils/nodeHasCompletedBuild";
import { projectDefaultEnvReady } from "../utils/projectDefaultEnvReady";

const { Content } = Layout;

function buildFrontendNodeUpdatePayload(node, serviceName) {
  return {
    service_name: serviceName,
    repository_name: node.repository_name,
    jenkins_job: node.jenkins_job,
    build_status: node.build_status,
    build_number: node.build_number,
    build_url: node.build_url,
    branch_name: node.branch_name,
    domain_name: node.domain_name,
    port: node.port,
    repo_url: node.repo_url,
    preview_link: node.preview_link,
    env_name: node.env_name,
    project_id: node.project_id,
  };
}

export default function Home({ project }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const { user } = useAuth();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const createdBy = Number.parseInt(user?.id, 10);
  const isApi = isApiPreviewProject(project?.tag);

  const { githubBranches, loadingGithubBranches, fetchGithubBranches } =
    useGitHub();

  const { data: frontendNodes, isLoading: isLoadingFrontendNodes } =
    usePreviewNodesByProjectId(!isApi ? project?.id : undefined);
  const {
    data: backendAxios,
    isLoading: isLoadingBackendNodes,
  } = usePreviewServicesByProjectId(isApi ? project?.id : undefined);

  const {
    mutate: createFrontendNodes,
    isPending: isCreatingFe,
  } = useCreatePreviewNode();
  const {
    mutate: updateFrontendNodes,
    isPending: isUpdatingFe,
  } = useUpdatePreviewNode();
  const { mutate: deleteFrontendNodes } = useDeletePreviewNode();

  const createBackendNode = useCreatePreviewService();
  const updateBackendNode = useUpdatePreviewService();
  const deleteBackendNode = useDeletePreviewService();
  const isSavingBe =
    createBackendNode.isPending || updateBackendNode.isPending;

  const backendRows = useMemo(() => {
    const raw = backendAxios?.data;
    if (!Array.isArray(raw)) return [];
    return raw.map((s) => ({
      ...s,
      branch_name: s.branch_name || s.branches?.[0]?.name || undefined,
    }));
  }, [backendAxios?.data]);

  const listForUi = useMemo(() => {
    if (isApi) return { data: backendRows };
    return frontendNodes;
  }, [isApi, backendRows, frontendNodes]);

  const listLoading = isApi ? isLoadingBackendNodes : isLoadingFrontendNodes;

  const repoUrl = project?.repository_url
    ? project.repository_url.split("/").slice(4).join("/")
    : "";

  useEffect(() => {
    if (project?.repository_url && repoUrl) {
      fetchGithubBranches(project.repository_url, repoUrl);
    }
  }, [project?.repository_url, repoUrl]);

  const handleAddNode = () => {
    if (!projectDefaultEnvReady(project)) {
      message.warning(
        "Set this project's environments before adding services.",
      );
      navigate(`/projects/${project.id}/environments`);
      return;
    }
    setEditingNode(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditNode = (node) => {
    setEditingNode(node);
    form.resetFields();
    form.setFieldsValue({
      service_name: node.service_name,
      branch_name: node.branch_name,
    });
    setIsModalVisible(true);
  };

  const handleDeleteNode = async (node) => {
    if (!node?.id) return;
    const shouldRemoveFromJenkins =
      nodeHasCompletedBuild(node) && Boolean(node.domain_name);
    if (shouldRemoveFromJenkins) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}jenkins/delete-preview-job`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ DOMAIN_NAME: node.domain_name }),
          },
        );
        const result = await response.json();
        if (!result.success) {
          message.warning(
            result.message || "Jenkins domain cleanup may have failed",
          );
        }
      } catch {
        message.warning(
          "Could not reach Jenkins to delete preview domain; removing service from the database.",
        );
      }
    }
    try {
      if (isApi) {
        await deleteBackendMutation.mutateAsync(node.id);
      } else {
        await deleteFrontendNodeAsync(node.id);
      }
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message;
      if (msg) message.error(msg);
    }
  };

  const handleModalOk = () => {
    form.validateFields().then(async (values) => {
      const name = String(values.service_name ?? "").trim();
      const branch = String(values.branch_name ?? "").trim() || "main";

      if (isApi) {
        const pid = Number(project?.id);
        if (!project?.repository_url || !projectDefaultEnvReady(project)) {
          message.warning(
            "This project is missing a repository URL or default environment variables.",
          );
          return;
        }
        const repoSlug = project.repository_url.split("/").slice(4).join("/");
        try {
          if (editingNode) {
            await updateBackendNode.mutateAsync({
              id: editingNode.id,
              data: { service_name: name },
            });
          } else {
            const dup = backendRows.find((s) => s.service_name === name);
            if (dup) {
              message.error(
                `Service name "${name}" already exists. Choose a different name.`,
              );
              return;
            }
            const defaultProf = project.env_profiles?.find((p) => p.is_default);
            await createBackendNode.mutateAsync({
              service_name: name,
              branch_name: branch,
              repository_name: repoSlug || name,
              repo_url: project.repository_url,
              env_name: project.env_name,
              project_env_profile_id: defaultProf?.id,
              default_url: project.repository_url,
              type: "api",
              description: null,
              project_id: Number.isFinite(pid) ? pid : project.id,
              created_by: Number.isFinite(createdBy) ? createdBy : 1,
            });
          }
          setIsModalVisible(false);
          form.resetFields();
        } catch (e) {
          console.error(e);
        }
        return;
      }

      if (editingNode) {
        const payload = buildFrontendNodeUpdatePayload(editingNode, name);
        updateFrontendNodes(
          {
            id: editingNode.id,
            data: payload,
          },
          {
            onSuccess: () => {
              setIsModalVisible(false);
              form.resetFields();
            },
            onError: (error) => {
              message.error(
                error.response?.data?.message ||
                  error.response?.data?.error ||
                  "Update failed",
              );
            },
          },
        );
      } else {
        createFrontendNodes(
          {
            type: "api",
            repository_name: project.repository_url,
            repo_url: project.repository_url,
            env_name: project.env_name,
            project_env_profile_id: project.env_profiles?.find((p) => p.is_default)
              ?.id,
            description: null,
            service_name: name,
            project_id: project.id,
            branch_name: branch,
            created_by: Number.isFinite(createdBy) ? createdBy : 1,
          },
          {
            onSuccess: () => {
              setIsModalVisible(false);
              form.resetFields();
            },
            onError: (error) => {
              message.error(
                error.response?.data?.message ||
                  error.response?.data?.error ||
                  "Create failed",
              );
            },
          },
        );
      }
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleNodeClick = (node) => {
    navigate(`/projects/${project.id}/nodes/${node.id}`);
  };

  if (!project?.id) {
    return (
      <Content style={{ padding: 24 }}>
        <Card>
          <Empty description="Open a project from the Projects page to manage its services.">
            <Button type="primary" onClick={() => navigate("/projects")}>
              Go to projects
            </Button>
          </Empty>
        </Card>
      </Content>
    );
  }

  return (
    <div>
      <Content style={{ padding: "0px" }}>
        <Card
          bordered={false}
          className="dark:bg-black dark:border-gray-800"
          title={
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold">Nodes</span>
            </div>
          }
        >
          <WebNodesList
            frontendNodes={listForUi}
            isLoadingFrontendNodes={listLoading}
            onAddNode={handleAddNode}
            onEditNode={handleEditNode}
            onDeleteNode={handleDeleteNode}
            onNodeClick={handleNodeClick}
          />
        </Card>
      </Content>

      <ServiceNodeModal
        open={isModalVisible}
        onCancel={handleModalCancel}
        onSubmit={handleModalOk}
        form={form}
        editingItem={editingNode}
        githubBranches={githubBranches}
        loadingGithubBranches={loadingGithubBranches}
        submitLoading={
          isApi ? isSavingBe : isCreatingFe || isUpdatingFe
        }
      />
    </div>
  );
}
