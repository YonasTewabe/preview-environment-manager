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
  async up() {
    // Legacy table intentionally skipped. Env vars are stored in `node_env_vars`.
    console.log("Skipping legacy migration: create `frontend_node_env_vars` table");
  },

  async down() {
    // no-op
  },
};

