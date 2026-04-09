import { Layout, Menu, Typography, Button } from "antd";
import {
  AppstoreOutlined,
  UnorderedListOutlined,
  CloudOutlined,
  TeamOutlined,
  LogoutOutlined,
  SettingOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { FaCodeBranch } from "react-icons/fa6";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

const { Sider } = Layout;
const { Text } = Typography;

const Sidebar = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { isDark } = useTheme();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Determine selected keys for menu
  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path === "/" || path.startsWith("/dashboard")) return ["/"];
    if (path.startsWith("/projects")) return ["/projects"];
    if (path.startsWith("/environments")) return ["/environments"];
    if (path.startsWith("/users")) return ["/users"];
    if (path.startsWith("/system-settings")) return ["/system-settings"];
    if (path.startsWith("/trash")) return ["/trash"];
    return [];
  };

  const menuItems = [
    {
      key: "/",
      icon: <AppstoreOutlined style={{ fontSize: "18px" }} />,
      label: "Dashboard",
      onClick: () => navigate("/"),
    },
    {
      key: "/projects",
      icon: <UnorderedListOutlined style={{ fontSize: "18px" }} />,
      label: "Projects",
      onClick: () => navigate("/projects"),
    },
    {
      key: "/environments",
      icon: <CloudOutlined style={{ fontSize: "18px" }} />,
      label: "Env management",
      onClick: () => navigate("/environments"),
    },
    {
      key: "/users",
      icon: <TeamOutlined style={{ fontSize: "18px" }} />,
      label: "User management",
      onClick: () => navigate("/users"),
    },
    {
      key: "/system-settings",
      icon: <SettingOutlined style={{ fontSize: "18px" }} />,
      label: "System settings",
      onClick: () => navigate("/system-settings"),
    },
    {
      key: "/trash",
      icon: <DeleteOutlined style={{ fontSize: "18px" }} />,
      label: "Trash",
      onClick: () => navigate("/trash"),
    },
  ];
  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      collapsedWidth={80}
      width={280}
      className={`flex flex-col border-r shadow-[1px_0_0_0_rgba(0,0,0,0.04)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.06)] ${
        isDark
          ? "!bg-zinc-950 border-zinc-800"
          : "!bg-white border-gray-200/80"
      }`}
      style={{
        overflow: "hidden",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className={`border-b px-4 py-4 sm:px-5 sm:py-5 ${
          isDark ? "border-zinc-800" : "border-gray-100"
        }`}
      >
        <div
          className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}
        >
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
              isDark
                ? "bg-blue-500/15 ring-1 ring-blue-400/25"
                : "bg-blue-50 ring-1 ring-blue-100"
            }`}
          >
            <FaCodeBranch
              className={isDark ? "text-blue-400" : "text-blue-600"}
              style={{ fontSize: "22px" }}
            />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <Text
                className={`!mb-0 block text-[0.65rem] font-semibold uppercase leading-tight tracking-[0.12em] ${
                  isDark ? "text-zinc-500" : "text-zinc-400"
                }`}
              >
                Preview
              </Text>
              <Text
                className={`!mb-0 block truncate text-base font-bold leading-tight tracking-tight ${
                  isDark ? "text-zinc-100" : "text-zinc-900"
                }`}
              >
                Builder
              </Text>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-2 py-4 sm:px-3">
        {!collapsed && (
          <p
            className={`mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider ${
              isDark ? "text-zinc-500" : "text-zinc-400"
            }`}
          >
            Navigate
          </p>
        )}
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          items={menuItems}
          className="sidebar-menu !border-none !bg-transparent"
          style={{
            backgroundColor: "transparent",
          }}
          theme={isDark ? "dark" : "light"}
        />
      </div>

      <div
        className={`border-t pb-4 pt-3 ${
          collapsed
            ? "flex justify-center px-0"
            : "px-2 sm:px-3"
        } ${isDark ? "border-zinc-800" : "border-gray-200/80"}`}
      >
        <Button
          type="text"
          icon={<LogoutOutlined className="text-base" />}
          onClick={handleLogout}
          className={
            collapsed
              ? `!inline-flex !size-11 !items-center !justify-center !gap-0 !p-0 rounded-lg font-medium transition-colors ${
                  isDark
                    ? "text-zinc-300 hover:!bg-zinc-800/80"
                    : "text-zinc-700 hover:!bg-zinc-100"
                }`
              : `flex h-11 w-full items-center justify-start rounded-lg font-medium transition-colors ${
                  isDark
                    ? "text-zinc-300 hover:!bg-zinc-800/80"
                    : "text-zinc-700 hover:!bg-zinc-100"
                }`
          }
        >
          {!collapsed && <span className="ml-1">Log out</span>}
        </Button>
      </div>

      <style>{`
        .sidebar-menu .ant-menu-item {
          height: 44px !important;
          line-height: 44px !important;
          margin: 4px 0 !important;
          border-radius: 6px !important;
          color: #374151 !important;
          font-weight: 500 !important;
          padding-left: 16px !important;
          transition: all 0.2s ease !important;
        }

        .dark .sidebar-menu .ant-menu-item {
          color: #ffffff !important;
        }

        .sidebar-menu .ant-menu-item:hover {
          background-color: #f3f4f6 !important;
          color: #000000 !important;
        }

        .dark .sidebar-menu .ant-menu-item:hover {
          background-color: #1a1a1a !important;
          color: #ffffff !important;
        }

        .sidebar-menu .ant-menu-item-selected {
          background-color: rgba(37, 99, 235, 0.12) !important;
          color: #1d4ed8 !important;
          font-weight: 600 !important;
        }

        .sidebar-menu .ant-menu-item-selected .anticon {
          color: #2563eb !important;
        }

        .sidebar-menu .ant-menu-item-selected::after {
          display: none !important;
        }

        .sidebar-menu .ant-menu-submenu {
          margin: 4px 0 !important;
        }

        .sidebar-menu .ant-menu-submenu-title {
          height: 44px !important;
          line-height: 44px !important;
          border-radius: 6px !important;
          color: #374151 !important;
          font-weight: 500 !important;
          padding-left: 16px !important;
          transition: all 0.2s ease !important;
        }

        .dark .sidebar-menu .ant-menu-submenu-title {
          color: #ffffff !important;
        }

        .sidebar-menu .ant-menu-submenu-title:hover {
          background-color: #f3f4f6 !important;
          color: #000000 !important;
        }

        .dark .sidebar-menu .ant-menu-submenu-title:hover {
          background-color: #1a1a1a !important;
          color: #ffffff !important;
        }

        .sidebar-menu .ant-menu-submenu-open > .ant-menu-submenu-title {
          color: #000000 !important;
        }

        .dark .sidebar-menu .ant-menu-submenu-open > .ant-menu-submenu-title {
          color: #ffffff !important;
        }

        .sidebar-menu .ant-menu-submenu-title .anticon {
          color: #000000 !important;
        }

        .dark .sidebar-menu .ant-menu-submenu-title .anticon {
          color: #ffffff !important;
        }

        .sidebar-menu .ant-menu-submenu-title .ant-menu-submenu-arrow {
          color: #6b7280 !important;
        }

        .dark .sidebar-menu .ant-menu-submenu-title .ant-menu-submenu-arrow {
          color: #9ca3af !important;
        }

        .sidebar-menu .ant-menu-inline .ant-menu-item {
          padding-left: 48px !important;
        }

        .sidebar-menu .ant-menu-inline .ant-menu-item:hover {
          background-color: #f3f4f6 !important;
        }

        .dark .sidebar-menu .ant-menu-inline .ant-menu-item:hover {
          background-color: #374151 !important;
        }

        .sidebar-menu .ant-menu-inline .ant-menu-item-selected {
          background-color: #e6f7ff !important;
          color: #1890ff !important;
          font-weight: 600 !important;
        }

        .dark .sidebar-menu .ant-menu-inline .ant-menu-item-selected {
          background-color: rgba(59, 130, 246, 0.18) !important;
          color: #93c5fd !important;
        }

        .dark .sidebar-menu .ant-menu-item-selected {
          background-color: rgba(59, 130, 246, 0.18) !important;
          color: #93c5fd !important;
        }

        .dark .sidebar-menu .ant-menu-item-selected .anticon {
          color: #60a5fa !important;
        }

        .sidebar-menu .ant-menu-inline .ant-menu-item-selected::after {
          display: none !important;
        }
      `}</style>
    </Sider>
  );
};

export default Sidebar;
