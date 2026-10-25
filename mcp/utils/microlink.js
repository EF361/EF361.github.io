import fs from "node:fs/promises";
import path from "node:path";

/**
 * Captures a preview screenshot of a project demo URL using Microlink API
 * and saves it directly to images/projects/<projectId>/preview.png.
 * 
 * @param {string} rootDir - Root directory of the repository
 * @param {string} projectId - Project identifier slug
 * @param {string} targetUrl - Web URL to screenshot
 * @returns {Promise<{ success: boolean, relativePath: string, message: string }>}
 */
export async function captureProjectScreenshot(rootDir, projectId, targetUrl) {
    if (!targetUrl || !targetUrl.startsWith("http")) {
        throw new Error(`Invalid target URL: "${targetUrl}". Must start with http:// or https://`);
    }

    const sanitizedId = projectId.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    const outputDir = path.resolve(rootDir, "images", "projects", sanitizedId);
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.resolve(outputDir, "preview.png");
    const relativePath = `images/projects/${sanitizedId}/preview.png`;

    const apiUrl = `https://api.microlink.io?url=${encodeURIComponent(targetUrl)}&screenshot=true&meta=false`;
    
    const response = await fetch(apiUrl, {
        headers: { "User-Agent": "AliciaGoh-Portfolio-Sync/1.0" },
        signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
        throw new Error(`Microlink API responded with HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    let imageBuffer;

    if (contentType.includes("image/")) {
        imageBuffer = Buffer.from(await response.arrayBuffer());
    } else {
        const data = await response.json();
        const screenshotUrl = data?.data?.screenshot?.url;
        if (!screenshotUrl) {
            throw new Error(`No screenshot URL returned by Microlink for ${targetUrl}`);
        }
        const imgResp = await fetch(screenshotUrl, { signal: AbortSignal.timeout(30000) });
        if (!imgResp.ok) {
            throw new Error(`Failed to download screenshot from CDN (${imgResp.status})`);
        }
        imageBuffer = Buffer.from(await imgResp.arrayBuffer());
    }

    await fs.writeFile(outputPath, imageBuffer);

    return {
        success: true,
        relativePath,
        byteSize: imageBuffer.length,
        message: `Successfully captured screenshot (${imageBuffer.length} bytes) to ${relativePath}`
    };
}
