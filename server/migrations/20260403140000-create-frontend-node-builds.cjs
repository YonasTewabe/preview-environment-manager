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
  async up() {
    // Legacy table intentionally skipped. Build history is stored in `node_builds`.
    console.log("Skipping legacy migration: create `frontend_node_builds` table");
  },

  async down() {
    // no-op
  },
};
