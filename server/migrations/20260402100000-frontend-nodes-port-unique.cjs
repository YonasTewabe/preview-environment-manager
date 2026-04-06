"use strict";

/** One preview port per frontend node; multiple NULL allowed (MySQL). */
module.exports = {
  async up(queryInterface) {
    const table = "frontend_nodes";
    const indexName = "frontend_nodes_port_unique";
    const indexes = await queryInterface.showIndex(table);
    if (indexes.some((idx) => idx.name === indexName)) {
      return;
    }

    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === "mysql") {
      // Duplicate non-null ports block UNIQUE(port). Keep the lowest id per port; clear others.
      await queryInterface.sequelize.query(`
        UPDATE ${table} AS n
        INNER JOIN (
          SELECT port, MIN(id) AS keep_id
          FROM ${table}
          WHERE port IS NOT NULL
          GROUP BY port
          HAVING COUNT(*) > 1
        ) AS d ON n.port = d.port AND n.id <> d.keep_id
        SET n.port = NULL
      `);
    }

    await queryInterface.addIndex(table, ["port"], {
      unique: true,
      name: indexName,
    });
  },

  async down(queryInterface) {
    const table = "frontend_nodes";
    const indexName = "frontend_nodes_port_unique";
    const indexes = await queryInterface.showIndex(table);
    if (!indexes.some((idx) => idx.name === indexName)) {
      return;
    }
    await queryInterface.removeIndex(table, indexName);
  },
};
