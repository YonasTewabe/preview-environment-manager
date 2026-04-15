import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const NodeEnvVar = sequelize.define(
  "NodeEnvVar",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    node_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "nodes", key: "id" },
      onDelete: "CASCADE",
    },
    project_env_profile_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "project_env_profiles", key: "id" },
      onDelete: "CASCADE",
    },
    key: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "node_env_vars",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["node_id"] },
      { fields: ["project_env_profile_id"] },
      {
        fields: ["node_id", "project_env_profile_id", "key"],
        unique: true,
        name: "uniq_node_env_vars_node_profile_key",
      },
    ],
  },
);

NodeEnvVar.associate = (models) => {
  NodeEnvVar.belongsTo(models.Node, { foreignKey: "node_id", as: "node" });
  NodeEnvVar.belongsTo(models.ProjectEnvProfile, {
    foreignKey: "project_env_profile_id",
    as: "projectEnvProfile",
  });
};

export default NodeEnvVar;
