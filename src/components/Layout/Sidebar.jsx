import { Layout, Menu, Typography, Button, Drawer } from "antd";
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

const Sidebar = ({
  collapsed,
  isMobile = false,
  mobileOpen = false,
  onMobileClose,
}) => {
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
    if (path.startsWith("/settings")) return ["/settings"];
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
      type: "divider",
    },
    {
      key: "/users",
      icon: <TeamOutlined style={{ fontSize: "18px" }} />,
      label: "User management",
      onClick: () => navigate("/users"),
    },
    {
      key: "/settings",
      icon: <SettingOutlined style={{ fontSize: "18px" }} />,
      label: "System settings",
      onClick: () => navigate("/settings"),
    },
    {
      type: "divider",
    },
    {
      key: "/trash",
      icon: <DeleteOutlined style={{ fontSize: "18px" }} />,
      label: "Trash",
      onClick: () => navigate("/trash"),
    },
  ];
  const sidebarContent = (
    <>
      <div
        className="px-4 py-4 sm:px-5 sm:py-5"
      >
        <div
          className={`flex items-center ${collapsed && !isMobile ? "justify-center" : "gap-3"}`}
        >
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-xl"
            style={{
              background:
                "color-mix(in srgb, var(--app-primary) 16%, transparent)",
              border: "1px solid color-mix(in srgb, var(--app-primary) 26%, transparent)",
            }}
          >
            <FaCodeBranch
              style={{ fontSize: "22px", color: "var(--app-primary)" }}
            />
          </div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <Text
                className="!mb-0 block text-[0.65rem] font-semibold uppercase leading-tight tracking-[0.12em]"
                style={{ color: "var(--app-text-muted)" }}
              >
                Preview
              </Text>
              <Text
                className="!mb-0 block truncate text-base font-bold leading-tight tracking-tight"
                style={{ color: "var(--app-text)" }}
              >
                Builder
              </Text>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-2 py-4 sm:px-3">
        {(!collapsed || isMobile) && (
          <p
            className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--app-text-muted)" }}
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
          inlineCollapsed={!isMobile && collapsed}
          onClick={() => {
            if (isMobile) onMobileClose?.();
          }}
        />
      </div>

      <div
        className={`border-t pb-4 pt-3 ${
          collapsed && !isMobile ? "flex justify-center px-0" : "px-2 sm:px-3"
        }`}
        style={{ borderColor: "var(--app-border)" }}
      >
        <Button
          type="text"
          icon={<LogoutOutlined className="text-base" />}
          onClick={() => {
            handleLogout();
            if (isMobile) onMobileClose?.();
          }}
          className={
            collapsed && !isMobile
              ? `!inline-flex !size-11 !items-center !justify-center !gap-0 !p-0 rounded-lg font-medium transition-colors ${
                  isDark
                    ? "text-zinc-300 hover:!bg-zinc-800/70"
                    : "text-zinc-700 hover:!bg-zinc-100/90"
                }`
              : `flex h-11 w-full items-center justify-start rounded-lg font-medium transition-colors ${
                  isDark
                    ? "text-zinc-300 hover:!bg-zinc-800/70"
                    : "text-zinc-700 hover:!bg-zinc-100/90"
                }`
          }
        >
          {(isMobile || !collapsed) && <span className="ml-1">Log out</span>}
        </Button>
      </div>
    </>
  );

  return (
    <>
      {!isMobile ? (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          collapsedWidth={80}
          width={280}
          className="sidebar-shell flex flex-col border-r"
          style={{
            background: "var(--app-surface)",
            borderColor: "var(--app-border)",
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
          {sidebarContent}

          <style>{`
        .sidebar-shell {
          box-shadow: var(--app-shadow);
        }

        .sidebar-menu .ant-menu-item {
          height: 44px !important;
          line-height: 44px !important;
          margin: 4px 0 !important;
          border-radius: 10px !important;
          color: var(--app-text-muted) !important;
          font-weight: 500 !important;
          padding-left: 16px !important;
          transition: all 0.2s ease !important;
        }

        .dark .sidebar-menu .ant-menu-item {
          color: var(--app-text-muted) !important;
        }

        .sidebar-menu .ant-menu-item:hover {
          background-color: color-mix(in srgb, var(--app-primary) 10%, transparent) !important;
          color: var(--app-text) !important;
        }

        .dark .sidebar-menu .ant-menu-item:hover {
          background-color: color-mix(in srgb, var(--app-primary) 14%, transparent) !important;
          color: var(--app-text) !important;
        }

        .sidebar-menu .ant-menu-item-selected {
          background-color: color-mix(in srgb, var(--app-primary) 18%, transparent) !important;
          color: var(--app-primary) !important;
          font-weight: 600 !important;
        }

        .sidebar-menu .ant-menu-item-selected .anticon {
          color: var(--app-primary) !important;
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
          border-radius: 10px !important;
          color: var(--app-text-muted) !important;
          font-weight: 500 !important;
          padding-left: 16px !important;
          transition: all 0.2s ease !important;
        }

        .dark .sidebar-menu .ant-menu-submenu-title {
          color: var(--app-text-muted) !important;
        }

        .sidebar-menu .ant-menu-submenu-title:hover {
          background-color: color-mix(in srgb, var(--app-primary) 10%, transparent) !important;
          color: var(--app-text) !important;
        }

        .dark .sidebar-menu .ant-menu-submenu-title:hover {
          background-color: color-mix(in srgb, var(--app-primary) 14%, transparent) !important;
          color: var(--app-text) !important;
        }

        .sidebar-menu .ant-menu-submenu-open > .ant-menu-submenu-title {
          color: var(--app-text) !important;
        }

        .dark .sidebar-menu .ant-menu-submenu-open > .ant-menu-submenu-title {
          color: var(--app-text) !important;
        }

        .sidebar-menu .ant-menu-submenu-title .anticon {
          color: var(--app-text-muted) !important;
        }

        .dark .sidebar-menu .ant-menu-submenu-title .anticon {
          color: var(--app-text-muted) !important;
        }

        .sidebar-menu .ant-menu-submenu-title .ant-menu-submenu-arrow {
          color: var(--app-text-muted) !important;
        }

        .dark .sidebar-menu .ant-menu-submenu-title .ant-menu-submenu-arrow {
          color: var(--app-text-muted) !important;
        }

        .sidebar-menu .ant-menu-inline .ant-menu-item {
          padding-left: 48px !important;
        }

        .sidebar-menu .ant-menu-inline .ant-menu-item:hover {
          background-color: color-mix(in srgb, var(--app-primary) 10%, transparent) !important;
        }

        .dark .sidebar-menu .ant-menu-inline .ant-menu-item:hover {
          background-color: color-mix(in srgb, var(--app-primary) 14%, transparent) !important;
        }

        .sidebar-menu .ant-menu-inline .ant-menu-item-selected {
          background-color: color-mix(in srgb, var(--app-primary) 18%, transparent) !important;
          color: var(--app-primary) !important;
          font-weight: 600 !important;
        }

        .dark .sidebar-menu .ant-menu-inline .ant-menu-item-selected {
          background-color: color-mix(in srgb, var(--app-primary) 20%, transparent) !important;
          color: var(--app-primary) !important;
        }

        .dark .sidebar-menu .ant-menu-item-selected {
          background-color: color-mix(in srgb, var(--app-primary) 20%, transparent) !important;
          color: var(--app-primary) !important;
        }

        .dark .sidebar-menu .ant-menu-item-selected .anticon {
          color: var(--app-primary) !important;
        }

        .sidebar-menu .ant-menu-inline .ant-menu-item-selected::after {
          display: none !important;
        }
      `}</style>
        </Sider>
      ) : (
        <Drawer
          placement="left"
          open={mobileOpen}
          onClose={onMobileClose}
          width={280}
          closable={false}
          bodyStyle={{ padding: 0, display: "flex", flexDirection: "column" }}
          className={isDark ? "dark" : ""}
        >
          <div className="flex h-full flex-col" style={{ background: "var(--app-surface)" }}>
            {sidebarContent}
          </div>
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;
