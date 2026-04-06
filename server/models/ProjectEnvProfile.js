import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const ProjectEnvProfile = sequelize.define(
  "ProjectEnvProfile",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "projects", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "project_env_profiles",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["project_id", "slug"],
        name: "uniq_project_env_profile_slug",
      },
      { fields: ["project_id"] },
    ],
  },
);

export default ProjectEnvProfile;
