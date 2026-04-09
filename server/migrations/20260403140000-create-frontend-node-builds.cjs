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
    const table = "frontend_node_builds";
    if (await tableExists(queryInterface, table)) {
      return;
    }

    const webRefTable = (await tableExists(queryInterface, "nodes"))
      ? "nodes"
      : (await tableExists(queryInterface, "preview_nodes_web"))
        ? "preview_nodes_web"
        : (await tableExists(queryInterface, "frontend_nodes"))
          ? "frontend_nodes"
          : null;
    const frontnodeCol = {
      type: Sequelize.INTEGER,
      allowNull: false,
    };
    if (webRefTable) {
      frontnodeCol.references = {
        model: webRefTable,
        key: "id",
      };
      frontnodeCol.onUpdate = "CASCADE";
      frontnodeCol.onDelete = "CASCADE";
    }

    await queryInterface.createTable(table, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      frontnode_id: frontnodeCol,
      build_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      built_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex(table, ["frontnode_id"], {
      name: "frontend_node_builds_frontnode_id_idx",
    });
    await queryInterface.addIndex(table, ["built_at"], {
      name: "frontend_node_builds_built_at_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("frontend_node_builds");
  },
};
