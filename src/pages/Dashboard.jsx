import { useState, useEffect, useCallback } from "react";
import { Row, Col, Card, Tag, Typography } from "antd";
import {
  PauseCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
} from "@ant-design/icons";
import StatsCard from "../components/Dashboard/StatsCard";
import { useAuth } from "../contexts/AuthContext";
import projectService, { api } from "../services/projectService";
import { useTheme } from "../contexts/ThemeContext";

const { Title, Text } = Typography;

function normalizeBuildStatus(raw) {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (s === "success" || s === "successful") return "success";
  if (s === "failed" || s === "failure") return "failed";
  if (s === "building" || s === "in_progress" || s === "in progress")
    return "building";
  if (s === "cancelled" || s === "canceled" || s === "aborted")
    return "cancelled";
  if (!s) return "pending";
  return s;
}

function pickServices(payload) {
  if (!payload || typeof payload !== "object") return [];
  const list =
    payload.services ??
    payload.webServices ??
    payload.apiServices ??
    payload.backendServices ??
    payload.frontendServices ??
    [];
  return Array.isArray(list) ? list : [];
}

const Dashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeBuilds: 0,
    successfulBuilds: 0,
    failedBuilds: 0,
  });
  const [recentBuilds, setRecentBuilds] = useState([]);

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Unknown";
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const formatDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return "N/A";
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
      return "N/A";
    const diffInSeconds = Math.floor((end - start) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    const minutes = Math.floor(diffInSeconds / 60);
    const seconds = diffInSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const [projects, webRes, apiRes] = await Promise.all([
        projectService.getProjects().catch(() => []),
        api.get("preview-nodes").catch(() => ({ data: {} })),
        api.get("preview-services/summary").catch(() => ({
          data: { services: [] },
        })),
      ]);

      const projectList = Array.isArray(projects) ? projects : [];
      const webServices = pickServices(webRes.data).filter(
        (s) => !s.is_deleted,
      );
      const apiServices = pickServices(apiRes.data);

      const allNodes = [...webServices, ...apiServices];

      const activeBuilds = allNodes.filter(
        (s) => normalizeBuildStatus(s.build_status) === "building",
      ).length;
      const successfulBuilds = allNodes.filter(
        (s) => normalizeBuildStatus(s.build_status) === "success",
      ).length;
      const failedBuilds = allNodes.filter(
        (s) => normalizeBuildStatus(s.build_status) === "failed",
      ).length;

      setStats({
        totalProjects: projectList.length,
        activeBuilds,
        successfulBuilds,
        failedBuilds,
      });

      const recentBuildsList = [];

      apiServices.forEach((service, index) => {
        const st = normalizeBuildStatus(service.build_status);
        const buildDate =
          service.updated_at ||
          service.last_build_at ||
          service.last_build_date ||
          service.created_at;
        const t = buildDate ? new Date(buildDate).getTime() : 0;
        recentBuildsList.push({
          key: `api-${service.id ?? index}`,
          kind: "API",
          service:
            service.service_name || service.serviceName || "Unknown service",
          branch: service.branch_name || service.branchName || "main",
          status: st,
          duration:
            service.created_at && (service.updated_at || service.last_build_at)
              ? formatDuration(
                  service.created_at,
                  service.updated_at || service.last_build_at,
                )
              : "N/A",
          timestamp: formatTimeAgo(buildDate),
          buildDate: t,
        });
      });

      webServices.forEach((service, index) => {
        const st = normalizeBuildStatus(service.build_status);
        const buildDate =
          service.updated_at ||
          service.last_build_at ||
          service.last_build_date ||
          service.created_at;
        const t = buildDate ? new Date(buildDate).getTime() : 0;
        recentBuildsList.push({
          key: `web-${service.id ?? index}`,
          kind: "Web",
          service:
            service.service_name || service.serviceName || "Unknown service",
          branch: service.branch_name || service.branchName || "main",
          status: st,
          duration: "N/A",
          timestamp: formatTimeAgo(buildDate),
          buildDate: t,
        });
      });

      recentBuildsList.sort((a, b) => b.buildDate - a.buildDate);
      setRecentBuilds(recentBuildsList.slice(0, 10));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setRecentBuilds([]);
      setStats({
        totalProjects: 0,
        activeBuilds: 0,
        successfulBuilds: 0,
        failedBuilds: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-6 text-black dark:text-white">
      <div className="mb-6">
        <Title
          level={1}
          className="!mb-2 !text-blue-900 dark:!text-blue-400 !font-bold"
        >
          Dashboard
        </Title>
        <Text className="mb-1 block text-lg font-bold text-black dark:text-white">
          Welcome back, {user?.first_name || user?.username || "there"}
        </Text>
        <Text className="font-bold text-gray-700 dark:text-gray-300">
          Here&apos;s what&apos;s happening with your preview environments
          today.
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Active Builds"
            value={stats.activeBuilds}
            icon={<ClockCircleOutlined />}
            color="blue"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Successful Builds"
            value={stats.successfulBuilds}
            icon={<CheckCircleOutlined />}
            color="green"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Failed Builds"
            value={stats.failedBuilds}
            icon={<CloseCircleOutlined />}
            color="red"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Total Projects"
            value={stats.totalProjects}
            icon={<ProjectOutlined />}
            color="blue"
            loading={loading}
          />
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Card
            title={
              <span className="font-bold text-blue-900 dark:text-blue-400">
                Recent Builds
              </span>
            }
            className="border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            loading={loading}
          >
            {recentBuilds.length > 0 ? (
              <div className="space-y-3">
                {recentBuilds.map((build) => {
                  const getStatusConfig = () => {
                    switch (build.status) {
                      case "success":
                        return {
                          color: "success",
                          text: "SUCCESS",
                          icon: (
                            <CheckCircleOutlined className="text-green-500" />
                          ),
                          bgColor: "bg-green-50 dark:bg-green-900/20",
                          borderColor: "border-green-200 dark:border-green-800",
                        };
                      case "building":
                        return {
                          color: "processing",
                          text: "BUILDING",
                          icon: (
                            <ClockCircleOutlined className="text-blue-500" />
                          ),
                          bgColor: "bg-blue-50 dark:bg-blue-900/20",
                          borderColor: "border-blue-200 dark:border-blue-800",
                        };
                      case "failed":
                        return {
                          color: "error",
                          text: "FAILED",
                          icon: (
                            <CloseCircleOutlined className="text-red-500" />
                          ),
                          bgColor: "bg-red-50 dark:bg-red-900/20",
                          borderColor: "border-red-200 dark:border-red-800",
                        };
                      case "cancelled":
                        return {
                          color: "default",
                          text: "CANCELLED",
                          icon: (
                            <CloseCircleOutlined className="text-zinc-500" />
                          ),
                          bgColor: "bg-zinc-100 dark:bg-zinc-800/40",
                          borderColor: "border-zinc-200 dark:border-zinc-600",
                        };
                      default:
                        return {
                          color: "default",
                          text: "PENDING",
                          icon: (
                            <PauseCircleOutlined className="text-orange-500" />
                          ),
                          bgColor: "bg-orange-50 dark:bg-orange-900/20",
                          borderColor:
                            "border-orange-200 dark:border-orange-800",
                        };
                    }
                  };

                  const statusConfig = getStatusConfig();

                  return (
                    <div
                      key={build.key}
                      className={`cursor-default rounded-lg border border-zinc-200/80 p-4 transition-all hover:shadow-md dark:border-zinc-800 ${isDark ? "dark:!bg-zinc-900" : "!bg-white"}`}
                    >
                      <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <div className="mt-1 text-xl">
                            {statusConfig.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <Text
                                strong
                                className="text-base text-black dark:text-white"
                              >
                                {build.service}
                              </Text>
                              <Tag color="blue" className="text-xs">
                                {build.branch}
                              </Tag>
                              <Tag className="text-xs">{build.kind}</Tag>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              {build.duration !== "N/A" && (
                                <div className="flex items-center gap-1">
                                  <ClockCircleOutlined className="text-gray-400" />
                                  <Text type="secondary" className="text-xs">
                                    {build.duration}
                                  </Text>
                                </div>
                              )}
                              <Text type="secondary" className="text-xs">
                                {build.timestamp}
                              </Text>
                            </div>
                          </div>
                        </div>
                        <Tag
                          color={statusConfig.color}
                          className="shrink-0 font-semibold"
                        >
                          {statusConfig.text}
                        </Tag>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Text type="secondary" className="text-base">
                  No build activity yet.
                </Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
