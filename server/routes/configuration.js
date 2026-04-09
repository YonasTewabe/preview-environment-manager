import express from "express";
import configurationService from "../services/configurationService.js";

const router = express.Router();

function wantsSecrets(req) {
  const raw = String(req.query?.includeSecrets ?? "").toLowerCase().trim();
  return raw === "1" || raw === "true" || raw === "yes";
}

router.get("/jenkins", async (req, res) => {
  try {
    const settings = await configurationService.getSettingsByCategory("jenkins", {
      includeSecrets: wantsSecrets(req),
    });
    res.json({ settings });
  } catch (error) {
    console.error("Failed to load Jenkins settings:", error);
    res.status(500).json({ error: "Failed to load Jenkins settings" });
  }
});

router.put("/jenkins", async (req, res) => {
  try {
    const settings = Array.isArray(req.body?.settings) ? req.body.settings : [];
    await configurationService.upsertSettings(settings);
    const updated = await configurationService.getSettingsByCategory("jenkins", {
      includeSecrets: true,
    });
    res.json({ message: "Jenkins settings saved", settings: updated });
  } catch (error) {
    console.error("Failed to save Jenkins settings:", error);
    res.status(500).json({ error: "Failed to save Jenkins settings" });
  }
});

router.get("/github", async (req, res) => {
  try {
    const settings = await configurationService.getSettingsByCategory("github", {
      includeSecrets: wantsSecrets(req),
    });
    res.json({ settings });
  } catch (error) {
    console.error("Failed to load GitHub settings:", error);
    res.status(500).json({ error: "Failed to load GitHub settings" });
  }
});

router.put("/github", async (req, res) => {
  try {
    const settings = Array.isArray(req.body?.settings) ? req.body.settings : [];
    await configurationService.upsertSettings(settings);
    const updated = await configurationService.getSettingsByCategory("github", {
      includeSecrets: true,
    });
    res.json({ message: "GitHub settings saved", settings: updated });
  } catch (error) {
    console.error("Failed to save GitHub settings:", error);
    res.status(500).json({ error: "Failed to save GitHub settings" });
  }
});

export default router;
