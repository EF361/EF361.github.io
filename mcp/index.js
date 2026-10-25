#!/usr/bin/env node

/**
 * ============================================================================
 * ALICIA GOH PORTFOLIO & GITHUB SYNC MCP SERVER
 * ============================================================================
 * Exposes Model Context Protocol (MCP) tools for AI agents (Cursor, Claude Desktop,
 * Antigravity, etc.) to discover, update, validate, and publish portfolio projects,
 * GitHub repositories, blog posts, and preview assets.
 */

import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

import {
    readProjectsJs,
    writeProjectsJs,
    readGithubUrlTxt,
    writeGithubUrlTxt,
    readPostsJs,
    writePostsJs,
    validatePortfolioHealth
} from "./utils/portfolio-store.js";
import { captureProjectScreenshot } from "./utils/microlink.js";
import { scanGitHubRepositories } from "./utils/github-scanner.js";

const execFileAsync = promisify(execFile);
const ROOT_DIR = path.resolve(import.meta.dirname, "..");

const server = new Server(
    {
        name: "alicia-portfolio-mcp",
        version: "1.0.0"
    },
    {
        capabilities: {
            tools: {}
        }
    }
);

// Register list of available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
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
                description: "Scans GitHub for public repositories owned by the user (default: EF361), and identifies which repositories are not yet registered in the portfolio.",
                inputSchema: {
                    type: "object",
                    properties: {
                        username: {
                            type: "string",
                            description: "GitHub username to scan (default: EF361)"
                        },
                        token: {
                            type: "string",
                            description: "Optional GitHub Personal Access Token to avoid unauthenticated rate limits"
                        }
                    },
                    required: []
                }
            },
            {
                name: "add_or_update_project",
                description: "Safely registers a new project or updates an existing project in projects.js and github-url.txt. Can automatically capture a live preview screenshot.",
                inputSchema: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            description: "Unique slug identifier for the project (e.g. 'smart-recycling-robot' or 'passgen')"
                        },
                        title: {
                            type: "string",
                            description: "Human-readable display title for the project"
                        },
                        description: {
                            type: "string",
                            description: "1-2 concise sentences highlighting the engineering problem solved"
                        },
                        tags: {
                            type: "array",
                            items: { type: "string" },
                            description: "3-4 technical tags (e.g. ['React', 'Next.js', 'TypeScript'])"
                        },
                        demoUrl: {
                            type: "string",
                            description: "Optional live deployment URL (Vercel, Streamlit, etc.)"
                        },
                        githubUrl: {
                            type: "string",
                            description: "Optional GitHub repository URL"
                        },
                        autoCaptureScreenshot: {
                            type: "boolean",
                            description: "Whether to capture a live preview screenshot via Microlink API if demoUrl is provided (default: true)"
                        }
                    },
                    required: ["id", "title", "description", "tags"]
                }
            },
            {
                name: "capture_project_screenshot",
                description: "Captures a live preview screenshot of a web application using Microlink API and saves it directly to images/projects/<id>/preview.png.",
                inputSchema: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            description: "Project slug identifier"
                        },
                        url: {
                            type: "string",
                            description: "Live URL to screenshot"
                        }
                    },
                    required: ["id", "url"]
                }
            },
            {
                name: "list_blog_posts",
                description: "Lists all blog posts currently published in the portfolio's posts.js repository.",
                inputSchema: {
                    type: "object",
                    properties: {},
                    required: []
                }
            },
            {
                name: "add_or_update_blog_post",
                description: "Adds a new blog post or updates an existing post in posts.js.",
                inputSchema: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            description: "Unique post slug (e.g. 'dentai-analytics')"
                        },
                        title: {
                            type: "string",
                            description: "Post title"
                        },
                        date: {
                            type: "string",
                            description: "Publication date display (e.g. 'Oct 2026')"
                        },
                        readTime: {
                            type: "string",
                            description: "Estimated read time (e.g. '5 min read')"
                        },
                        appId: {
                            type: "string",
                            description: "Associated project id from projects.js (optional)"
                        },
                        appTitle: {
                            type: "string",
                            description: "Display title of associated app (optional)"
                        },
                        appUrl: {
                            type: "string",
                            description: "Live demo URL (optional)"
                        },
                        githubUrl: {
                            type: "string",
                            description: "GitHub repository URL (optional)"
                        },
                        coverImage: {
                            type: "string",
                            description: "Relative image path for cover (e.g. 'images/projects/dentai/analytics-page.png')"
                        },
                        tags: {
                            type: "array",
                            items: { type: "string" },
                            description: "List of relevant tags"
                        },
                        excerpt: {
                            type: "string",
                            description: "1-2 sentence summary of what was built and why"
                        },
                        content: {
                            type: "string",
                            description: "HTML formatted body content for the blog post"
                        }
                    },
                    required: ["id", "title", "date", "excerpt", "content"]
                }
            },
            {
                name: "validate_portfolio",
                description: "Validates syntax across projects.js and posts.js, audits referenced media files on disk, and returns a comprehensive health status.",
                inputSchema: {
                    type: "object",
                    properties: {},
                    required: []
                }
            },
            {
                name: "publish_to_portfolio",
                description: "Performs syntax validation, stages all portfolio files, creates a Git commit, and pushes to origin/main (which triggers automatic live Vercel redeployment).",
                inputSchema: {
                    type: "object",
                    properties: {
                        commitMessage: {
                            type: "string",
                            description: "Semantic commit message (e.g. 'feat: sync portfolio projects and visuals for passgen')"
                        }
                    },
                    required: ["commitMessage"]
                }
            }
        ]
    };
});

// Handle tool executions
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;

    try {
        switch (name) {
            case "list_portfolio_projects": {
                const { projectMetadata, projectAssetFallback } = await readProjectsJs(ROOT_DIR);
                const githubUrls = await readGithubUrlTxt(ROOT_DIR);

                const ids = [...new Set([...Object.keys(projectMetadata), ...Object.keys(githubUrls)])];
                const projects = ids.map(id => ({
                    id,
                    title: projectMetadata[id]?.title || id,
                    description: projectMetadata[id]?.description || "",
                    tags: projectMetadata[id]?.tags || [],
                    githubUrl: githubUrls[id]?.githubUrl || "",
                    demoUrl: githubUrls[id]?.demoUrl || "",
                    fallbackAssets: projectAssetFallback[id] || []
                }));

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ count: projects.length, projects }, null, 2)
                        }
                    ]
                };
            }

            case "scan_github_repos": {
                const username = args.username || "EF361";
                const { projectMetadata } = await readProjectsJs(ROOT_DIR);
                const existingIds = Object.keys(projectMetadata);
                const result = await scanGitHubRepositories(username, existingIds, args.token);

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            }

            case "add_or_update_project": {
                const { id, title, description, tags, demoUrl, githubUrl, autoCaptureScreenshot = true } = args;
                const normalizedId = id.toLowerCase().replace(/[^a-z0-9_-]/g, "-");

                const { projectMetadata, projectAssetFallback } = await readProjectsJs(ROOT_DIR);
                const githubUrls = await readGithubUrlTxt(ROOT_DIR);

                // Update metadata
                projectMetadata[normalizedId] = {
                    title,
                    description,
                    tags: Array.isArray(tags) ? tags : [tags]
                };

                // Update links
                githubUrls[normalizedId] = githubUrls[normalizedId] || {};
                if (demoUrl) githubUrls[normalizedId].demoUrl = demoUrl;
                if (githubUrl) githubUrls[normalizedId].githubUrl = githubUrl;

                // Handle screenshot
                let screenshotResult = null;
                if (autoCaptureScreenshot && demoUrl) {
                    try {
                        screenshotResult = await captureProjectScreenshot(ROOT_DIR, normalizedId, demoUrl);
                        projectAssetFallback[normalizedId] = [screenshotResult.relativePath];
                    } catch (err) {
                        screenshotResult = { success: false, error: err.message };
                    }
                } else if (!projectAssetFallback[normalizedId]) {
                    projectAssetFallback[normalizedId] = [`images/projects/${normalizedId}/preview.png`];
                }

                // Save files
                await writeProjectsJs(ROOT_DIR, projectMetadata, projectAssetFallback);
                await writeGithubUrlTxt(ROOT_DIR, githubUrls);

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: true,
                                message: `Project "${normalizedId}" added/updated successfully.`,
                                screenshot: screenshotResult,
                                project: {
                                    id: normalizedId,
                                    title,
                                    description,
                                    tags,
                                    demoUrl,
                                    githubUrl
                                }
                            }, null, 2)
                        }
                    ]
                };
            }

            case "capture_project_screenshot": {
                const { id, url } = args;
                const result = await captureProjectScreenshot(ROOT_DIR, id, url);
                const { projectMetadata, projectAssetFallback } = await readProjectsJs(ROOT_DIR);

                if (!projectAssetFallback[id] || !projectAssetFallback[id].includes(result.relativePath)) {
                    projectAssetFallback[id] = [result.relativePath, ...(projectAssetFallback[id] || [])];
                    await writeProjectsJs(ROOT_DIR, projectMetadata, projectAssetFallback);
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            }

            case "list_blog_posts": {
                const posts = await readPostsJs(ROOT_DIR);
                const summaries = posts.map(p => ({
                    id: p.id,
                    title: p.title,
                    date: p.date,
                    readTime: p.readTime,
                    tags: p.tags,
                    excerpt: p.excerpt
                }));

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ total: posts.length, posts: summaries }, null, 2)
                        }
                    ]
                };
            }

            case "add_or_update_blog_post": {
                const { id, title, date, readTime = "4 min read", appId = "", appTitle = "", appUrl = "", githubUrl = "", coverImage = "", tags = [], excerpt, content } = args;
                const normalizedId = id.toLowerCase().replace(/[^a-z0-9_-]/g, "-");

                const posts = await readPostsJs(ROOT_DIR);
                const existingIndex = posts.findIndex(p => p.id === normalizedId);

                const postData = {
                    id: normalizedId,
                    title,
                    date,
                    readTime,
                    appId,
                    appTitle: appTitle || title,
                    appUrl,
                    githubUrl,
                    coverImage: coverImage || (appId ? `images/projects/${appId}/preview.png` : ""),
                    tags: Array.isArray(tags) ? tags : [tags],
                    excerpt,
                    content
                };

                if (existingIndex >= 0) {
                    posts[existingIndex] = { ...posts[existingIndex], ...postData };
                } else {
                    posts.unshift(postData); // Prepend new post
                }

                await writePostsJs(ROOT_DIR, posts);

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: true,
                                action: existingIndex >= 0 ? "updated" : "created",
                                post: postData
                            }, null, 2)
                        }
                    ]
                };
            }

            case "validate_portfolio": {
                const health = await validatePortfolioHealth(ROOT_DIR);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(health, null, 2)
                        }
                    ]
                };
            }

            case "publish_to_portfolio": {
                const { commitMessage } = args;
                if (!commitMessage) {
                    throw new Error("commitMessage is required");
                }

                // 1. Health validation check
                const health = await validatePortfolioHealth(ROOT_DIR);
                if (!health.syntaxValid) {
                    throw new Error(`Cannot publish: portfolio syntax error detected: ${health.errors.join(", ")}`);
                }

                // 2. Git status check
                const { stdout: statusOut } = await execFileAsync("git", ["status", "--porcelain"], { cwd: ROOT_DIR });
                if (!statusOut.trim()) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    status: "clean",
                                    message: "No modifications detected to commit."
                                }, null, 2)
                            }
                        ]
                    };
                }

                // 3. Stage changes
                await execFileAsync("git", ["add", "projects.js", "github-url.txt", "posts.js", "images/projects/"], { cwd: ROOT_DIR });

                // 4. Commit
                const { stdout: commitOut } = await execFileAsync("git", ["commit", "-m", commitMessage], { cwd: ROOT_DIR });

                // 5. Push to origin main
                const { stdout: pushOut, stderr: pushErr } = await execFileAsync("git", ["push", "origin", "main"], { cwd: ROOT_DIR });

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: true,
                                message: "Changes successfully committed and pushed to origin/main. Vercel deployment triggered.",
                                commitOutput: commitOut.trim(),
                                pushOutput: (pushOut + " " + pushErr).trim(),
                                liveUrl: "https://alicia-goh-portfolio.vercel.app/"
                            }, null, 2)
                        }
                    ]
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        return {
            isError: true,
            content: [
                {
                    type: "text",
                    text: `Error executing ${name}: ${error.message}`
                }
            ]
        };
    }
});

// Start the server on stdio transport
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((error) => {
    console.error("Fatal error starting Portfolio MCP Server:", error);
    process.exit(1);
});
