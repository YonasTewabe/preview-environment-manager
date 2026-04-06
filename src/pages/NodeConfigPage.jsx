"use client";

import { useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Spin } from "antd";
import { projectService } from "../services/projectService";
import NodeConfigView from "./NodeConfigView";

export default function NodeConfigPage() {
  const { projectId, nodeId } = useParams();

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectService.getProjectById(projectId),
    enabled: !!projectId,
  });

  if (!projectId || !nodeId) {
    return <Navigate to="/projects" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !project) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <NodeConfigView
      routeProjectId={projectId}
      routeNodeId={nodeId}
      project={project}
    />
  );
}
