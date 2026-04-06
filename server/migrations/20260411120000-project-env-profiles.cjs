"use strict";

/**
 * Multiple named env profiles per project (dev/staging/prod), variables scoped by profile_id.
 * Nodes reference project_env_profile_id (fallback: project default profile).
 */

async function tableExists(queryInterface, table) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    { replacements: [table] },
  );
  return rows.length > 0;
}

function slugify(name, id) {
  const raw = String(name ?? "").trim().toLowerCase();
  let s = raw.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!s) s = `env-${id}`;
  return s.slice(0, 64);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await tableExists(queryInterface, "projects"))) return;

    if (!(await tableExists(queryInterface, "project_env_profiles"))) {
      await queryInterface.createTable("project_env_profiles", {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        project_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "projects", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        name: { type: Sequelize.STRING(255), allowNull: false },
        slug: { type: Sequelize.STRING(64), allowNull: false },
        is_default: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal(
            "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
          ),
        },
      });

      await queryInterface.addIndex(
        "project_env_profiles",
        ["project_id", "slug"],
        {
          unique: true,
          name: "uniq_project_env_profile_slug",
        },
      );
      await queryInterface.addIndex("project_env_profiles", ["project_id"], {
        name: "idx_project_env_profiles_project",
      });
    }

    const q = queryInterface.sequelize;
    const [existingProfiles] = await q.query(
      `SELECT id FROM project_env_profiles LIMIT 1`,
    );
    if (!existingProfiles.length) {
      const [projects] = await q.query(
        `SELECT id, env_name, short_code FROM projects ORDER BY id ASC`,
      );
      const usedSlugsByProject = new Map();
      for (const p of projects) {
        const pid = p.id;
        const displayName =
          (p.env_name && String(p.env_name).trim()) ||
          `${String(p.short_code || "").trim() || "project"}-default`;
        let base = slugify(displayName, pid);
        let slug = base;
        let n = 0;
        const set = usedSlugsByProject.get(pid) || new Set();
        while (set.has(slug)) {
          n += 1;
          slug = `${base}-${n}`.slice(0, 64);
        }
        set.add(slug);
        usedSlugsByProject.set(pid, set);

        await q.query(
          `INSERT INTO project_env_profiles (project_id, name, slug, is_default, created_at, updated_at)
           VALUES (?, ?, ?, 1, NOW(), NOW())`,
          { replacements: [pid, displayName, slug] },
        );
      }
    }

    const envDesc = await queryInterface.describeTable("environments");
    if (!envDesc.profile_id) {
      await queryInterface.addColumn("environments", "profile_id", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "project_env_profiles",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });

      await q.query(`
        UPDATE environments e
        INNER JOIN project_env_profiles pep
          ON pep.project_id = e.project_id AND pep.is_default = 1
        SET e.profile_id = pep.id
        WHERE e.profile_id IS NULL
      `);

      await q.query(`
        DELETE FROM environments WHERE profile_id IS NULL
      `);

      try {
        await queryInterface.removeIndex(
          "environments",
          "unique_project_env_variable",
        );
      } catch {
        /* */
      }

      await queryInterface.addIndex(
        "environments",
        ["profile_id", "env_variable"],
        {
          unique: true,
          name: "unique_profile_env_variable",
        },
      );

      await q.query(
        "ALTER TABLE environments MODIFY profile_id INT NOT NULL",
      );

      if (envDesc.env_name) {
        try {
          await queryInterface.removeColumn("environments", "env_name");
        } catch (e) {
          console.warn("Could not drop environments.env_name:", e.message);
        }
      }
    }

    const nodesDesc = await queryInterface.describeTable("nodes");
    if (nodesDesc && !nodesDesc.project_env_profile_id) {
      await queryInterface.addColumn("nodes", "project_env_profile_id", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "project_env_profiles",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      await q.query(`
        UPDATE nodes n
        INNER JOIN project_env_profiles pep
          ON pep.project_id = n.project_id AND pep.is_default = 1
        SET n.project_env_profile_id = pep.id
        WHERE n.project_env_profile_id IS NULL
      `);
    }

    try {
      const indexes = await queryInterface.showIndex("projects");
      const names = new Set(
        (indexes || []).map((i) => i.name || i.Key_name).filter(Boolean),
      );
      for (const idxName of [
        "projects_env_name_unique",
        "env_name",
        "projects_env_name",
      ]) {
        if (names.has(idxName)) {
          await queryInterface.removeIndex("projects", idxName);
        }
      }
    } catch {
      /* */
    }
  },

  async down(queryInterface, Sequelize) {
    const q = queryInterface.sequelize;
    let nodesDesc = {};
    try {
      nodesDesc = await queryInterface.describeTable("nodes");
    } catch {
      return;
    }
    if (nodesDesc.project_env_profile_id) {
      try {
        await queryInterface.removeColumn("nodes", "project_env_profile_id");
      } catch {
        /* */
      }
    }

    let envDesc = {};
    try {
      envDesc = await queryInterface.describeTable("environments");
    } catch {
      /* */
    }
    if (envDesc.profile_id) {
      try {
        await queryInterface.removeIndex(
          "environments",
          "unique_profile_env_variable",
        );
      } catch {
        /* */
      }
      await queryInterface.addColumn("environments", "env_name", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
      await q.query(`
        UPDATE environments e
        INNER JOIN projects p ON p.id = e.project_id
        SET e.env_name = p.env_name
      `);
      await queryInterface.removeColumn("environments", "profile_id");
      await queryInterface.addIndex(
        "environments",
        ["project_id", "env_variable"],
        {
          unique: true,
          name: "unique_project_env_variable",
        },
      );
    }

    if (await tableExists(queryInterface, "project_env_profiles")) {
      await queryInterface.dropTable("project_env_profiles");
    }
  },
};
