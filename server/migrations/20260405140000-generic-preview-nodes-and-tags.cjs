"use strict";

/**
 * Generic naming:
 * - frontend_nodes → preview_nodes_web
 * - backend_nodes → preview_nodes_api
 * - frontend_node_* child tables → preview_node_web_*
 * - frontnode_id → web_node_id (url_configs, env vars, builds)
 * - projects.tag: frontend/backend → web/api
 */

async function dropFk(queryInterface, table, column) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
       AND COLUMN_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
    { replacements: [table, column] },
  );
  for (const r of rows) {
    const name = r.CONSTRAINT_NAME;
    await queryInterface.sequelize.query(
      `ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${name}\``,
    );
  }
}

async function tableExists(queryInterface, name) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    { replacements: [name] },
  );
  return rows.length > 0;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    if (await tableExists(queryInterface, "preview_nodes_web")) {
      console.log("generic preview migration: already applied, skipping");
      return;
    }

    // --- Drop FKs (ignore if table missing during partial deploy) ---
    const tryDrop = async (table, col) => {
      if (await tableExists(queryInterface, table)) {
        try {
          await dropFk(queryInterface, table, col);
        } catch (e) {
          console.warn(`dropFk ${table}.${col}:`, e.message);
        }
      }
    };

    await tryDrop("branches", "node_id");
    await tryDrop("url_configs", "frontnode_id");
    if (await tableExists(queryInterface, "frontend_node_env_vars")) {
      await tryDrop("frontend_node_env_vars", "frontnode_id");
    }
    if (await tableExists(queryInterface, "frontend_node_builds")) {
      await tryDrop("frontend_node_builds", "frontnode_id");
    }

    // --- Rename core node tables ---
    if (await tableExists(queryInterface, "frontend_nodes")) {
      await queryInterface.sequelize.query(
        "RENAME TABLE `frontend_nodes` TO `preview_nodes_web`",
      );
    }
    if (await tableExists(queryInterface, "backend_nodes")) {
      await queryInterface.sequelize.query(
        "RENAME TABLE `backend_nodes` TO `preview_nodes_api`",
      );
    }

    // --- Child tables (web / UI lineage) ---
    if (await tableExists(queryInterface, "frontend_node_env_vars")) {
      await queryInterface.sequelize.query(
        "RENAME TABLE `frontend_node_env_vars` TO `preview_node_web_env_vars`",
      );
      await queryInterface.sequelize.query(
        "ALTER TABLE `preview_node_web_env_vars` CHANGE `frontnode_id` `web_node_id` INT NOT NULL",
      );
      try {
        await queryInterface.removeIndex(
          "preview_node_web_env_vars",
          "unique_frontnode_key",
        );
      } catch (_) {
        /* index name may differ */
      }
      await queryInterface.addIndex(
        "preview_node_web_env_vars",
        ["web_node_id", "key"],
        {
          unique: true,
          name: "unique_preview_web_node_key",
        },
      );
    }

    if (await tableExists(queryInterface, "frontend_node_builds")) {
      await queryInterface.sequelize.query(
        "RENAME TABLE `frontend_node_builds` TO `preview_node_web_builds`",
      );
      await queryInterface.sequelize.query(
        "ALTER TABLE `preview_node_web_builds` CHANGE `frontnode_id` `web_node_id` INT NOT NULL",
      );
    }

    // --- url_configs ---
    if (await tableExists(queryInterface, "url_configs")) {
      await queryInterface.sequelize.query(
        "ALTER TABLE `url_configs` CHANGE `frontnode_id` `web_node_id` INT NOT NULL",
      );
    }

    // --- Re-add FKs ---
    await queryInterface.sequelize.query(`
      ALTER TABLE \`branches\`
      ADD CONSTRAINT \`branches_node_preview_api_fk\`
      FOREIGN KEY (\`node_id\`) REFERENCES \`preview_nodes_api\` (\`id\`)
      ON UPDATE CASCADE ON DELETE CASCADE
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE \`url_configs\`
      ADD CONSTRAINT \`url_configs_web_node_fk\`
      FOREIGN KEY (\`web_node_id\`) REFERENCES \`preview_nodes_web\` (\`id\`)
      ON UPDATE CASCADE ON DELETE CASCADE
    `);

    if (await tableExists(queryInterface, "preview_node_web_env_vars")) {
      await queryInterface.sequelize.query(`
        ALTER TABLE \`preview_node_web_env_vars\`
        ADD CONSTRAINT \`preview_web_env_vars_node_fk\`
        FOREIGN KEY (\`web_node_id\`) REFERENCES \`preview_nodes_web\` (\`id\`)
        ON UPDATE CASCADE ON DELETE CASCADE
      `);
    }

    if (await tableExists(queryInterface, "preview_node_web_builds")) {
      await queryInterface.sequelize.query(`
        ALTER TABLE \`preview_node_web_builds\`
        ADD CONSTRAINT \`preview_web_builds_node_fk\`
        FOREIGN KEY (\`web_node_id\`) REFERENCES \`preview_nodes_web\` (\`id\`)
        ON UPDATE CASCADE ON DELETE CASCADE
      `);
    }

    // --- Project tags: frontend/backend → web/api ---
    if (await tableExists(queryInterface, "projects")) {
      await queryInterface.sequelize.query(`
        ALTER TABLE \`projects\` MODIFY COLUMN \`tag\` VARCHAR(32) NOT NULL
      `);
      await queryInterface.sequelize.query(`
        UPDATE \`projects\` SET \`tag\` = 'web' WHERE \`tag\` = 'frontend'
      `);
      await queryInterface.sequelize.query(`
        UPDATE \`projects\` SET \`tag\` = 'api' WHERE \`tag\` = 'backend'
      `);
      await queryInterface.sequelize.query(`
        ALTER TABLE \`projects\` MODIFY COLUMN \`tag\` ENUM('web','api') NOT NULL
      `);
    }

    // --- Port unique index name (optional cosmetic) ---
    if (await tableExists(queryInterface, "preview_nodes_web")) {
      try {
        await queryInterface.removeIndex(
          "preview_nodes_web",
          "frontend_nodes_port_unique",
        );
      } catch (_) {}
      try {
        await queryInterface.addIndex("preview_nodes_web", ["port"], {
          unique: true,
          name: "preview_nodes_web_port_unique",
        });
      } catch (_) {
        /* may already exist */
      }
    }
  },

  async down(queryInterface) {
    // Destructive reverse not fully supported; restore from backup if needed.
    console.warn("generic preview migration: down() not implemented");
  },
};
