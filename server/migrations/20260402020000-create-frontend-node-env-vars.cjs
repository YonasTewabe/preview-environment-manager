'use strict';

async function tableExists(queryInterface, table) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    { replacements: [table] },
  );
  return rows.length > 0;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const envVarsExists = await tableExists(queryInterface, 'frontend_node_env_vars');
    if (envVarsExists) {
      console.log('Table frontend_node_env_vars already exists, skipping creation');
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

    await queryInterface.createTable('frontend_node_env_vars', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      frontnode_id: frontnodeCol,
      key: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('frontend_node_env_vars', ['frontnode_id']);
    await queryInterface.addIndex('frontend_node_env_vars', ['key']);
    await queryInterface.addIndex('frontend_node_env_vars', ['frontnode_id', 'key'], {
      unique: true,
      name: 'unique_frontnode_key',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('frontend_node_env_vars');
  },
};

