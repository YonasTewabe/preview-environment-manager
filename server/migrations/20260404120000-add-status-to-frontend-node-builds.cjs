"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = "frontend_node_builds";
    const desc = await queryInterface.describeTable(table);
    if (desc.status) {
      return;
    }
    await queryInterface.addColumn(table, "status", {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: "success",
    });
  },

  async down(queryInterface) {
    const table = "frontend_node_builds";
    const desc = await queryInterface.describeTable(table);
    if (!desc.status) {
      return;
    }
    await queryInterface.removeColumn(table, "status");
  },
};
