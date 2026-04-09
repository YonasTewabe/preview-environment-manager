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
    const urlConfigsExists = await tableExists(queryInterface, 'url_configs');
    if (urlConfigsExists) {
      console.log('Table url_configs already exists, skipping creation');
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

    await queryInterface.createTable('url_configs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      frontnode_id: frontnodeCol,
      service_type: {
        type: Sequelize.ENUM('api', 'service', 'database', 'cache', 'queue', 'storage', 'other'),
        defaultValue: 'api'
      },
      default_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('url_configs', ['name']);
    await queryInterface.addIndex('url_configs', ['frontnode_id']);
    await queryInterface.addIndex('url_configs', ['service_type']);
    await queryInterface.addIndex('url_configs', ['is_deleted']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('url_configs');
  }
};
