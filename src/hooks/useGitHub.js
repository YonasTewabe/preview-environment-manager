import { useState, useCallback } from "react";
import { message } from "antd";
import { appApiBase } from "../config/jenkins";

export function useGitHub() {
  const [githubBranches, setGithubBranches] = useState([]);
  const [loadingGithubBranches, setLoadingGithubBranches] = useState(false);

  // GitHub branch fetching function - Updated to fetch ALL branches
  const fetchGithubBranches = useCallback(async (repoUrl, repo_name) => {
    setLoadingGithubBranches(true);
    try {
      const normalizedRepo = String(repoUrl || "")
        .replace("https://github.com/", "")
        .replace(".git", "");
      const repoName = repo_name
        ? repo_name
        : normalizedRepo.includes("/")
          ? normalizedRepo.split("/").slice(1).join("/")
          : normalizedRepo;

      const response = await fetch(
        `${appApiBase()}github/branches?repo=${encodeURIComponent(repoName)}`,
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch branches: ${response.status}`);
      }
      const branchesData = await response.json();
      const branchNames = Array.isArray(branchesData)
        ? branchesData.map((branch) => branch.name)
        : [];
      setGithubBranches(branchNames);
    } catch (error) {
      console.error("Error fetching branches:", error);
      message.error(`Error fetching branches from GitHub: ${error.message}`);
      setGithubBranches([]);
    } finally {
      setLoadingGithubBranches(false);
    }
  }, []);

  return {
    githubBranches,
    loadingGithubBranches,
    fetchGithubBranches,
  };
}
