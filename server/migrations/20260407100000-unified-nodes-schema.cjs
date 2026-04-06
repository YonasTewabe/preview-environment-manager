"use strict";

/**
 * Single `nodes` table (frontend | api_service | api_branch), `node_builds`, `node_env_vars`.
 * Drops: preview_*, branches, url_configs, project_environments.
 * Reverts projects.tag to frontend/backend.
 */

async function tableExists(queryInterface, name) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    { replacements: [name] },
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

async function tryDropFk(queryInterface, table, column) {
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

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;

    if (
      (await tableExists(queryInterface, "nodes")) &&
      (await columnExists(queryInterface, "nodes", "role")) &&
      (await tableExists(queryInterface, "node_builds"))
    ) {
      console.log("unified nodes migration: already applied, skipping");
      return;
    }

    await queryInterface.sequelize.query("DROP TABLE IF EXISTS `node_env_vars`");
    await queryInterface.sequelize.query("DROP TABLE IF EXISTS `node_builds`");
    await queryInterface.sequelize.query("DROP TABLE IF EXISTS `nodes`");

    await queryInterface.sequelize.query(`
      CREATE TABLE \`nodes\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`project_id\` INT NOT NULL,
        \`created_by\` INT NOT NULL,
        \`parent_node_id\` INT NULL,
        \`role\` ENUM('frontend','api_service','api_branch') NOT NULL,
        \`service_name\` VARCHAR(255) NOT NULL,
        \`description\` TEXT NULL,
        \`type\` ENUM('api','service','database','cache','queue','storage') NULL DEFAULT 'api',
        \`repository_name\` VARCHAR(255) NULL,
        \`repo_url\` VARCHAR(500) NULL,
        \`branch_name\` VARCHAR(100) NULL,
        \`env_name\` VARCHAR(100) NULL,
        \`port\` INT NULL UNIQUE,
        \`build_number\` INT NULL,
        \`build_status\` ENUM('pending','building','success','failed','cancelled') NULL DEFAULT 'pending',
        \`build_result\` VARCHAR(100) NULL,
        \`build_url\` VARCHAR(500) NULL,
        \`preview_link\` VARCHAR(500) NULL,
        \`domain_name\` VARCHAR(500) NULL,
        \`status\` ENUM('active','inactive','deleted') NULL DEFAULT 'active',
        \`is_approved\` TINYINT(1) NULL DEFAULT 0,
        \`is_deleted\` TINYINT(1) NULL DEFAULT 0,
        \`default_url\` VARCHAR(500) NULL,
        \`jenkins_job\` VARCHAR(255) NULL,
        \`jenkins_job_url\` VARCHAR(500) NULL,
        \`deployment_url\` VARCHAR(500) NULL,
        \`environment\` ENUM('development','staging','production','preview') NULL DEFAULT 'preview',
        \`last_build_date\` DATETIME NULL,
        \`created_at_build\` DATETIME NULL,
        \`url_configs\` JSON NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`nodes_project_id\` (\`project_id\`),
        INDEX \`nodes_parent\` (\`parent_node_id\`),
        INDEX \`nodes_role\` (\`role\`),
        INDEX \`nodes_deleted\` (\`is_deleted\`),
        CONSTRAINT \`nodes_project_fk\` FOREIGN KEY (\`project_id\`) REFERENCES \`projects\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`nodes_user_fk\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`nodes_parent_fk\` FOREIGN KEY (\`parent_node_id\`) REFERENCES \`nodes\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`node_builds\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`node_id\` INT NOT NULL,
        \`build_number\` INT NOT NULL,
        \`built_at\` DATETIME NOT NULL,
        \`status\` VARCHAR(32) NOT NULL DEFAULT 'success',
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`node_builds_node\` (\`node_id\`),
        CONSTRAINT \`node_builds_node_fk\` FOREIGN KEY (\`node_id\`) REFERENCES \`nodes\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`node_env_vars\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`node_id\` INT NOT NULL,
        \`key\` VARCHAR(255) NOT NULL,
        \`value\` TEXT NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`unique_node_env_key\` (\`node_id\`, \`key\`),
        CONSTRAINT \`node_env_vars_node_fk\` FOREIGN KEY (\`node_id\`) REFERENCES \`nodes\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const webTable = (await tableExists(queryInterface, "preview_nodes_web"))
      ? "preview_nodes_web"
      : (await tableExists(queryInterface, "frontend_nodes"))
        ? "frontend_nodes"
        : null;
    const apiTable = (await tableExists(queryInterface, "preview_nodes_api"))
      ? "preview_nodes_api"
      : (await tableExists(queryInterface, "backend_nodes"))
        ? "backend_nodes"
        : null;

    const mapWeb = new Map();
    const mapApi = new Map();

    const insertId = async () => {
      const [[row]] = await sequelize.query("SELECT LAST_INSERT_ID() AS nid");
      return row.nid;
    };

    if (webTable) {
      const [webRows] = await sequelize.query(`SELECT * FROM \`${webTable}\``);
      for (const row of webRows) {
        await sequelize.query(
          `INSERT INTO \`nodes\` (
            project_id, created_by, role, parent_node_id, service_name, description, type,
            repository_name, repo_url, branch_name, env_name, port, build_number, build_status,
            preview_link, domain_name, status, is_approved, is_deleted, created_at, updated_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          {
            replacements: [
              row.project_id,
              row.created_by,
              "frontend",
              null,
              row.service_name,
              row.description ?? null,
              row.type || "api",
              row.repository_name,
              row.repo_url,
              row.branch_name ?? "main",
              row.env_name ?? null,
              row.port ?? null,
              row.build_number ?? null,
              row.build_status || "pending",
              row.preview_link ?? null,
              row.domain_name ?? null,
              row.status || "active",
              row.is_approved ? 1 : 0,
              row.is_deleted ? 1 : 0,
              row.created_at || new Date(),
              row.updated_at || new Date(),
            ],
          },
        );
        const nid = await insertId();
        mapWeb.set(row.id, nid);
      }

      if (await tableExists(queryInterface, "url_configs")) {
        for (const [oldWid, newId] of mapWeb) {
          const [cfgs] = await sequelize.query(
            `SELECT id, name, url, description, service_type, default_url FROM url_configs
             WHERE (web_node_id = ? OR frontnode_id = ?) AND is_deleted = 0`,
            { replacements: [oldWid, oldWid] },
          );
          if (cfgs.length) {
            const payload = cfgs.map((c) => ({
              id: c.id,
              name: c.name,
              url: c.url,
              description: c.description || "",
              serviceType: c.service_type || "api",
              defaultUrl: c.default_url || null,
            }));
            await sequelize.query(
              `UPDATE nodes SET url_configs = ? WHERE id = ?`,
              { replacements: [JSON.stringify(payload), newId] },
            );
          }
        }
      }

      const envTable = (await tableExists(queryInterface, "preview_node_web_env_vars"))
        ? "preview_node_web_env_vars"
        : (await tableExists(queryInterface, "frontend_node_env_vars"))
          ? "frontend_node_env_vars"
          : null;
      const envFk = envTable === "preview_node_web_env_vars" ? "web_node_id" : "frontnode_id";
      if (envTable) {
        const [evs] = await sequelize.query(`SELECT * FROM \`${envTable}\``);
        for (const e of evs) {
          const oldN = e[envFk];
          const newN = mapWeb.get(oldN);
          if (!newN) continue;
          await sequelize.query(
            `INSERT INTO node_env_vars (node_id, \`key\`, value, created_at, updated_at) VALUES (?,?,?,?,?)`,
            {
              replacements: [
                newN,
                e.key,
                e.value ?? null,
                e.created_at || new Date(),
                e.updated_at || new Date(),
              ],
            },
          );
        }
      }

      const buildTable = (await tableExists(queryInterface, "preview_node_web_builds"))
        ? "preview_node_web_builds"
        : (await tableExists(queryInterface, "frontend_node_builds"))
          ? "frontend_node_builds"
          : null;
      const buildFk = buildTable === "preview_node_web_builds" ? "web_node_id" : "frontnode_id";
      if (buildTable) {
        const [builds] = await sequelize.query(`SELECT * FROM \`${buildTable}\``);
        for (const b of builds) {
          const oldN = b[buildFk];
          const newN = mapWeb.get(oldN);
          if (!newN) continue;
          const st = b.status || "success";
          await sequelize.query(
            `INSERT INTO node_builds (node_id, build_number, built_at, status, created_at, updated_at) VALUES (?,?,?,?,?,?)`,
            {
              replacements: [
                newN,
                b.build_number,
                b.built_at,
                st,
                b.created_at || new Date(),
                b.updated_at || new Date(),
              ],
            },
          );
        }
      }
    }

    if (apiTable) {
      const [apiRows] = await sequelize.query(`SELECT * FROM \`${apiTable}\``);
      for (const row of apiRows) {
        if (row.project_id == null) continue;
        await sequelize.query(
          `INSERT INTO \`nodes\` (
            project_id, created_by, role, parent_node_id, service_name, description, type,
            repository_name, repo_url, branch_name, env_name, port, build_number, build_status,
            build_result, build_url, preview_link, domain_name, status, is_approved, is_deleted,
            default_url, jenkins_job, jenkins_job_url, deployment_url, environment,
            last_build_date, created_at_build, created_at, updated_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          {
            replacements: [
              row.project_id,
              row.created_by ?? 1,
              "api_service",
              null,
              row.service_name,
              row.description ?? null,
              row.type || "api",
              row.repository_name,
              row.repo_url,
              row.branch_name ?? null,
              row.env_name,
              row.port ?? null,
              row.build_number ?? null,
              row.build_status || "pending",
              row.build_result ?? null,
              row.build_url ?? null,
              row.preview_link ?? null,
              row.domain_name ?? null,
              row.status || "active",
              row.is_approved ? 1 : 0,
              row.is_deleted ? 1 : 0,
              row.default_url || "",
              row.jenkins_job ?? null,
              row.jenkins_job_url ?? null,
              row.deployment_url ?? null,
              row.environment || "preview",
              row.last_build_date ?? null,
              row.created_at_build ?? null,
              row.created_at || new Date(),
              row.updated_at || new Date(),
            ],
          },
        );
        const nid = await insertId();
        mapApi.set(row.id, nid);
      }
    }

    if (await tableExists(queryInterface, "branches")) {
      const [branches] = await sequelize.query(`SELECT * FROM branches`);
      for (const row of branches) {
        const parentNew = mapApi.get(row.node_id);
        if (!parentNew) continue;
        const [[p]] = await sequelize.query(`SELECT project_id FROM nodes WHERE id = ?`, {
          replacements: [parentNew],
        });
        if (!p) continue;
        await sequelize.query(
          `INSERT INTO nodes (
            project_id, created_by, role, parent_node_id, service_name, description,
            build_number, build_result, domain_name, jenkins_job_url, port, preview_link,
            status, is_approved, is_deleted, created_at, updated_at, type
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          {
            replacements: [
              p.project_id,
              row.created_by ?? 1,
              "api_branch",
              parentNew,
              row.name,
              row.description ?? null,
              row.build_number ?? null,
              row.build_result ?? null,
              row.domain_name ?? null,
              row.jenkins_job_url ?? null,
              row.port ?? null,
              row.preview_link ?? null,
              row.status || "active",
              row.is_approved ? 1 : 0,
              row.is_deleted ? 1 : 0,
              row.created_at || new Date(),
              row.updated_at || new Date(),
              "api",
            ],
          },
        );
      }
    }

    const drops = [
      "branches",
      "url_configs",
      "preview_node_web_builds",
      "preview_node_web_env_vars",
      "frontend_node_builds",
      "frontend_node_env_vars",
      "preview_nodes_web",
      "preview_nodes_api",
      "frontend_nodes",
      "backend_nodes",
      "project_environments",
    ];

    for (const t of drops) {
      if (!(await tableExists(queryInterface, t))) continue;
      try {
        await tryDropFk(queryInterface, t, "node_id");
      } catch (_) {
        /* */
      }
      try {
        await tryDropFk(queryInterface, t, "web_node_id");
      } catch (_) {
        /* */
      }
      try {
        await tryDropFk(queryInterface, t, "frontnode_id");
      } catch (_) {
        /* */
      }
      try {
        await queryInterface.sequelize.query(`DROP TABLE IF EXISTS \`${t}\``);
      } catch (e) {
        console.warn(`drop ${t}:`, e.message);
      }
    }

    if (await columnExists(queryInterface, "projects", "tag")) {
      await sequelize.query(`UPDATE projects SET tag = 'frontend' WHERE tag = 'web'`);
      await sequelize.query(`UPDATE projects SET tag = 'backend' WHERE tag = 'api'`);
      await sequelize.query(`
        ALTER TABLE projects MODIFY COLUMN tag ENUM('frontend','backend') NOT NULL;
      `);
    }
  },

  async down() {
    // Irreversible without backup.
  },
};
