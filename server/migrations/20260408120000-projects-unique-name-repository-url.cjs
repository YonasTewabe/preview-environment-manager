"use strict";

/**
 * Enforce unique project name and repository URL (in addition to short_code and env_name).
 * Existing duplicate values are adjusted by suffixing the row id so the unique indexes can be created.
 */
async function tableExists(queryInterface, table) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    { replacements: [table] },
  );
  return rows.length > 0;
}

/** MySQL / Sequelize may use `name` or `Key_name` on index rows. */
function indexNames(indexes) {
  return new Set(
    (indexes || []).map((i) => i.name || i.Key_name).filter(Boolean),
  );
}

/**
 * For each duplicate value (same column), keep the row with minimum id; make others unique.
 */
async function dedupeProjectsColumn(queryInterface, column) {
  const q = queryInterface.sequelize;
  const [groups] = await q.query(
    `SELECT \`${column}\` AS v, MIN(id) AS keep_id
     FROM \`projects\`
     GROUP BY \`${column}\`
     HAVING COUNT(*) > 1`,
  );
  for (const g of groups) {
    const [rows] = await q.query(
      `SELECT id FROM \`projects\` WHERE \`${column}\` = ? ORDER BY id ASC`,
      { replacements: [g.v] },
    );
    const ids = rows.map((r) => r.id);
    const [, ...dups] = ids;
    for (const id of dups) {
      if (column === "name") {
        await q.query(`UPDATE \`projects\` SET \`name\` = CONCAT(\`name\`, ' [', ?, ']') WHERE \`id\` = ?`, {
          replacements: [id, id],
        });
      } else if (column === "repository_url") {
        await q.query(
          `UPDATE \`projects\` SET \`repository_url\` = CONCAT(\`repository_url\`, '#dup-', ?) WHERE \`id\` = ?`,
          { replacements: [id, id] },
        );
      }
    }
  }
}

module.exports = {
  async up(queryInterface) {
    if (!(await tableExists(queryInterface, "projects"))) {
      return;
    }

    const names = indexNames(await queryInterface.showIndex("projects"));

    await dedupeProjectsColumn(queryInterface, "name");
    await dedupeProjectsColumn(queryInterface, "repository_url");

    if (!names.has("projects_name_unique")) {
      await queryInterface.addIndex("projects", ["name"], {
        unique: true,
        name: "projects_name_unique",
      });
    }
    if (!names.has("projects_repository_url_unique")) {
      await queryInterface.addIndex("projects", ["repository_url"], {
        unique: true,
        name: "projects_repository_url_unique",
      });
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeIndex("projects", "projects_name_unique");
    } catch (_) {
      /* */
    }
    try {
      await queryInterface.removeIndex("projects", "projects_repository_url_unique");
    } catch (_) {
      /* */
    }
  },
};
