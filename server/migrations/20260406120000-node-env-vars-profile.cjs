"use strict";

/**
 * Scope node env overrides per project_env_profile_id so switching a node's
 * profile does not remove overrides for other profiles.
 */

async function indexExists(queryInterface, table, indexName) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT INDEX_NAME FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    { replacements: [table, indexName] },
  );
  return rows.length > 0;
}

async function columnExists(queryInterface, table, column) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    { replacements: [table, column] },
  );
  return rows.length > 0;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const qi = queryInterface;
    if (!(await columnExists(qi, "node_env_vars", "project_env_profile_id"))) {
      await qi.addColumn("node_env_vars", "project_env_profile_id", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "project_env_profiles", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
    }

    await qi.sequelize.query(`
      UPDATE node_env_vars nev
      INNER JOIN nodes n ON n.id = nev.node_id
      LEFT JOIN project_env_profiles pep ON pep.project_id = n.project_id AND pep.is_default = 1
      SET nev.project_env_profile_id = COALESCE(n.project_env_profile_id, n.project_env_profile_id, pep.id)
      WHERE nev.project_env_profile_id IS NULL
    `);

    await qi.changeColumn("node_env_vars", "project_env_profile_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "project_env_profiles", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    if (await indexExists(qi, "node_env_vars", "unique_node_env_key")) {
      await qi.removeIndex("node_env_vars", "unique_node_env_key");
    }

    if (!(await indexExists(qi, "node_env_vars", "uniq_node_env_vars_node_profile_key"))) {
      await qi.addIndex(
        "node_env_vars",
        ["node_id", "project_env_profile_id", "key"],
        {
          unique: true,
          name: "uniq_node_env_vars_node_profile_key",
        },
      );
    }

    if (!(await indexExists(qi, "node_env_vars", "idx_node_env_vars_profile"))) {
      await qi.addIndex("node_env_vars", ["project_env_profile_id"], {
        name: "idx_node_env_vars_profile",
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const qi = queryInterface;
    if (await indexExists(qi, "node_env_vars", "idx_node_env_vars_profile")) {
      await qi.removeIndex("node_env_vars", "idx_node_env_vars_profile");
    }
    if (await indexExists(qi, "node_env_vars", "uniq_node_env_vars_node_profile_key")) {
      await qi.removeIndex(
        "node_env_vars",
        "uniq_node_env_vars_node_profile_key",
      );
    }
    if (await columnExists(qi, "node_env_vars", "project_env_profile_id")) {
      await qi.removeColumn("node_env_vars", "project_env_profile_id");
    }
    if (!(await indexExists(qi, "node_env_vars", "unique_node_env_key"))) {
      await qi.addIndex("node_env_vars", ["node_id", "key"], {
        unique: true,
        name: "unique_node_env_key",
      });
    }
  },
};
