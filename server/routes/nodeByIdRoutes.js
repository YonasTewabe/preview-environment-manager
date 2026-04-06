import express from "express";
import {
  Node,
  Project,
  User,
  NodeEnvVar,
  ProjectEnvProfile,
} from "../models/index.js";
import { resolveProfileIdForNode } from "../utils/resolveProjectEnvProfile.js";

const router = express.Router();

function withUrlConfigsJson(n) {
  if (!n) return n;
  const plain = n.get ? n.get({ plain: true }) : { ...n };
  const raw = plain.url_configs;
  plain.urlConfigs = Array.isArray(raw) ? raw : [];
  delete plain.url_configs;
  return plain;
}

function mapApiBranch(row) {
  if (!row) return row;
  const p = row.get ? row.get({ plain: true }) : { ...row };
  return {
    ...p,
    name: p.service_name,
    node_id: p.parent_node_id,
  };
}

const baseProjectUserInclude = [
  {
    model: Project,
    as: "project",
    attributes: ["id", "name", "tag", "short_code"],
  },
  {
    model: User,
    as: "creator",
    attributes: ["id", "username", "email"],
  },
  {
    model: ProjectEnvProfile,
    as: "envProfile",
    attributes: ["id", "name", "slug", "is_default"],
    required: false,
  },
];

async function loadPreviewServiceDetail(id, role) {
  let node;
  try {
    node = await Node.findOne({
      where: { id, role, is_deleted: false },
      include: [
        ...baseProjectUserInclude,
        {
          model: NodeEnvVar,
          as: "envOverrides",
          attributes: [
            "id",
            "key",
            "value",
            "project_env_profile_id",
            "created_at",
            "updated_at",
          ],
          required: false,
        },
      ],
    });
  } catch (err) {
    const msg = err?.original?.sqlMessage || err?.message || "";
    if (
      typeof msg === "string" &&
      (msg.includes("node_env_vars") ||
        msg.includes("preview_node_web_env_vars") ||
        msg.includes("frontend_node_env_vars")) &&
      msg.includes("doesn't exist")
    ) {
      node = await Node.findOne({
        where: { id, role, is_deleted: false },
        include: baseProjectUserInclude,
      });
    } else {
      throw err;
    }
  }
  return node;
}

/** GET /api/node/:id — any active preview node by primary key */
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const stub = await Node.findOne({
      where: { id, is_deleted: false },
      attributes: ["id", "role"],
    });
    if (!stub) {
      return res.status(404).json({ error: "Node not found" });
    }

    const { role } = stub;

    if (role === "frontend" || role === "api_service") {
      const previewNode = await loadPreviewServiceDetail(id, role);
      if (!previewNode) {
        return res.status(404).json({ error: "Node not found" });
      }
      const plain = withUrlConfigsJson(previewNode);
      const resolvedProfile = await resolveProfileIdForNode(previewNode);
      if (Array.isArray(plain.envOverrides) && resolvedProfile != null) {
        plain.envOverrides = plain.envOverrides.filter(
          (e) => Number(e.project_env_profile_id) === Number(resolvedProfile),
        );
      }
      return res.json(plain);
    }

    if (role === "api_branch") {
      const branch = await Node.findOne({
        where: { id, role: "api_branch", is_deleted: false },
        include: baseProjectUserInclude,
      });
      if (!branch) {
        return res.status(404).json({ error: "Node not found" });
      }
      return res.json(mapApiBranch(branch));
    }

    return res.status(404).json({ error: "Node not found" });
  } catch (error) {
    console.error("Error fetching node by id:", error);
    res.status(500).json({ error: "Failed to fetch node" });
  }
});

export default router;
