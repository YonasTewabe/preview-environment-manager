import cron from "node-cron";
import dayjs from "dayjs";
import { Op } from "sequelize";
import { Node } from "../models/index.js";
import { deletePreviewDomainViaJenkins } from "../services/jenkinsDeletePreviewDomain.js";
import configurationService from "../services/configurationService.js";

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
  const systemConfig = await configurationService.getSystemConfig();
  const days = Math.max(1, Number(systemConfig.stalePreviewNodeDays) || 5);
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
      let jenkinsOk = true;
      if (shouldRemoveDomainFromJenkins(node)) {
        const domain = String(node.domain_name).trim();
        const jResult = await deletePreviewDomainViaJenkins(domain);
        if (jResult.success) {
          console.warn(
            `[stale-preview-cleanup] Jenkins preview teardown ok for node ${id} (${label}), domain=${domain} (DB row kept).`,
          );
        } else {
          jenkinsOk = false;
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

      // Soft-delete stale nodes so they move out of active lists and into Trash.
      await node.update({
        is_deleted: true,
        status: "deleted",
      });
      console.warn(
        `[stale-preview-cleanup] Node ${id} (${label}) moved to trash${jenkinsOk ? "" : " (after Jenkins failure)"}.`,
      );
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

  const schedule = "0 2 * * *";
  console.warn(`[stale-preview-cleanup] Cron scheduled: "${schedule}"`);
  cron.schedule(schedule, () => {
    runStalePreviewNodeCleanup().catch((err) => {
      console.error("[stale-preview-cleanup] Scheduled run failed:", err);
    });
  });
}
