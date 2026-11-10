# Antigravity task: case-study pages and editorial layout

Read first: `docs/design-brief.md`, `content/_template.json`, `content/dentai.json`.

## Build
1. Add `project.html?id=<id>` (plain HTML, CSS, JS, no libraries). It loads `content/<id>.json` and shows, in this order:
   - Title, one-line summary, status text, month, links (live, GitHub).
   - **The Brief and Goal**, **Role and Team**, **The Process** (numbered steps), **Quantifiable Impact** (value large, metric small, source as a caption), **Visuals** (full-width images with captions).
   - Stack as a plain text list. Previous and Next project links.
2. A block with no data is not shown. Never print an empty heading or invented text.
3. On the home page, turn "Selected work" into an index list: number, title, month, 3 tags, status text. The whole row opens `project.html?id=<id>`. Keep the thumbnail on hover (desktop) only.
4. Keep the existing theme toggle, `style.css` tokens, and the certificates and blog pages unchanged.
5. Add an Experience section from `references/[Resume] 04062026.pdf` (Meta AI Sdn Bhd, Assistant Swim Coach). Ask the owner before naming any client.

## Rules
- Follow `docs/design-brief.md`: quiet editorial look, one accent colour, no gradients or glow.
- 44px tap targets, no horizontal scroll at 360px, visible focus, alt text from the JSON.
- Do not push. Commit on the current branch and stop.

## Done when
- `project.html?id=dentai` shows all five blocks from `content/dentai.json`.
- Works at 360px and 1280px width, light and dark.
