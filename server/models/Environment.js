import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

class Environment extends Model {
  static associate(models) {
    Environment.belongsTo(models.Project, {
      foreignKey: "project_id",
      as: "project",
    });
    Environment.belongsTo(models.ProjectEnvProfile, {
      foreignKey: "profile_id",
      as: "profile",
    });
  }
}

Environment.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "projects",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    profile_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "project_env_profiles",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    env_variable: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    env: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Environment',
    tableName: 'environments',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["env_variable"] },
      { fields: ["project_id"] },
      { fields: ["profile_id"] },
      {
        fields: ["profile_id", "env_variable"],
        unique: true,
        name: "unique_profile_env_variable",
      },
    ],
  }
);

export default Environment;

