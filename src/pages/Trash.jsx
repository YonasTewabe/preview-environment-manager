import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App, Button, Input, Popconfirm, Space, Table, Tabs, Tag } from "antd";
import { projectService } from "../services/projectService";

const Trash = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const [nodeSearchText, setNodeSearchText] = useState("");

  const {
    data: trashedProjects = [],
    isLoading: projectsLoading,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ["trash", "projects"],
    queryFn: projectService.getTrashedProjects,
  });

  const {
    data: trashedNodes = [],
    isLoading: nodesLoading,
    refetch: refetchNodes,
  } = useQuery({
    queryKey: ["trash", "nodes"],
    queryFn: projectService.getTrashedNodes,
  });

  const restoreProjectMutation = useMutation({
    mutationFn: (id) => projectService.restoreProject(id),
    onSuccess: async () => {
      message.success("Project restored");
      await Promise.all([
        refetchProjects(),
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
      ]);
    },
  });

  const permanentDeleteProjectMutation = useMutation({
    mutationFn: (id) => projectService.permanentlyDeleteProject(id),
    onSuccess: async () => {
      message.success("Project permanently deleted");
      await Promise.all([
        refetchProjects(),
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
      ]);
    },
  });

  const restoreNodeMutation = useMutation({
    mutationFn: (id) => projectService.restoreNode(id),
    onSuccess: async () => {
      message.success("Node restored");
      await Promise.all([
        refetchNodes(),
        queryClient.invalidateQueries({ queryKey: ["previewNodesByProject"] }),
        queryClient.invalidateQueries({
          queryKey: ["previewServicesByProject"],
        }),
      ]);
    },
  });

  const permanentDeleteNodeMutation = useMutation({
    mutationFn: (id) => projectService.permanentlyDeleteNode(id),
    onSuccess: async () => {
      message.success("Node permanently deleted");
      await Promise.all([
        refetchNodes(),
        queryClient.invalidateQueries({ queryKey: ["previewNodesByProject"] }),
        queryClient.invalidateQueries({
          queryKey: ["previewServicesByProject"],
        }),
      ]);
    },
  });

  const projectColumns = useMemo(
    () => [
      { title: "Project", dataIndex: "name", key: "name" },
      { title: "Short code", dataIndex: "short_code", key: "short_code" },
      {
        title: "Repository",
        dataIndex: "repository_url",
        key: "repository_url",
      },
      {
        title: "Actions",
        key: "actions",
        render: (_, row) => (
          <Space>
            <Button
              onClick={() => restoreProjectMutation.mutate(row.id)}
              loading={restoreProjectMutation.isPending}
            >
              Restore
            </Button>
            <Popconfirm
              title="Permanently delete this project?"
              description="This cannot be undone."
              okText="Delete permanently"
              okButtonProps={{ danger: true }}
              onConfirm={() => permanentDeleteProjectMutation.mutate(row.id)}
            >
              <Button danger loading={permanentDeleteProjectMutation.isPending}>
                Delete permanently
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [permanentDeleteProjectMutation, restoreProjectMutation],
  );

  const nodeColumns = useMemo(
    () => [
      {
        title: "Project Name",
        key: "project_name",
        render: (_, row) => row.project?.name || "-",
      },
      { title: "Node Name", dataIndex: "service_name", key: "service_name" },
      {
        title: "Node Branch",
        dataIndex: "branch_name",
        key: "branch_name",
        render: (value) => value || "-",
      },
      {
        title: "Type",
        dataIndex: "role",
        key: "role",
        render: (value) => <Tag>{value}</Tag>,
      },
      {
        title: "Actions",
        key: "actions",
        render: (_, row) => (
          <Space>
            <Button
              onClick={() => restoreNodeMutation.mutate(row.id)}
              loading={restoreNodeMutation.isPending}
            >
              Restore
            </Button>
            <Popconfirm
              title="Permanently delete this node?"
              description="This cannot be undone."
              okText="Delete permanently"
              okButtonProps={{ danger: true }}
              onConfirm={() => permanentDeleteNodeMutation.mutate(row.id)}
            >
              <Button danger loading={permanentDeleteNodeMutation.isPending}>
                Delete permanently
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [permanentDeleteNodeMutation, restoreNodeMutation],
  );

  const filteredNodes = useMemo(() => {
    const q = nodeSearchText.trim().toLowerCase();
    if (!q) return trashedNodes;
    return trashedNodes.filter((row) => {
      const nodeName = String(row.service_name || "").toLowerCase();
      const branchName = String(row.branch_name || "").toLowerCase();
      return nodeName.includes(q) || branchName.includes(q);
    });
  }, [trashedNodes, nodeSearchText]);

  return (
    <div className="space-y-6 text-black dark:text-white">
      <div className="mb-2">
        <h2 className="mb-0 text-3xl font-bold text-blue-900 dark:text-blue-400">
          Trash
        </h2>
        <p className="font-bold text-gray-700 dark:text-gray-300">
          Restore deleted items or remove them permanently
        </p>
      </div>

      <Tabs
        defaultActiveKey="projects"
        items={[
          {
            key: "projects",
            label: `Projects (${trashedProjects.length})`,
            children: (
              <Table
                rowKey="id"
                dataSource={trashedProjects}
                columns={projectColumns}
                loading={projectsLoading}
                pagination={{ pageSize: 10 }}
              />
            ),
          },
          {
            key: "nodes",
            label: `Nodes (${trashedNodes.length})`,
            children: (
              <div className="space-y-3">
                <Space wrap>
                  <Input
                    allowClear
                    value={nodeSearchText}
                    onChange={(e) => setNodeSearchText(e.target.value)}
                    placeholder="Search node name or branch"
                    style={{ width: 320, maxWidth: "100%" }}
                  />
                </Space>
                <Table
                  rowKey="id"
                  dataSource={filteredNodes}
                  columns={nodeColumns}
                  loading={nodesLoading}
                  pagination={{ pageSize: 10 }}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default Trash;
