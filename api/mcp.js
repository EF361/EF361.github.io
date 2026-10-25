/**
 * ============================================================================
 * VERCEL SERVERLESS MCP ENDPOINT (/api/mcp)
 * ============================================================================
 * Streamable HTTP Model Context Protocol (MCP) server for Claude.ai and Claude Mobile.
 * Enables AI models to inspect, edit, add projects, and publish to Alicia's portfolio
 * directly via the GitHub REST API.
 */

import vm from "node:vm";

const GITHUB_OWNER = "EF361";
const GITHUB_REPO = "EF361.github.io";
const GITHUB_BRANCH = "main";

/**
 * Returns available MCP tools and their JSON schemas
 */
function getToolDefinitions() {
    return [
        {
            name: "list_portfolio_projects",
            description: "Lists all current showcase projects in the portfolio, including titles, descriptions, tags, demo URLs, and GitHub links.",
            inputSchema: {
                type: "object",
                properties: {},
                required: []
            }
        },
        {
            name: "scan_github_repos",
            description: "Scans GitHub for public repositories owned by EF361 and identifies repositories not yet showcased in the portfolio.",
            inputSchema: {
                type: "object",
                properties: {
                    username: { type: "string", description: "GitHub username (default: EF361)" }
                },
                required: []
            }
        },
        {
            name: "add_or_update_project",
            description: "Safely registers a new project or modifies an existing project in projects.js and github-url.txt, and commits changes directly to GitHub.",
            inputSchema: {
                type: "object",
                properties: {
                    id: { type: "string", description: "Project slug identifier (e.g. 'smart-ai' or 'passgen')" },
                    title: { type: "string", description: "Display title for the project" },
                    description: { type: "string", description: "1-2 sentence engineering description" },
                    tags: { type: "array", items: { type: "string" }, description: "Tags e.g. ['React', 'TypeScript']" },
                    demoUrl: { type: "string", description: "Optional live deployment URL" },
                    githubUrl: { type: "string", description: "Optional GitHub repository URL" },
                    autoCaptureScreenshot: { type: "boolean", description: "Whether to capture live demo screenshot via Microlink (default: true)" }
                },
                required: ["id", "title", "description", "tags"]
            }
        },
        {
            name: "capture_project_screenshot",
            description: "Captures a live preview screenshot of a web application and commits it to images/projects/<id>/preview.png on GitHub.",
            inputSchema: {
                type: "object",
                properties: {
                    id: { type: "string", description: "Project slug identifier" },
                    url: { type: "string", description: "Live URL to screenshot" }
                },
                required: ["id", "url"]
            }
        },
        {
            name: "list_blog_posts",
            description: "Lists all published blog articles from posts.js.",
            inputSchema: {
                type: "object",
                properties: {},
                required: []
            }
        },
        {
            name: "add_or_update_blog_post",
            description: "Adds or updates a blog post in posts.js and commits directly to GitHub.",
            inputSchema: {
                type: "object",
                properties: {
                    id: { type: "string", description: "Post slug identifier (e.g. 'dentai-analytics')" },
                    title: { type: "string", description: "Post title" },
                    date: { type: "string", description: "Publication date (e.g. 'Oct 2026')" },
                    readTime: { type: "string", description: "Read time estimate (e.g. '5 min read')" },
                    tags: { type: "array", items: { type: "string" }, description: "Tags" },
                    excerpt: { type: "string", description: "Short summary" },
                    content: { type: "string", description: "HTML body content" },
                    appId: { type: "string", description: "Linked project ID (optional)" },
                    appUrl: { type: "string", description: "Demo URL (optional)" }
                },
                required: ["id", "title", "date", "excerpt", "content"]
            }
        }
    ];
}

/**
 * Resolves the GitHub token from environment variables or request headers
 */
function getEffectiveToken(req) {
    const authHeader = req.headers.authorization || "";
    if (authHeader.startsWith("Bearer ")) {
        return authHeader.slice(7).trim();
    }
    return req.headers["x-github-token"] || process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN || "";
}

/**
 * Fetches file content and SHA from GitHub
 */
async function fetchGitHubFile(token, filePath) {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`;
    const headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "AliciaGoh-Portfolio-MCP/1.0"
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub fetch error (${res.status}): ${res.statusText}`);

    const data = await res.json();
    const content = Buffer.from(data.content, "base64").toString("utf8");
    return { sha: data.sha, content };
}

/**
 * Commits a file update or creation directly to GitHub
 */
async function commitGitHubFile(token, filePath, contentBufferOrString, message, existingSha = null) {
    if (!token) {
        throw new Error("Missing GitHub token. Please set GITHUB_TOKEN in your Vercel Environment Variables or pass Bearer token.");
    }

    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;
    const base64Content = Buffer.isBuffer(contentBufferOrString)
        ? contentBufferOrString.toString("base64")
        : Buffer.from(contentBufferOrString, "utf8").toString("base64");

    const body = {
        message,
        content: base64Content,
        branch: GITHUB_BRANCH
    };
    if (existingSha) body.sha = existingSha;

    const res = await fetch(url, {
        method: "PUT",
        headers: {
            "Accept": "application/vnd.github.v3+json",
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            "User-Agent": "AliciaGoh-Portfolio-MCP/1.0"
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`GitHub commit error (${res.status}): ${errorText}`);
    }

    return await res.json();
}

/**
 * Evaluates and parses projects.js code
 */
function parseProjectsJs(code) {
    const sandbox = {};
    const runner = `${code}\n;({ projectMetadata: typeof projectMetadata !== 'undefined' ? projectMetadata : {}, projectAssetFallback: typeof projectAssetFallback !== 'undefined' ? projectAssetFallback : {} })`;
    return vm.runInNewContext(runner, sandbox);
}

/**
 * Parses github-url.txt
 */
function parseGithubUrlTxt(text) {
    const entries = {};
    let currentId = null;
    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line) continue;
        const gh = line.match(/^github\s*:\s*(.+)$/i);
        const url = line.match(/^url\s*:\s*(.+)$/i);
        if (gh && currentId) {
            entries[currentId] = entries[currentId] || {};
            entries[currentId].githubUrl = gh[1].trim();
        } else if (url && currentId) {
            entries[currentId] = entries[currentId] || {};
            entries[currentId].demoUrl = url[1].trim();
        } else {
            currentId = line.replace(/:\s*$/, "").trim().toLowerCase().replace(/\s+/g, "-");
            entries[currentId] = entries[currentId] || {};
        }
    }
    return entries;
}

/**
 * Serializes github-url.txt
 */
function serializeGithubUrlTxt(entries) {
    const blocks = [];
    for (const [id, data] of Object.entries(entries)) {
        const lines = [id];
        if (data.demoUrl) lines.push(`url: ${data.demoUrl}`);
        if (data.githubUrl) lines.push(`GitHub: ${data.githubUrl}`);
        blocks.push(lines.join("\n"));
    }
    return blocks.join("\n\n") + "\n";
}

/**
 * Downloads screenshot via Microlink API
 */
async function fetchMicrolinkScreenshot(targetUrl) {
    const apiUrl = `https://api.microlink.io?url=${encodeURIComponent(targetUrl)}&screenshot=true&meta=false`;
    const res = await fetch(apiUrl, {
        headers: { "User-Agent": "AliciaGoh-Portfolio-Sync/1.0" },
        signal: AbortSignal.timeout(30000)
    });
    if (!res.ok) throw new Error(`Microlink responded with status ${res.status}`);

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("image/")) {
        return Buffer.from(await res.arrayBuffer());
    }
    const data = await res.json();
    const screenshotUrl = data?.data?.screenshot?.url;
    if (!screenshotUrl) throw new Error("No screenshot URL returned by Microlink");

    const imgRes = await fetch(screenshotUrl, { signal: AbortSignal.timeout(30000) });
    return Buffer.from(await imgRes.arrayBuffer());
}

/**
 * Executes requested MCP tool
 */
async function executeTool(name, args, token) {
    switch (name) {
        case "list_portfolio_projects": {
            const file = await fetchGitHubFile(token, "projects.js");
            const urlsFile = await fetchGitHubFile(token, "github-url.txt");
            const { projectMetadata, projectAssetFallback } = file ? parseProjectsJs(file.content) : { projectMetadata: {}, projectAssetFallback: {} };
            const urls = urlsFile ? parseGithubUrlTxt(urlsFile.content) : {};

            const ids = [...new Set([...Object.keys(projectMetadata), ...Object.keys(urls)])];
            const projects = ids.map(id => ({
                id,
                title: projectMetadata[id]?.title || id,
                description: projectMetadata[id]?.description || "",
                tags: projectMetadata[id]?.tags || [],
                githubUrl: urls[id]?.githubUrl || "",
                demoUrl: urls[id]?.demoUrl || "",
                fallbackAssets: projectAssetFallback[id] || []
            }));

            return { total: projects.length, projects };
        }

        case "scan_github_repos": {
            const username = args.username || "EF361";
            const file = await fetchGitHubFile(token, "projects.js");
            const { projectMetadata } = file ? parseProjectsJs(file.content) : { projectMetadata: {} };
            const existingSet = new Set(Object.keys(projectMetadata).map(k => k.toLowerCase().replace(/[^a-z0-9]/g, "")));

            const ghRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=pushed&per_page=100`, {
                headers: {
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "AliciaGoh-Portfolio-MCP/1.0",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                }
            });
            if (!ghRes.ok) throw new Error(`GitHub error: ${ghRes.status}`);
            const repos = await ghRes.json();

            const unregistered = [];
            const registered = [];
            for (const repo of repos) {
                if (repo.fork || repo.name.toLowerCase() === `${username.toLowerCase()}.github.io`) continue;
                const normalized = repo.name.toLowerCase().replace(/[^a-z0-9]/g, "");
                const summary = {
                    id: repo.name.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
                    name: repo.name,
                    githubUrl: repo.html_url,
                    demoUrl: repo.homepage || "",
                    description: repo.description || "",
                    language: repo.language || "",
                    topics: repo.topics || []
                };
                if (existingSet.has(normalized)) registered.push(summary);
                else unregistered.push(summary);
            }

            return { total: repos.length, unregistered, registered };
        }

        case "add_or_update_project": {
            const { id, title, description, tags, demoUrl, githubUrl, autoCaptureScreenshot = true } = args;
            const normalizedId = id.toLowerCase().replace(/[^a-z0-9_-]/g, "-");

            // 1. Fetch current projects.js
            const projectsFile = await fetchGitHubFile(token, "projects.js");
            if (!projectsFile) throw new Error("Could not find projects.js in repository");
            const { projectMetadata, projectAssetFallback } = parseProjectsJs(projectsFile.content);

            projectMetadata[normalizedId] = {
                title,
                description,
                tags: Array.isArray(tags) ? tags : [tags]
            };

            // 2. Fetch current github-url.txt
            const urlsFile = await fetchGitHubFile(token, "github-url.txt");
            const urls = urlsFile ? parseGithubUrlTxt(urlsFile.content) : {};
            urls[normalizedId] = urls[normalizedId] || {};
            if (demoUrl) urls[normalizedId].demoUrl = demoUrl;
            if (githubUrl) urls[normalizedId].githubUrl = githubUrl;

            // 3. Handle screenshot if requested
            let screenshotNote = "No screenshot captured";
            if (autoCaptureScreenshot && demoUrl) {
                try {
                    const imgBuffer = await fetchMicrolinkScreenshot(demoUrl);
                    const imagePath = `images/projects/${normalizedId}/preview.png`;
                    const existingImg = await fetchGitHubFile(token, imagePath);
                    await commitGitHubFile(
                        token,
                        imagePath,
                        imgBuffer,
                        `chore: capture preview image for ${normalizedId}`,
                        existingImg?.sha
                    );
                    projectAssetFallback[normalizedId] = [imagePath];
                    screenshotNote = `Screenshot captured and saved to ${imagePath}`;
                } catch (err) {
                    screenshotNote = `Screenshot failed: ${err.message}`;
                }
            } else if (!projectAssetFallback[normalizedId]) {
                projectAssetFallback[normalizedId] = [`images/projects/${normalizedId}/preview.png`];
            }

            // 4. Serialize updated files
            const updatedProjectsJs = `/*
 * Project metadata only. Media is discovered automatically from
 * images/projects/<project-id>/ by app.js when the site runs on GitHub Pages.
 */
const projectMetadata = ${JSON.stringify(projectMetadata, null, 4)};

/* Offline/local fallback. GitHub discovery replaces these lists when available. */
const projectAssetFallback = ${JSON.stringify(projectAssetFallback, null, 4)};
`;
            const updatedGithubUrlTxt = serializeGithubUrlTxt(urls);

            // 5. Commit both to GitHub
            await commitGitHubFile(
                token,
                "projects.js",
                updatedProjectsJs,
                `feat(portfolio): add/update project ${normalizedId}`,
                projectsFile.sha
            );
            await commitGitHubFile(
                token,
                "github-url.txt",
                updatedGithubUrlTxt,
                `chore: update github-url.txt for ${normalizedId}`,
                urlsFile?.sha
            );

            return {
                success: true,
                message: `Project "${normalizedId}" was committed to GitHub! Vercel redeployment is automatically triggered.`,
                screenshot: screenshotNote,
                project: { id: normalizedId, title, description, tags, demoUrl, githubUrl }
            };
        }

        case "capture_project_screenshot": {
            const { id, url } = args;
            const imgBuffer = await fetchMicrolinkScreenshot(url);
            const imagePath = `images/projects/${id}/preview.png`;
            const existingImg = await fetchGitHubFile(token, imagePath);
            await commitGitHubFile(
                token,
                imagePath,
                imgBuffer,
                `chore: capture preview image for ${id}`,
                existingImg?.sha
            );
            return {
                success: true,
                message: `Captured and committed screenshot to ${imagePath} on GitHub.`
            };
        }

        case "list_blog_posts": {
            const file = await fetchGitHubFile(token, "posts.js");
            if (!file) return { posts: [] };
            const sandbox = {};
            vm.runInNewContext(`${file.content}\n;({ blogPosts: typeof blogPosts !== 'undefined' ? blogPosts : [] })`, sandbox);
            const posts = sandbox.blogPosts || [];
            return {
                total: posts.length,
                posts: posts.map(p => ({ id: p.id, title: p.title, date: p.date, tags: p.tags, excerpt: p.excerpt }))
            };
        }

        case "add_or_update_blog_post": {
            const { id, title, date, readTime = "4 min read", tags = [], excerpt, content, appId = "", appUrl = "" } = args;
            const normalizedId = id.toLowerCase().replace(/[^a-z0-9_-]/g, "-");

            const file = await fetchGitHubFile(token, "posts.js");
            if (!file) throw new Error("Could not find posts.js in repository");
            const sandbox = {};
            vm.runInNewContext(`${file.content}\n;({ blogPosts: typeof blogPosts !== 'undefined' ? blogPosts : [] })`, sandbox);
            const posts = sandbox.blogPosts || [];

            const postData = {
                id: normalizedId,
                title,
                date,
                readTime,
                appId,
                appTitle: title,
                appUrl,
                tags: Array.isArray(tags) ? tags : [tags],
                excerpt,
                content
            };

            const idx = posts.findIndex(p => p.id === normalizedId);
            if (idx >= 0) posts[idx] = { ...posts[idx], ...postData };
            else posts.unshift(postData);

            const updatedPostsJs = `/**
 * ============================================================================
 * BLOG POSTS DATABASE & REPOSITORY
 * ============================================================================
 */

const blogPosts = ${JSON.stringify(posts, null, 2)};
`;

            await commitGitHubFile(
                token,
                "posts.js",
                updatedPostsJs,
                `feat(blog): ${idx >= 0 ? "update" : "publish"} blog post ${normalizedId}`,
                file.sha
            );

            return {
                success: true,
                action: idx >= 0 ? "updated" : "published",
                message: `Blog post "${normalizedId}" was committed to GitHub! Vercel redeployment is triggered.`
            };
        }

        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}

/**
 * Main Vercel serverless request handler
 */
export default async function handler(req, res) {
    // 1. Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Mcp-Session-Id, x-github-token");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    // 2. Friendly status check for GET requests
    if (req.method === "GET") {
        return res.status(200).json({
            status: "active",
            service: "Alicia Goh Portfolio Remote MCP Server",
            version: "1.0.0",
            protocol: "Model Context Protocol (Streamable HTTP)",
            endpoint: "https://alicia-goh-portfolio.vercel.app/api/mcp",
            toolsAvailable: getToolDefinitions().map(t => t.name),
            instructions: "Configure this URL as a Custom Connector in Claude.ai (Settings > Connectors > Add connector > Remote)."
        });
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed. Use POST for MCP JSON-RPC requests." });
    }

    // 3. Process MCP JSON-RPC
    const token = getEffectiveToken(req);
    const body = req.body || {};
    const { jsonrpc, id, method, params = {} } = body;

    try {
        switch (method) {
            case "initialize": {
                return res.status(200).json({
                    jsonrpc: "2.0",
                    id,
                    result: {
                        protocolVersion: "2024-11-05",
                        capabilities: {
                            tools: {}
                        },
                        serverInfo: {
                            name: "alicia-portfolio-remote-mcp",
                            version: "1.0.0"
                        }
                    }
                });
            }

            case "notifications/initialized": {
                return res.status(200).json({ jsonrpc: "2.0", result: {} });
            }

            case "ping": {
                return res.status(200).json({ jsonrpc: "2.0", id, result: {} });
            }

            case "tools/list": {
                return res.status(200).json({
                    jsonrpc: "2.0",
                    id,
                    result: {
                        tools: getToolDefinitions()
                    }
                });
            }

            case "tools/call": {
                const { name, arguments: toolArgs = {} } = params;
                const toolResult = await executeTool(name, toolArgs, token);
                return res.status(200).json({
                    jsonrpc: "2.0",
                    id,
                    result: {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(toolResult, null, 2)
                            }
                        ]
                    }
                });
            }

            default:
                return res.status(200).json({
                    jsonrpc: "2.0",
                    id,
                    error: {
                        code: -32601,
                        message: `Method '${method}' not found`
                    }
                });
        }
    } catch (err) {
        return res.status(200).json({
            jsonrpc: "2.0",
            id,
            error: {
                code: -32603,
                message: err.message
            }
        });
    }
}
