"use strict";

const COLS = ["jenkins_job", "version", "last_build_date"];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects'`,
    );
    const existing = new Set(rows.map((r) => r.COLUMN_NAME));
    for (const col of COLS) {
      if (existing.has(col)) {
        await queryInterface.removeColumn("projects", col);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const has = async (col) => {
      const [rows = []] = await queryInterface.sequelize.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND COLUMN_NAME = ?`,
        { replacements: [col] },
      );
      return rows.length > 0;
    };
    if (!(await has("jenkins_job"))) {
      await queryInterface.addColumn("projects", "jenkins_job", {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
    }
    if (!(await has("version"))) {
      await queryInterface.addColumn("projects", "version", {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: "v1.0.0",
      });
    }
    if (!(await has("last_build_date"))) {
      await queryInterface.addColumn("projects", "last_build_date", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },
};
