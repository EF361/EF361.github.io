/**
 * GitHub repository discovery utility for the portfolio.
 */

/**
 * Fetches public repositories for a user and compares them against existing portfolio projects.
 * 
 * @param {string} username - GitHub username (default: 'EF361')
 * @param {string[]} existingProjectIds - Array of existing project IDs
 * @param {string} [token] - Optional GitHub Personal Access Token
 * @returns {Promise<{ totalFound: number, newRepos: Array, registeredRepos: Array }>}
 */
export async function scanGitHubRepositories(username = "EF361", existingProjectIds = [], token = null) {
    const effectiveToken = token || process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    const headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "AliciaGoh-Portfolio-Sync/1.0"
    };

    if (effectiveToken) {
        headers["Authorization"] = `Bearer ${effectiveToken}`;
    }

    const apiUrl = `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=pushed&per_page=100`;
    const response = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(15000) });

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const repos = await response.json();
    const existingSet = new Set(existingProjectIds.map(id => id.toLowerCase().replace(/[^a-z0-9]/g, "")));

    // Exclude the portfolio repository itself
    const ignoredRepos = new Set([`${username.toLowerCase()}.github.io`, "portfolio"]);

    const newRepos = [];
    const registeredRepos = [];

    for (const repo of repos) {
        if (repo.fork) continue;
        if (ignoredRepos.has(repo.name.toLowerCase())) continue;

        const normalizedRepoId = repo.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        const isRegistered = existingSet.has(normalizedRepoId);

        const summary = {
            id: repo.name.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
            name: repo.name,
            githubUrl: repo.html_url,
            demoUrl: repo.homepage || "",
            description: repo.description || "",
            language: repo.language || "",
            topics: Array.isArray(repo.topics) ? repo.topics : [],
            pushedAt: repo.pushed_at,
            stars: repo.stargazers_count
        };

        if (isRegistered) {
            registeredRepos.push(summary);
        } else {
            newRepos.push(summary);
        }
    }

    return {
        totalFound: repos.length,
        newRepos,
        registeredRepos
    };
}
