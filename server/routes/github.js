import { Router } from "express";
import axios from "axios";
import configurationService from "../services/configurationService.js";
const router = Router();

function trimBase(url) {
  return String(url || "").replace(/\/+$/, "");
}

async function githubAPI() {
  const cfg = await configurationService.getGitHubConfig();
  return {
    cfg,
    client: axios.create({
      baseURL: trimBase(cfg.apiBase) || "https://api.github.com",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        Accept: "application/vnd.github+json",
      },
    }),
  };
}

router.get("/repos", async (req, res) => {
  try {
    const { cfg, client } = await githubAPI();
    let allRepos = [];
    let page = 1;
    const per_page = 100;
    let fetched;
    do {
      const response = await client.get(`/orgs/${cfg.org}/repos`, {
        params: { per_page, page },
      });
      fetched = response.data;
      allRepos = allRepos.concat(fetched);
      page++;
    } while (fetched.length === per_page);
    res.json(allRepos.map((repo) => ({ name: repo.name })));
  } catch (err) {
    console.error("Error fetching repos:", err.message);
    res.status(500).json({ error: "Failed to fetch repos" });
  }
});

router.get("/branches", async (req, res) => {
  const { repo, org } = req.query;
  if (!repo) return res.status(400).json({ error: "Repo is required" });

  try {
    const { cfg, client } = await githubAPI();
    const organization = org || cfg.org;
    let allBranches = [];
    let page = 1;
    const per_page = 100;
    let fetched;
    do {
      const response = await client.get(
        `/repos/${organization}/${repo}/branches`,
        { params: { per_page, page } }
      );
      fetched = response.data;
      allBranches = allBranches.concat(fetched);
      page++;
    } while (fetched.length === per_page);
    res.json(allBranches.map((branch) => ({ name: branch.name })));
  } catch (err) {
    console.error("Error fetching branches:", err.message);
    res.status(500).json({ error: "Failed to fetch branches" });
  }
});

router.post("/create-pr", async (req, res) => {
  const { owner, repo, branch } = req.body;

  if (!repo || !branch) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const cfg = await configurationService.getGitHubConfig();
    const repoOwner = owner || cfg.org;
    const prTitle = `Preview: Merge ${branch} into preview`;
    const prBody = "Auto-created by PEP Preview UI";

    const response = await axios.post(
      `${trimBase(cfg.apiBase) || "https://api.github.com"}/repos/${repoOwner}/${repo}/pulls`,
      {
        title: prTitle,
        head: branch,
        base: "preview",
        body: prBody,
      },
      {
        headers: {
          Authorization: `Bearer ${cfg.token}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    return res.json({
      url: response.data.html_url,
      number: response.data.number,
      status: "created",
    });
  } catch (err) {
    console.error("Failed to create PR:", err.response?.data || err.message);
    return res.status(500).json({ message: "Failed to create PR", error: err.message });
  }
});

router.post("/pr-status", async (req, res) => {
  const { owner, repo, prNumber } = req.body;

  try {
    const cfg = await configurationService.getGitHubConfig();
    const repoOwner = owner || cfg.org;
    const response = await fetch(
      `${trimBase(cfg.apiBase) || "https://api.github.com"}/repos/${repoOwner}/${repo}/pulls/${prNumber}`,
      {
        headers: {
          Authorization: `Bearer ${cfg.token}`,
          "User-Agent": "jenkins-status-checker"
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ message: data.message });
    }

    return res.json({ merged: data.merged });
  } catch (err) {
    console.error("GitHub PR status error:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
