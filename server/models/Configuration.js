import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Configuration = sequelize.define(
  "Configuration",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    key_name: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
    },
    value_text: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: "general",
    },
    is_secret: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "configuration",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["key_name"],
        name: "uniq_configuration_key_name",
      },
      {
        fields: ["category"],
        name: "idx_configuration_category",
      },
    ],
  },
);

export default Configuration;
