"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("projects");
    if (!table.is_deleted) {
      await queryInterface.addColumn("projects", "is_deleted", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    const indexes = await queryInterface.showIndex("projects");
    const hasIndex = indexes.some((idx) => idx.name === "projects_is_deleted_idx");
    if (!hasIndex) {
      await queryInterface.addIndex("projects", ["is_deleted"], {
        name: "projects_is_deleted_idx",
      });
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeIndex("projects", "projects_is_deleted_idx");
    } catch (_e) {
      // ignore
    }
    try {
      await queryInterface.removeColumn("projects", "is_deleted");
    } catch (_e) {
      // ignore
    }
  },
};
