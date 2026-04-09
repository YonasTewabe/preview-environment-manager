'use strict';

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
    const branchesExists = await tableExists(queryInterface, 'branches');
    if (branchesExists) {
      console.log('Table branches already exists, skipping creation');
      return;
    }

    const nodeRefTable = (await tableExists(queryInterface, "nodes"))
      ? "nodes"
      : (await tableExists(queryInterface, "preview_nodes_api"))
        ? "preview_nodes_api"
        : (await tableExists(queryInterface, "backend_nodes"))
          ? "backend_nodes"
          : null;

    const nodeIdColumn = {
      type: Sequelize.INTEGER,
      allowNull: false,
    };
    if (nodeRefTable) {
      nodeIdColumn.references = {
        model: nodeRefTable,
        key: "id",
      };
      nodeIdColumn.onUpdate = "CASCADE";
      nodeIdColumn.onDelete = "CASCADE";
    }

    await queryInterface.createTable('branches', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      build_number: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      build_result: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      domain_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      jenkins_job_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      port: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      preview_link: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'deleted'),
        defaultValue: 'active',
      },
      is_approved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      node_id: nodeIdColumn,
    });

    // Add indexes
    await queryInterface.addIndex('branches', ['name'], { name: 'branches_name_idx' });
    await queryInterface.addIndex('branches', ['status'], { name: 'branches_status_idx' });
    await queryInterface.addIndex('branches', ['node_id'], { name: 'branches_node_id_idx' });
    await queryInterface.addIndex('branches', ['created_by'], { name: 'branches_created_by_idx' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('branches');
  }
};
