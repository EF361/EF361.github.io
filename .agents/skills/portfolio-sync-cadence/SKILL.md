---
name: portfolio-sync-cadence
description: >-
  Use this skill whenever running periodic (weekly, monthly, or on-demand) maintenance
  to audit GitHub repositories (EF361), capture live project screenshots, sync
  projects.js and github-url.txt, and verify the live deployment on Vercel.
---

# Portfolio Synchronization Cadence

A sustainable runbook for keeping Alicia Goh's personal portfolio website ([alicia-goh-portfolio.vercel.app](https://alicia-goh-portfolio.vercel.app/)) and GitHub repositories ([EF361](https://github.com/EF361)) aligned, visually documented, and production-ready.

## Cadence Checklist

### 1. Repository Discovery
- Query the GitHub API for recently updated repositories:
  `GET https://api.github.com/user/repos?visibility=all&affiliation=owner&sort=pushed&per_page=100`
- Compare discovered repository names against `projects.js` and `github-url.txt`.
- Flag new or recently modified projects that lack metadata or assets.

### 2. Visual Proof Asset Extraction
- For every project with a live URL (Vercel, Streamlit, etc.), verify the URL is active:
  - If a preview image is missing in `images/projects/<id>/preview.png`, capture a live screenshot via Microlink:
    `https://api.microlink.io?url=<encoded_url>&screenshot=true&meta=false`
  - If the project is a CLI, backend tool, or the deployment is temporarily paused:
    - Search the repository for high-resolution graphics (e.g., in `public/images/` or icons).
    - If none exist, capture an authentic repository showcase card from `https://github.com/EF361/<repo>`.

### 3. Portfolio Registry Synchronization
- **Update `projects.js`**:
  - Add the new project to `projectMetadata` with:
    - `title`: Clean human-readable name.
    - `description`: 1-2 concise sentences highlighting the engineering problem solved.
    - `tags`: 3-4 specific technical tags (e.g., `["Next.js", "TypeScript", "Web Crypto API"]`).
  - Add the project's primary image to `projectAssetFallback`:
    `"<id>": ["images/projects/<id>/preview.png"]`
- **Update `github-url.txt`**:
  - Append the project identifier, demo URL (`url: ...`), and GitHub URL (`GitHub: ...`).

### 4. Local Validation Pass
- Validate JavaScript syntax:
  ```bash
  node -c projects.js
  ```
- Verify image asset formats:
  - Supported formats in the gallery slideshow: `.png`, `.jpg`, `.jpeg`, `.webp`, `.avif`.
  - Ensure image paths are relative (`images/projects/<id>/preview.png`).

### 5. Deployment & Live Verification
- Commit and push to GitHub:
  ```bash
  git add github-url.txt projects.js images/projects/
  git commit -m "feat: sync portfolio projects and visuals for <project-names>"
  git push origin main
  ```
- Smoke test the live Vercel deployment:
  - Fetch `https://alicia-goh-portfolio.vercel.app/projects.js` to confirm new projects are live.
  - Verify image HTTP 200 statuses:
    `fetch('https://alicia-goh-portfolio.vercel.app/images/projects/<id>/preview.png')`

### 6. AnyBot Telegram Clarification (If Needed)
- If a repository lacks a live demo link or requires private assets that cannot be captured automatically, notify Alicia on Telegram (Chat ID `948198834`) using the AnyBot integration so she can reply with the URL or screenshot directly.
