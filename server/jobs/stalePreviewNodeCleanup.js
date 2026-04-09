import cron from "node-cron";
import dayjs from "dayjs";
import { Op } from "sequelize";
import { Node } from "../models/index.js";
import { deletePreviewDomainViaJenkins } from "../services/jenkinsDeletePreviewDomain.js";

/**
 * Same idea as the UI: only call Jenkins when a successful preview + domain likely exist.
 */
function shouldRemoveDomainFromJenkins(node) {
  const domain = node.domain_name && String(node.domain_name).trim();
  if (!domain) return false;
  const status = String(node.build_status ?? "").toLowerCase();
  if (status === "success") return true;
  const link = node.preview_link;
  if (link != null && String(link).trim() !== "") return true;
  return false;
}

export async function runStalePreviewNodeCleanup() {
  const days = Math.max(
    1,
    Number.parseInt(process.env.STALE_PREVIEW_NODE_DAYS ?? "5", 10) || 5,
  );
  const cutoff = dayjs().subtract(days, "day").toDate();

  const stale = await Node.findAll({
    where: {
      role: { [Op.in]: ["frontend", "api_service"] },
      is_deleted: false,
      [Op.or]: [
        { last_build_at: { [Op.lt]: cutoff } },
        {
          [Op.and]: [
            { last_build_at: { [Op.is]: null } },
            { created_at: { [Op.lt]: cutoff } },
          ],
        },
      ],
    },
  });

  if (stale.length === 0) {
    console.warn("[stale-preview-cleanup] No stale preview nodes found.");
    return;
  }

  console.warn(
    `[stale-preview-cleanup] Found ${stale.length} stale preview node(s) (older than ${days}d).`,
  );

  for (const node of stale) {
    const id = node.id;
    const label = node.service_name || id;
    try {
      if (shouldRemoveDomainFromJenkins(node)) {
        const domain = String(node.domain_name).trim();
        const jResult = await deletePreviewDomainViaJenkins(domain);
        if (jResult.success) {
          console.warn(
            `[stale-preview-cleanup] Jenkins preview teardown ok for node ${id} (${label}), domain=${domain} (DB row kept).`,
          );
        } else {
          console.warn(
            `[stale-preview-cleanup] Jenkins delete failed for node ${id} (${label}), domain=${domain}:`,
            jResult.message,
          );
        }
      } else {
        console.warn(
          `[stale-preview-cleanup] Skipped Jenkins for stale node ${id} (${label}) — no domain / preview to tear down.`,
        );
      }
    } catch (err) {
      console.error(
        `[stale-preview-cleanup] Failed on node ${id} (${label}):`,
        err?.message || err,
      );
    }
  }
}

export function scheduleStalePreviewNodeCleanup() {
  if (process.env.DISABLE_STALE_PREVIEW_NODE_CRON === "1") {
    console.warn(
      "⏭️ Stale preview node cron disabled (DISABLE_STALE_PREVIEW_NODE_CRON=1).",
    );
    return;
  }

  const schedule = process.env.STALE_PREVIEW_NODE_CRON?.trim() || "0 2 * * *";
  cron.schedule(schedule, () => {
    runStalePreviewNodeCleanup().catch((err) => {
      console.error("[stale-preview-cleanup] Scheduled run failed:", err);
    });
  });
}
