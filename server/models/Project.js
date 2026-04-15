import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

class Project extends Model {
  // Static method for associations
  static associate(models) {
    Project.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator',
    });

    Project.hasMany(models.Node, {
      foreignKey: 'project_id',
      as: 'nodes',
    });

    Project.hasMany(models.Environment, {
      foreignKey: "project_id",
      as: "environments",
    });
    Project.hasMany(models.ProjectEnvProfile, {
      foreignKey: "project_id",
      as: "envProfiles",
    });
  }
}

Project.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    short_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 20],
        is: /^[A-Z0-9_-]+$/i, // Only alphanumeric, underscore, and hyphen
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    repository_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'archived'),
      defaultValue: 'active',
    },
    tag: {
      type: DataTypes.ENUM('frontend', 'backend'),
      allowNull: false,
    },
    env_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'Project',
    tableName: 'projects',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['name'] },
      { fields: ['short_code'] },
      { fields: ['status'] },
      { fields: ['tag'] },
      { fields: ['created_by'] },
      { fields: ['is_deleted'] },
    ],
  }
);

export default Project;