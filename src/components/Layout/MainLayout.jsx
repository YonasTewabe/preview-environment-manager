import { useState } from "react";
import { Layout, Button, Space, Dropdown, Avatar } from "antd";
import {
  MoonOutlined,
  SunOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import Sidebar from "./Sidebar";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const { Header, Content } = Layout;

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
      onClick: () => {
        navigate("/profile");
      },
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
      onClick: () => {
        navigate("/profile");
      },
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
    },
  ];

  return (
    <Layout
      className={`min-h-screen ${isDark ? "bg-neutral-950" : "bg-[#f5f5f5]"}`}
      style={{ minHeight: "100vh" }}
    >
      <Sidebar
        collapsed={collapsed}
        onCollapse={() => setCollapsed(!collapsed)}
      />

      <Layout
        className={`min-h-screen ${isDark ? "bg-neutral-950" : "bg-[#f5f5f5]"}`}
        style={{
          marginLeft: collapsed ? 80 : 280,
          transition: "margin-left 0.2s",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <Header
          className={`${isDark ? "dark:!bg-black" : "!bg-white"} border-b border-gray-200 px-6 flex items-center justify-end shadow-sm`}
        >
          <div className="flex items-center space-x-4">
            <Space size="middle">
              <Button
                type="text"
                icon={isDark ? <SunOutlined /> : <MoonOutlined />}
                className="hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg text-black dark:text-white"
                size="large"
                onClick={toggleTheme}
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              />
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={["click"]}
              >
                <Button
                  type="text"
                  className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg text-black dark:text-white"
                  size="large"
                >
                  <Avatar
                    size="small"
                    icon={<UserOutlined />}
                    className="bg-blue-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    {user?.first_name || user?.username}
                  </span>
                </Button>
              </Dropdown>
            </Space>
          </div>
        </Header>

        {/* Content */}
        <Content
          className={`flex-1 min-h-0 overflow-y-auto p-6 ${isDark ? "bg-neutral-950" : "bg-[#f5f5f5]"}`}
        >
          <div className="text-black dark:text-white">{children}</div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
