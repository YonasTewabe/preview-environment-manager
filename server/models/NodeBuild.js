import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const NodeBuild = sequelize.define(
  "NodeBuild",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    node_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "nodes", key: "id" },
      onDelete: "CASCADE",
    },
    /** Per-node sequence (1, 2, 3, …) for this preview node. */
    build_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    /** Jenkins job run number (global to the job) — for console/artifact URLs. */
    jenkins_build_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    built_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: "success",
    },
  },
  {
    tableName: "node_builds",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["node_id"] },
      { fields: ["built_at"] },
    ],
  },
);

NodeBuild.associate = (models) => {
  NodeBuild.belongsTo(models.Node, { foreignKey: "node_id", as: "node" });
};

export default NodeBuild;
