"use strict";

/** @param {import('sequelize').QueryInterface} queryInterface */
/** @param {import('sequelize').Sequelize} Sequelize */

module.exports = {
  async up(queryInterface, Sequelize) {
    const desc = await queryInterface.describeTable("node_builds");
    if (!desc.jenkins_build_number) {
      await queryInterface.addColumn("node_builds", "jenkins_build_number", {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    await queryInterface.sequelize.query(`
      UPDATE node_builds
      SET jenkins_build_number = build_number
      WHERE jenkins_build_number IS NULL
    `);

    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === "mysql") {
      await queryInterface.sequelize.query(`
        UPDATE node_builds nb
        INNER JOIN (
          SELECT id,
            ROW_NUMBER() OVER (
              PARTITION BY node_id
              ORDER BY built_at ASC, id ASC
            ) AS rn
          FROM node_builds
        ) x ON nb.id = x.id
        SET nb.build_number = x.rn
      `);
    }
  },

  async down(queryInterface) {
    const desc = await queryInterface.describeTable("node_builds");
    if (desc.jenkins_build_number) {
      await queryInterface.sequelize.query(`
        UPDATE node_builds
        SET build_number = jenkins_build_number
        WHERE jenkins_build_number IS NOT NULL
      `);
      await queryInterface.removeColumn("node_builds", "jenkins_build_number");
    }
  },
};
