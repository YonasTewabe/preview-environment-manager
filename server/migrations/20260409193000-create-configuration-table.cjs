"use strict";

async function tableExists(queryInterface, table) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    { replacements: [table] },
  );
  return rows.length > 0;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    if (await tableExists(queryInterface, "configuration")) return;

    await queryInterface.createTable("configuration", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      key_name: {
        type: Sequelize.STRING(128),
        allowNull: false,
        unique: true,
      },
      value_text: {
        type: Sequelize.TEXT("long"),
        allowNull: true,
      },
      category: {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: "general",
      },
      is_secret: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });

    await queryInterface.addIndex("configuration", ["key_name"], {
      unique: true,
      name: "uniq_configuration_key_name",
    });
    await queryInterface.addIndex("configuration", ["category"], {
      name: "idx_configuration_category",
    });
  },

  async down(queryInterface) {
    if (await tableExists(queryInterface, "configuration")) {
      await queryInterface.dropTable("configuration");
    }
  },
};
