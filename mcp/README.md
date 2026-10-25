# Alicia Goh Portfolio MCP Server

A dedicated [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server enabling AI models (in Cursor, Claude Desktop, Antigravity, etc.) to discover, update, validate, and deploy Alicia Goh's portfolio (`EF361.github.io`) and GitHub projects (`EF361`).

---

## Capabilities & Available Tools

| Tool | Purpose | Key Inputs |
| :--- | :--- | :--- |
| `list_portfolio_projects` | Lists all projects currently in `projects.js` and `github-url.txt` with their metadata, tags, and links. | *(none)* |
| `scan_github_repos` | Scans GitHub for public repositories owned by `EF361`, reporting newly created or unregistered projects. | `username` (default: `"EF361"`), `token` (optional) |
| `add_or_update_project` | Safely adds or updates a project in `projects.js` and `github-url.txt`, optionally capturing a live preview screenshot. | `id`, `title`, `description`, `tags`, `demoUrl`, `githubUrl`, `autoCaptureScreenshot` |
| `capture_project_screenshot` | Fetches a screenshot of a live demo URL via Microlink API and writes it directly to `images/projects/<id>/preview.png`. | `id`, `url` |
| `list_blog_posts` | Lists all blog posts and metadata from `posts.js`. | *(none)* |
| `add_or_update_blog_post` | Creates or updates a blog post entry in `posts.js` with structured metadata and formatted HTML. | `id`, `title`, `date`, `readTime`, `tags`, `excerpt`, `content` |
| `validate_portfolio` | Runs Node syntax validation (`node -c`) on `projects.js` and `posts.js`, audits disk asset references, and returns a health report. | *(none)* |
| `publish_to_portfolio` | Runs validation, stages changes, creates a Git commit, and pushes to `origin/main` (automatically triggering Vercel redeployment). | `commitMessage` |

---

## Client Setup Guides

### 1. Cursor Setup
This repository includes a pre-configured `.cursor/mcp.json` file. Cursor Composer and Chat will automatically discover the MCP server tools when this project is open in Cursor.

If configuring globally or manually in Cursor:
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

### 2. Claude Desktop Setup
Add the following to your Claude Desktop configuration file:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "alicia-portfolio": {
      "command": "node",
      "args": ["c:/Users/alici/Downloads/projects/EF361.github.io/mcp/index.js"],
      "env": {
        "GITHUB_TOKEN": "<YOUR_OPTIONAL_GITHUB_PAT>"
      }
    }
  }
}
```

### 3. Antigravity / Gemini CLI Setup
Add to `~/.gemini/config/mcp_config.json`:
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

## Local Verification & Development

To test the MCP server utilities locally without launching an AI client:
```bash
cd mcp
node test-harness.js
```

To run the MCP server directly via stdio:
```bash
cd mcp
node index.js
```
