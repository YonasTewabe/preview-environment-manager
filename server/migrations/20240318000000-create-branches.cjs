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
  async up() {
    // Legacy table intentionally skipped. Branches are stored in `nodes` (role=api_branch).
    console.log("Skipping legacy migration: create `branches` table");
  },

  async down() {
    // no-op
  }
};
