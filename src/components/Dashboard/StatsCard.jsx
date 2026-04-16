import { Card, Statistic } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

const StatsCard = ({
  title,
  value,
  prefix,
  suffix,
  trend,
  trendValue,
  color = "blue",
  icon,
  loading = false,
}) => {
  const colorMap = {
    blue:
      "text-blue-600 dark:text-blue-400 bg-[color-mix(in_srgb,var(--app-primary)_14%,transparent)] border-[color-mix(in_srgb,var(--app-primary)_26%,transparent)]",
    green: "text-green-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/30",
    red: "text-red-600 dark:text-red-400 bg-rose-50 border-rose-200 dark:bg-rose-500/15 dark:border-rose-500/30",
    orange:
      "text-orange-600 dark:text-orange-400 bg-orange-50 border-orange-200",
    purple:
      "text-purple-600 dark:text-purple-400 bg-purple-50 border-purple-200",
  };

  const getTrendIcon = () => {
    if (trend === "up") return <ArrowUpOutlined className="text-green-500" />;
    if (trend === "down") return <ArrowDownOutlined className="text-red-500" />;
    return null;
  };

  const getTrendColor = () => {
    if (trend === "up") return "text-green-600";
    if (trend === "down") return "text-red-600";
    return "text-gray-600";
  };

  return (
    <Card
      className="border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      loading={loading}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Statistic
            title={
              <span
                className="text-sm font-medium"
                style={{ color: "var(--app-text)" }}
              >
                {title}
              </span>
            }
            value={value}
            prefix={prefix}
            suffix={suffix}
            valueStyle={{
              color:
                color === "green"
                  ? "#10b981"
                  : color === "red"
                    ? "#ef4444"
                    : "var(--app-text)",
              fontSize: "28px",
              fontWeight: "600",
              lineHeight: "1.2",
            }}
          />
        </div>

        {icon && (
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorMap[color]}`}
          >
            <span
              className={`text-xl ${
                color === "green"
                  ? "text-green-600 dark:text-green-400"
                  : color === "red"
                    ? "text-red-600 dark:text-red-400"
                    : color === "orange"
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-blue-600 dark:text-blue-400"
              }`}
            >
              {icon}
            </span>
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-4 flex items-center border-t pt-4" style={{ borderColor: "var(--app-border)" }}>
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
            <span className={`text-sm font-medium ${getTrendColor()}`}>
              {trendValue}
            </span>
            <span className="text-sm" style={{ color: "var(--app-text-muted)" }}>
              vs last month
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default StatsCard;
