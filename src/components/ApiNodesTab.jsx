"use client";
import { useState } from "react";
import { Space, Button, message, Spin, Empty, Form } from "antd";
import { PlusOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import {
  useCreatePreviewService,
  useDeletePreviewService,
  usePreviewServicesByProjectId,
  useUpdatePreviewService,
} from "../services/usePreviewServices";
import { useGitHub } from "../hooks/useGitHub";
import { useAuth } from "../contexts/AuthContext";
import ServiceNodeModal from "./ServiceNodeModal";
import ApiBranchesPanel from "./ApiBranchesPanel";
import { useParams, useNavigate } from "react-router-dom";
import { projectDefaultEnvReady } from "../utils/projectDefaultEnvReady";

export default function ApiNodesTab({
  project: projectProp,
  githubBranches: githubBranchesProp,
  loadingGithubBranches: loadingGithubBranchesProp,
  detailServiceId: detailServiceIdProp,
} = {}) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [form] = Form.useForm();
  const { id: idFromRoute } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const createdBy = String(user?.id ?? "").trim();
  const projectId = projectProp?.id ?? idFromRoute;
  const project = projectProp;

  const { data: serviceNodes = [], isLoading: loadingServices } =
    usePreviewServicesByProjectId(projectId);
  const createServiceNode = useCreatePreviewService();
  const updateServiceNode = useUpdatePreviewService();
  const isSavingServiceNode =
    createServiceNode.isPending || updateServiceNode.isPending;
  const deleteServiceNode = useDeletePreviewService();

  const githubHook = useGitHub();
  const githubBranches =
    githubBranchesProp ?? githubHook.githubBranches;
  const loadingGithubBranches =
    loadingGithubBranchesProp ?? githubHook.loadingGithubBranches;

  const detailServiceId = String(detailServiceIdProp ?? "").trim() || null;
  const servicesArray = Array.isArray(serviceNodes?.data)
    ? serviceNodes.data
    : [];
  const displayServices =
    detailServiceId != null
      ? servicesArray.filter((s) => String(s.id) === detailServiceId)
      : servicesArray;

  const handleAddServiceClick = () => {
    if (project && !projectDefaultEnvReady(project)) {
      message.warning(
        "Set this project's environments before adding services.",
      );
      navigate(`/projects/${project.id}/environments`);
      return;
    }
    setEditingService(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditServiceClick = (service) => {
    setEditingService(service);
    form.resetFields();
    form.setFieldsValue({
      service_name: service.service_name,
      branch_name:
        service.branch_name || service.branches?.[0]?.name || undefined,
    });
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleServiceNodeSubmit = () => {
    form.validateFields().then(async (values) => {
      if (!createdBy) {
        message.error("Session is stale. Please log in again.");
        return;
      }
      const name = String(values.service_name ?? "").trim();
      const branch = String(values.branch_name ?? "").trim() || "main";

      if (!project?.repository_url || !projectDefaultEnvReady(project)) {
        message.warning(
          "This project is missing a repository URL or default environment variables.",
        );
        return;
      }

      const repoSlug = project.repository_url.split("/").slice(4).join("/");

      const selfId = editingService?.id;
      const lc = (s) => String(s ?? "").trim().toLowerCase();
      const dupName = servicesArray.find(
        (s) =>
          lc(s.service_name) === lc(name) &&
          (!selfId || String(s.id) !== String(selfId)),
      );
      if (dupName) {
        message.error(
          `Service name "${name}" already exists. Choose a different name.`,
        );
        return;
      }
      const dupBranch = servicesArray.find(
        (s) =>
          lc(s.branch_name) === lc(branch) &&
          (!selfId || String(s.id) !== String(selfId)),
      );
      if (dupBranch) {
        message.error(
          `Branch "${branch}" is already used by another node in this project.`,
        );
        return;
      }

      try {
        if (editingService) {
          await updateServiceNode.mutateAsync({
            id: editingService.id,
            data: { service_name: name, branch_name: branch },
          });
        } else {
          await createServiceNode.mutateAsync({
            service_name: name,
            branch_name: branch,
            repository_name: repoSlug || name,
            repo_url: project.repository_url,
            env_name: project.env_name,
            project_env_profile_id: project.env_profiles?.find((p) => p.is_default)
              ?.id,
            default_url: project.repository_url,
            type: "api",
            description: null,
            project_id: projectId,
            created_by: createdBy,
          });
        }
        setIsModalVisible(false);
        form.resetFields();
      } catch (error) {
        console.error("Error saving service:", error);
      }
    });
  };

  const handleDeleteService = async (serviceId) => {
    try {
      await deleteServiceNode.mutateAsync(serviceId);
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  return (
    <div>
      {detailServiceIdProp != null && detailServiceIdProp !== "" ? (
        <div style={{ marginBottom: "16px" }}>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() =>
              project?.id && navigate(`/projects/${project.id}`)
            }
            className="!font-semibold !text-lg"
          >
            Back to project
          </Button>
        </div>
      ) : (
        <div style={{ marginBottom: "16px" }}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddServiceClick}
              style={{
                backgroundColor: "#3b82f6",
                borderColor: "#3b82f6",
              }}
            >
              Add Node
            </Button>
          </Space>
        </div>
      )}

      {loadingServices ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
          }}
        >
          <Spin size="large" tip="Loading services..." />
        </div>
      ) : detailServiceId != null &&
        displayServices.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#64748b",
          }}
        >
          <Empty description="This node was not found in this project." />
        </div>
      ) : displayServices.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#64748b",
          }}
        >
          <Empty description='No services yet. Use "Add service" to create one.' />
        </div>
      ) : (
        <ApiBranchesPanel
          project={project}
          servicesArray={displayServices}
          isLoading={false}
          githubBranches={githubBranches}
          loadingGithubBranches={loadingGithubBranches}
          onEditService={handleEditServiceClick}
          onDeleteService={handleDeleteService}
          serviceNodeId={displayServices[0]?.id}
          projectId={project?.id ?? projectId}
        />
      )}

      <ServiceNodeModal
        open={isModalVisible}
        onCancel={handleModalCancel}
        onSubmit={handleServiceNodeSubmit}
        form={form}
        editingItem={editingService}
        githubBranches={githubBranches}
        loadingGithubBranches={loadingGithubBranches}
        submitLoading={isSavingServiceNode}
      />
    </div>
  );
}
