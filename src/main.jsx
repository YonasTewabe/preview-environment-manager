import { createRoot } from "react-dom/client";
import "./index.css";
import { ConfigProvider, theme } from "antd";
import App from "./App";
import { App as AntdApp } from 'antd';
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";

// Component to wrap ConfigProvider with theme context
const ThemedApp = () => {
  const { isDark } = useTheme();
  
  return (
    <ConfigProvider
      theme={{
        cssVar: true,
        token: {
          fontFamily:
            "Inter, Poppins, Segoe UI, -apple-system, BlinkMacSystemFont, Helvetica Neue, sans-serif",
          borderRadius: 12,
          colorPrimary: isDark ? "#4f83ff" : "#2563eb",
          colorInfo: isDark ? "#4f83ff" : "#2563eb",
          colorSuccess: isDark ? "#2ccf9a" : "#059669",
          colorWarning: isDark ? "#f0b54a" : "#d97706",
          colorError: isDark ? "#f87171" : "#dc2626",
          colorBgBase: isDark ? "#0b1220" : "#f3f6fc",
          colorBgLayout: isDark ? "#0b1220" : "#f3f6fc",
          colorBgContainer: isDark ? "#121b2d" : "#ffffff",
          colorText: isDark ? "#e5edf8" : "#0f172a",
          colorTextSecondary: isDark ? "#9eb1ce" : "#5f6d82",
          colorBorder: isDark ? "#26334a" : "#dbe4f0",
          colorSplit: isDark ? "#26334a" : "#dbe4f0",
          boxShadowTertiary: isDark
            ? "0 16px 32px -24px rgba(0,0,0,.85)"
            : "0 12px 28px -20px rgba(15,23,42,.55)",
        },
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        components: {
          Layout: {
            headerBg: "transparent",
            bodyBg: "transparent",
            siderBg: "transparent",
          },
          Card: {
            borderRadiusLG: 16,
          },
          Menu: {
            itemBorderRadius: 10,
            itemHeight: 44,
            iconSize: 16,
          },
          Button: {
            controlHeight: 40,
            defaultShadow: "none",
            primaryShadow: "0 10px 20px -12px rgba(37,99,235,.55)",
          },
          Input: {
            controlHeight: 42,
          },
          Table: {
            headerBorderRadius: 10,
          },
        },
      }}
    >
      <AntdApp>
        <App />
      </AntdApp>
    </ConfigProvider>
  );
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}
createRoot(rootElement).render(
  <ThemeProvider>
    <ThemedApp />
  </ThemeProvider>
);
