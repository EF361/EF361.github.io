/**
 * Test harness for Portfolio MCP Server utilities
 */

import path from "node:path";
import {
    readProjectsJs,
    readGithubUrlTxt,
    readPostsJs,
    validatePortfolioHealth
} from "./utils/portfolio-store.js";
import { scanGitHubRepositories } from "./utils/github-scanner.js";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");

async function runTests() {
    console.log("=== RUNNING PORTFOLIO MCP TEST HARNESS ===\n");

    let passed = 0;
    let failed = 0;

    // Test 1: Read projects.js
    try {
        const { projectMetadata, projectAssetFallback } = await readProjectsJs(ROOT_DIR);
        const metaCount = Object.keys(projectMetadata).length;
        const assetCount = Object.keys(projectAssetFallback).length;
        if (metaCount >= 10 && assetCount >= 10) {
            console.log(`[PASS] Read projects.js: found ${metaCount} projects and ${assetCount} fallback sets.`);
            passed++;
        } else {
            throw new Error(`Unexpected project count: meta=${metaCount}, assets=${assetCount}`);
        }
    } catch (err) {
        console.error(`[FAIL] Test 1:`, err.message);
        failed++;
    }

    // Test 2: Read github-url.txt
    try {
        const links = await readGithubUrlTxt(ROOT_DIR);
        const linkCount = Object.keys(links).length;
        if (linkCount >= 10) {
            console.log(`[PASS] Read github-url.txt: found ${linkCount} linked projects.`);
            passed++;
        } else {
            throw new Error(`Unexpected link count: ${linkCount}`);
        }
    } catch (err) {
        console.error(`[FAIL] Test 2:`, err.message);
        failed++;
    }

    // Test 3: Read posts.js
    try {
        const posts = await readPostsJs(ROOT_DIR);
        if (posts.length >= 1) {
            console.log(`[PASS] Read posts.js: found ${posts.length} blog posts (Title: "${posts[0].title}").`);
            passed++;
        } else {
            throw new Error(`No blog posts found`);
        }
    } catch (err) {
        console.error(`[FAIL] Test 3:`, err.message);
        failed++;
    }

    // Test 4: Health audit
    try {
        const health = await validatePortfolioHealth(ROOT_DIR);
        if (health.syntaxValid) {
            console.log(`[PASS] validatePortfolioHealth: syntax valid, stats=`, health.stats);
            if (health.warnings.length > 0) {
                console.log(`       Warnings (${health.warnings.length}):`, health.warnings);
            }
            passed++;
        } else {
            throw new Error(`Portfolio health invalid: ${health.errors.join(", ")}`);
        }
    } catch (err) {
        console.error(`[FAIL] Test 4:`, err.message);
        failed++;
    }

    // Test 5: Scan GitHub repositories
    try {
        const { projectMetadata } = await readProjectsJs(ROOT_DIR);
        const scan = await scanGitHubRepositories("EF361", Object.keys(projectMetadata));
        console.log(`[PASS] scanGitHubRepositories: found ${scan.totalFound} total repos on GitHub. Registered: ${scan.registeredRepos.length}, Unregistered/New: ${scan.newRepos.length}.`);
        if (scan.newRepos.length > 0) {
            console.log(`       Sample unregistered repo: ${scan.newRepos[0].name} (${scan.newRepos[0].githubUrl})`);
        }
        passed++;
    } catch (err) {
        console.warn(`[WARN] Test 5 (Network/Rate-limit):`, err.message);
        // Network or rate-limit warnings are non-fatal in local test runner
    }

    console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
    if (failed > 0) process.exit(1);
}

runTests();
