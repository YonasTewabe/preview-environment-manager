import { Op } from "sequelize";
import { Node } from "../models/index.js";

/**
 * @returns {Promise<{ ok: true } | { ok: false, error: string, field: string }>}
 */
export async function checkNodeServiceNameUniqueInProject(
  projectId,
  serviceName,
  excludeNodeId,
) {
  const pid = Number.parseInt(String(projectId), 10);
  const sn = String(serviceName ?? "").trim();
  if (!Number.isFinite(pid) || pid <= 0 || !sn) {
    return { ok: true };
  }

  const idFilter =
    excludeNodeId != null && Number.isFinite(Number(excludeNodeId))
      ? { id: { [Op.ne]: Number(excludeNodeId) } }
      : {};

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
  return { ok: true };
}
