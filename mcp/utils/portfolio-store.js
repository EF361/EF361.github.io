import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Reads and parses projects.js
 * @param {string} rootDir 
 * @returns {Promise<{ projectMetadata: Record<string, any>, projectAssetFallback: Record<string, string[]> }>}
 */
export async function readProjectsJs(rootDir) {
    const filePath = path.resolve(rootDir, "projects.js");
    const content = await fs.readFile(filePath, "utf8");
    const sandbox = {};
    const runner = `${content}\n;({ projectMetadata: typeof projectMetadata !== 'undefined' ? projectMetadata : {}, projectAssetFallback: typeof projectAssetFallback !== 'undefined' ? projectAssetFallback : {} })`;
    return vm.runInNewContext(runner, sandbox);
}

/**
 * Formats and writes projects.js safely
 * @param {string} rootDir 
 * @param {Record<string, any>} projectMetadata 
 * @param {Record<string, string[]>} projectAssetFallback 
 */
export async function writeProjectsJs(rootDir, projectMetadata, projectAssetFallback) {
    const filePath = path.resolve(rootDir, "projects.js");
    const serializedMetadata = JSON.stringify(projectMetadata, null, 4);
    const serializedAssets = JSON.stringify(projectAssetFallback, null, 4);

    const content = `/*
 * Project metadata only. Media is discovered automatically from
 * images/projects/<project-id>/ by app.js when the site runs on GitHub Pages.
 */
const projectMetadata = ${serializedMetadata};

/* Offline/local fallback. GitHub discovery replaces these lists when available. */
const projectAssetFallback = ${serializedAssets};
`;

    await fs.writeFile(filePath, content, "utf8");
    // Validate syntax immediately
    await execFileAsync("node", ["-c", filePath]);
}

/**
 * Reads and parses github-url.txt
 * @param {string} rootDir 
 * @returns {Promise<Record<string, { githubUrl?: string, demoUrl?: string }>>}
 */
export async function readGithubUrlTxt(rootDir) {
    const filePath = path.resolve(rootDir, "github-url.txt");
    const text = await fs.readFile(filePath, "utf8");
    const entries = {};
    let currentId = null;

    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line) continue;

        const githubMatch = line.match(/^github\s*:\s*(.+)$/i);
        const urlMatch = line.match(/^url\s*:\s*(.+)$/i);

        if (githubMatch && currentId) {
            entries[currentId] = entries[currentId] || {};
            entries[currentId].githubUrl = githubMatch[1].trim();
        } else if (urlMatch && currentId) {
            entries[currentId] = entries[currentId] || {};
            entries[currentId].demoUrl = urlMatch[1].trim();
        } else {
            currentId = line.replace(/:\s*$/, "").trim().toLowerCase().replace(/\s+/g, "-");
            entries[currentId] = entries[currentId] || {};
        }
    }

    return entries;
}

/**
 * Formats and writes github-url.txt safely
 * @param {string} rootDir 
 * @param {Record<string, { githubUrl?: string, demoUrl?: string }>} entries 
 */
export async function writeGithubUrlTxt(rootDir, entries) {
    const filePath = path.resolve(rootDir, "github-url.txt");
    const blocks = [];

    for (const [id, data] of Object.entries(entries)) {
        const lines = [id];
        if (data.demoUrl) {
            lines.push(`url: ${data.demoUrl}`);
        }
        if (data.githubUrl) {
            lines.push(`GitHub: ${data.githubUrl}`);
        }
        blocks.push(lines.join("\n"));
    }

    await fs.writeFile(filePath, blocks.join("\n\n") + "\n", "utf8");
}

/**
 * Reads and parses posts.js
 * @param {string} rootDir 
 * @returns {Promise<Array<any>>}
 */
export async function readPostsJs(rootDir) {
    const filePath = path.resolve(rootDir, "posts.js");
    const content = await fs.readFile(filePath, "utf8");
    const sandbox = {};
    const runner = `${content}\n;({ blogPosts: typeof blogPosts !== 'undefined' ? blogPosts : [] })`;
    const res = vm.runInNewContext(runner, sandbox);
    return res.blogPosts || [];
}

/**
 * Writes posts.js safely
 * @param {string} rootDir 
 * @param {Array<any>} blogPosts 
 */
export async function writePostsJs(rootDir, blogPosts) {
    const filePath = path.resolve(rootDir, "posts.js");
    const serializedPosts = JSON.stringify(blogPosts, null, 2);

    const content = `/**
 * ============================================================================
 * BLOG POSTS DATABASE & REPOSITORY
 * ============================================================================
 */

const blogPosts = ${serializedPosts};
`;

    await fs.writeFile(filePath, content, "utf8");
    // Validate syntax immediately
    await execFileAsync("node", ["-c", filePath]);
}

/**
 * Runs syntax checks and health audit on the portfolio
 * @param {string} rootDir 
 */
export async function validatePortfolioHealth(rootDir) {
    const results = {
        syntaxValid: true,
        errors: [],
        warnings: [],
        stats: {}
    };

    try {
        const { projectMetadata, projectAssetFallback } = await readProjectsJs(rootDir);
        const githubUrls = await readGithubUrlTxt(rootDir);
        const posts = await readPostsJs(rootDir);

        results.stats = {
            totalProjects: Object.keys(projectMetadata).length,
            totalFallbackSets: Object.keys(projectAssetFallback).length,
            totalLinkedUrls: Object.keys(githubUrls).length,
            totalBlogPosts: posts.length
        };

        // Check if project asset fallbacks exist on disk
        for (const [id, assets] of Object.entries(projectAssetFallback)) {
            for (const assetPath of assets) {
                const fullAssetPath = path.resolve(rootDir, assetPath);
                try {
                    await fs.access(fullAssetPath);
                } catch {
                    results.warnings.push(`Project "${id}" references missing asset: "${assetPath}"`);
                }
            }
        }

    } catch (err) {
        results.syntaxValid = false;
        results.errors.push(err.message);
    }

    return results;
}
