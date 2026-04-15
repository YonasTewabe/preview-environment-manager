import { Op } from "sequelize";
import { Node } from "../models/index.js";

/**
 * Service name must be unique among all nodes in the project.
 * Branch must be unique among top-level preview nodes (frontend + api_service, no parent).
 *
 * @param {string|undefined|null} branchName - when set, enforces branch uniqueness for top-level deploy nodes
 * @returns {Promise<{ ok: true } | { ok: false, error: string, field: string }>}
 */
export async function checkNodeServiceNameUniqueInProject(
  projectId,
  serviceName,
  excludeNodeId,
  branchName,
) {
  const pid = String(projectId ?? "").trim();
  const sn = String(serviceName ?? "").trim();
  if (!pid) {
    return { ok: true };
  }

  const idFilter =
    excludeNodeId != null && String(excludeNodeId).trim()
      ? { id: { [Op.ne]: String(excludeNodeId).trim() } }
      : {};

  if (sn) {
    const rows = await Node.findAll({
      where: {
        project_id: pid,
        is_deleted: false,
        ...idFilter,
      },
      attributes: ["id", "service_name"],
    });

    const target = sn.toLowerCase();
    for (const r of rows) {
      if (String(r.service_name ?? "").trim().toLowerCase() === target) {
        return {
          ok: false,
          error: "A node with this name already exists in this project.",
          field: "service_name",
        };
      }
    }
  }

  const bn = String(branchName ?? "").trim();
  if (bn) {
    const branchTarget = bn.toLowerCase();
    const branchRows = await Node.findAll({
      where: {
        project_id: pid,
        is_deleted: false,
        parent_node_id: null,
        role: { [Op.in]: ["frontend", "api_service"] },
        ...idFilter,
      },
      attributes: ["id", "branch_name"],
    });
    for (const r of branchRows) {
      if (
        String(r.branch_name ?? "").trim().toLowerCase() === branchTarget
      ) {
        return {
          ok: false,
          error:
            "Another node in this project already uses this Git branch. Choose a different branch.",
          field: "branch_name",
        };
      }
    }
  }

  return { ok: true };
}
