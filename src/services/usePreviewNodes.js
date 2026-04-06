import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import {
  invalidateAndRefetchActive,
  queryKeyPart,
} from "../utils/invalidateQueries";

/** Deployable preview nodes: env overrides, build history, Jenkins deploy path (DB role may be frontend or api_service). */
const PREVIEW_NODES_PATH = "preview-nodes";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const previewNodesClient = {
  getAll: () => api.get(PREVIEW_NODES_PATH),
  getById: (id) => api.get(`${PREVIEW_NODES_PATH}/${id}`),
  getByProjectId: (projectId) =>
    api.get(`${PREVIEW_NODES_PATH}/project/${projectId}`),
  create: (data) => api.post(PREVIEW_NODES_PATH, { data }),
  update: (id, data) => api.put(`${PREVIEW_NODES_PATH}/${id}`, data),
  deleteAll: () => api.delete(PREVIEW_NODES_PATH),
  deleteById: (id) => api.delete(`${PREVIEW_NODES_PATH}/${id}`),
  listEnvVars: (nodeId, profileId = null) =>
    api.get(`${PREVIEW_NODES_PATH}/${nodeId}/env-vars`, {
      params:
        profileId != null && profileId !== ""
          ? { profileId }
          : undefined,
    }),
  addEnvVar: (nodeId, key, value, profileId = null) =>
    api.post(`${PREVIEW_NODES_PATH}/${nodeId}/env-vars`, {
      key,
      value,
      ...(profileId != null ? { profileId } : {}),
    }),
  updateEnvVar: (nodeId, key, value, profileId = null) =>
    api.put(
      `${PREVIEW_NODES_PATH}/${nodeId}/env-vars/${encodeURIComponent(key)}`,
      { value },
      {
        params:
          profileId != null && profileId !== ""
            ? { profileId }
            : undefined,
      },
    ),
  deleteEnvVar: (nodeId, key, profileId = null) =>
    api.delete(
      `${PREVIEW_NODES_PATH}/${nodeId}/env-vars/${encodeURIComponent(key)}`,
      {
        params:
          profileId != null && profileId !== ""
            ? { profileId }
            : undefined,
      },
    ),
};

/**
 * Any preview row by primary key (unified shape from GET /api/node/:id).
 */
export function usePreviewNode(id, options = {}) {
  const { message } = App.useApp();
  const idKey = queryKeyPart(id);
  return useQuery({
    queryKey: ["previewNode", idKey],
    queryFn: async () => {
      const res = await api.get(`node/${id}`);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: options.enabled !== undefined ? options.enabled : Boolean(id),
    onError: (error) => {
      console.error("Error fetching node:", error);
      message.error("Failed to load node");
    },
  });
}

export const usePreviewNodesCatalog = () => {
  return useQuery({
    queryKey: ["previewNodesCatalog"],
    queryFn: () => previewNodesClient.getAll(),
  });
};

export const usePreviewNodesByProjectId = (projectId) => {
  const { message } = App.useApp();
  const projectKey = queryKeyPart(projectId);
  return useQuery({
    queryKey: ["previewNodesByProject", projectKey],
    queryFn: () => previewNodesClient.getByProjectId(projectId),
    enabled: projectKey != null && projectKey !== "",
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      console.error("Error fetching services:", error);
      message.error("Failed to load services");
    },
  });
};

export const useCreatePreviewNode = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: previewNodesClient.create,
    onSuccess: async (_res, variables) => {
      const projectId = variables?.project_id ?? variables?.data?.project_id;
      const pk = queryKeyPart(projectId);
      await invalidateAndRefetchActive(
        queryClient,
        ["previewNodesCatalog"],
        ["previewNodesByProject"],
        ...(pk != null ? [["previewNodesByProject", pk]] : []),
        ["previewServicesByProject"],
      );
      message.success("Service created");
    },
    onError: (error) => {
      console.error("Error creating service:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to create service";
      message.error(errorMessage);
    },
  });
};

export const useUpdatePreviewNode = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ id, data }) => previewNodesClient.update(id, data),
    onSuccess: async (_res, variables) => {
      const pid =
        variables?.data?.project_id ?? variables?.project_id ?? null;
      const pk = queryKeyPart(pid);
      const nid = queryKeyPart(variables?.id);
      await invalidateAndRefetchActive(
        queryClient,
        ["previewNodesCatalog"],
        ["previewNodesByProject"],
        ...(pk != null ? [["previewNodesByProject", pk]] : []),
        ...(nid != null
          ? [
              ["previewNode", nid],
              ["nodeBuildHistory", nid],
              ["previewServiceById", nid],
            ]
          : []),
        ["previewServicesByProject"],
      );
      message.success("Service updated");
    },
    onError: (error) => {
      console.error("Error updating node:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to update service";
      message.error(errorMessage);
    },
  });
};

export const useDeletePreviewNode = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (id) => previewNodesClient.deleteById(id),
    onSuccess: async (_data, id) => {
      const idK = queryKeyPart(id);
      if (idK != null) {
        queryClient.removeQueries({ queryKey: ["previewNode", idK] });
        queryClient.removeQueries({ queryKey: ["previewServiceById", idK] });
      }
      await invalidateAndRefetchActive(
        queryClient,
        ["previewNodesCatalog"],
        ["previewNodesByProject"],
        ["previewServicesByProject"],
        ["previewServicesCatalog"],
      );
      message.success("Service removed");
    },
    onError: (error) => {
      console.error("Error deleting node:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to remove service";
      message.error(errorMessage);
    },
  });
};

export const useDeleteAllPreviewNodes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => previewNodesClient.deleteAll(),
    onSuccess: async () => {
      await invalidateAndRefetchActive(
        queryClient,
        ["previewNodesCatalog"],
        ["previewNodesByProject"],
        ["previewServicesByProject"],
      );
    },
  });
};
