# Alicia Goh Portfolio MCP Server

A dedicated [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server enabling AI models (Claude Mobile, Claude Desktop, Cursor, Antigravity) to inspect, edit, add projects, and publish to Alicia Goh's portfolio (`EF361.github.io`) and GitHub projects (`EF361`).

---

## Remote Cloud Connection (Claude Mobile & Web via Vercel)

You can connect Claude on your **phone (iOS / Android)** or **browser (claude.ai)** directly via your public Vercel endpoint:

```
https://alicia-goh-portfolio.vercel.app/api/mcp
```

### Setup Steps for Phone / Claude.ai:
1. Open **[claude.ai](https://claude.ai)** in any browser.
2. Go to **Settings** → **Connectors** → **Add connector** → **Remote**.
3. Fill in:
   - **Name**: `Alicia Portfolio`
   - **URL**: `https://alicia-goh-portfolio.vercel.app/api/mcp`
4. If you want Claude to make commits to your GitHub repo, provide your GitHub Personal Access Token (classic with `repo` scope or fine-grained with read/write contents permissions) in your Vercel Project Settings as `GITHUB_TOKEN`, or pass it as a Bearer token in the connector's Authorization header.
5. Save. It will immediately sync to your **Claude mobile app** on your phone!

---

## Local Desktop Connection (Cursor & Claude Desktop on PC)

### In Cursor
Cursor will automatically detect [`.cursor/mcp.json`](../.cursor/mcp.json) in this repository.

### In Claude Desktop (PC)
Add to `%APPDATA%\Claude\claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "alicia-portfolio": {
      "command": "node",
      "args": ["c:/Users/alici/Downloads/projects/EF361.github.io/mcp/index.js"]
    }
  }
}
```

---

## Available Tools

| Tool | Purpose |
| :--- | :--- |
| `list_portfolio_projects` | Lists all projects, metadata, tags, and links from `projects.js`. |
| `scan_github_repos` | Discovers public `EF361` repositories on GitHub and flags new ones. |
| `add_or_update_project` | Adds or updates a project in `projects.js` and `github-url.txt`, captures a live screenshot, and commits to GitHub. |
| `capture_project_screenshot` | Fetches a screenshot via Microlink API and commits to `images/projects/<id>/preview.png`. |
| `list_blog_posts` | Lists all blog posts from `posts.js`. |
| `add_or_update_blog_post` | Creates or updates a blog post in `posts.js` and commits to GitHub. |

---

## Local Testing
```bash
node mcp/test-harness.js
node mcp/test-remote-handler.js
```
