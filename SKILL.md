---
name: figma-agent
description: Figma MCP integration for OpenClaw. Use when the user wants to read Figma designs, inspect design tokens/variables, work with Code Connect, or create/edit Figma designs. Requires one-time bootstrap setup.
metadata:
  openclaw:
    requires:
      anyBins: ["node", "node18", "node20", "node22"]
    homepage: https://github.com/rasimme/figma-agent
---

# Figma Agent

Figma Remote MCP integration for OpenClaw. Reads designs via `figma__*` tools; creates and edits via CC sessions using `mcp__figma__*` tools.

## Route First

**Read/Inspect** → call `figma__*` tools directly. No CC session needed.  
**Write/Create/Edit** → requires CC session via `mcp__figma__*` tools.

Seeing or understanding a design? → Direct. Do not start a session.  
Changing or creating something? → Start a CC session. Follow the matching playbook below.

## Workflow Routing

**First:** Determine the user's intent, then follow the matching path.

→ Full routing matrix: [references/workflow-selection.md](references/workflow-selection.md)

| Intent | Path | Route |
|--------|------|-------|
| Build a production screen | [Native Screen Generation](references/playbooks/native-screen-generation.md) | CC |
| Prototype from HTML/URL | [HTML-to-Figma Prototyping](references/playbooks/html-to-figma-prototyping.md) | CC |
| Read-only inspection | `get_design_context` / `get_screenshot` | Direct |
| Review + Edit a screen | [Screen Review Loop](references/playbooks/screen-review-loop.md) | CC |
| Apply design tokens | [Color Tokenization](references/playbooks/color-tokenization.md) | CC |
| Import + clean up Stitch export | [Stitch Import Cleanup](references/playbooks/stitch-import-cleanup.md) | CC |
| Discover variables/styles | [Variable Discovery](references/playbooks/variable-discovery.md) | Direct |
| Audit design system | [Design System Cleanup](references/playbooks/design-system-cleanup.md) | CC |
| Inspect finished design | [Design Audit Review](references/playbooks/design-audit-review.md) | Direct |

---

## Hard Rules (Top 5)

These are non-negotiable. Full rule set: [references/core-rules.md](references/core-rules.md)

1. **Validate after every write** — `get_screenshot` or `get_metadata` after each `use_figma` call. Never assume success.
2. **Read → Understand → Fix → Retry** — never blindly retry failed code, never rebuild as first response.
3. **Explicit over implicit** — name exact variables, components, layout modes. Leave nothing to inference.
4. **Design-system-first** — check local variables, styles, Code Connect, then libraries before creating anything raw.
5. **Section-by-section** — one logical section per `use_figma` call, validate between sections.

---

## Known Gotchas

Before writing any `use_figma` code, know these failure modes:

→ Full reference: [references/plugin-api-gotchas.md](references/plugin-api-gotchas.md)

- **Paint binding:** `setBoundVariableForPaint` returns a new paint — reassign the fills/strokes array ([#paint-binding](references/plugin-api-gotchas.md#paint-binding))
- **Opacity reset:** Paint binding resets opacity to 1.0 — save and restore explicitly ([#opacity](references/plugin-api-gotchas.md#opacity))
- **Page context:** Always set page explicitly — `figma.currentPage` may reset between calls ([#page-context](references/plugin-api-gotchas.md#page-context))
- **FILL sizing:** appendChild to auto-layout parent before setting `layoutSizingHorizontal: "FILL"` ([#append-before-fill](references/plugin-api-gotchas.md#append-before-fill))
- **Async:** Always `await` async operations — `loadFontAsync`, `importComponentByKeyAsync`, etc. ([#promises](references/plugin-api-gotchas.md#promises))

---

## Prompting Guidance

→ Full patterns: [references/prompting-patterns.md](references/prompting-patterns.md)

Key patterns: variable-first code structure, section-by-section execution, explicit design-system usage, validation loops, error recovery framing.

---

## Setup (One-Time Bootstrap)

```bash
node ~/.openclaw/skills/figma-agent/scripts/auth.mjs
```

Reads CC OAuth token from `~/.claude/.credentials.json`, writes it into `~/.openclaw/openclaw.json`. Then restart the OpenClaw gateway.

**Token check:** `node ~/.openclaw/skills/figma-agent/scripts/auth.mjs --check`

**On 401 errors:** Open CC → use any Figma tool (auto-refreshes token) → re-run bootstrap script.

---

## URL Parsing

```
figma.com/design/:fileKey/:name?node-id=:nodeId
```
Convert `-` to `:` in nodeId (e.g. `123-456` → `123:456`). For FigJam: `figma.com/board/:fileKey/:name` → use `get_figjam`.

---

## Tool & Rate-Limit Reference

→ [references/figma-api.md](references/figma-api.md)
