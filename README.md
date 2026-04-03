<h1 align="center">Figma Agent</h1>

<p align="center">
  <strong>Figma Remote MCP for OpenClaw — read, inspect, and edit Figma designs from chat.</strong><br>
  An <a href="https://github.com/openclaw/openclaw">OpenClaw</a> skill using the official <a href="https://help.figma.com/hc/en-us/articles/32132100833559">Figma Remote MCP server</a>.
</p>

<p align="center">
  <a href="https://github.com/rasimme/figma-agent/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License"></a>
  <a href="https://github.com/rasimme/figma-agent/blob/main/CHANGELOG.md"><img src="https://img.shields.io/badge/version-v0.1.1-blue.svg" alt="Version"></a>
  <a href="https://clawhub.ai"><img src="https://img.shields.io/badge/ClawHub-skill-purple.svg" alt="ClawHub"></a>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#tools">Tools</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#limitations">Limitations</a> •
  <a href="CHANGELOG.md">Changelog</a>
</p>

---

## What is this?

Your OpenClaw agent connects directly to Figma via the official Figma Remote MCP server. Read design context, retrieve screenshots, inspect variables and components — or write new frames, components, and variables directly to the Figma canvas.

> **"Get me a screenshot of the login screen and summarize the color palette."**
>
> → Agent calls `get_screenshot` + `get_variable_defs` → screenshot + color list delivered in chat.

> **"Create a new settings screen in this Figma file with our existing components."**
>
> → Agent spawns an ACP coding session with Figma MCP connected → writes directly to canvas → returns result.

**Runtime scope:** requires only `FIGMA_MCP_TOKEN` (extracted by the bootstrap script from any supported Figma MCP client). Talks only to `https://mcp.figma.com/mcp`. Stores no data except the token in OpenClaw config.

---

## Features

- **Read / Inspect** — design context, layer metadata, variables, component info, Code Connect mappings, FigJam content, screenshots
- **Write to Canvas** — create and modify frames, components, variables, auto layout directly in Figma files (Full Seat required)
- **HTML to Canvas** — capture live browser UI as editable Figma layers via `generate_figma_design`
- **Design System** — search library components/styles, inspect variable collections, work with Code Connect
- **Zero external dependencies** — MCP client is a single self-contained script (~200 lines)
- **Multi-client token bootstrap** — automatically extracts Figma MCP token from Claude Code, Codex, Windsurf, or other supported clients

---

## Quick Start

### Prerequisites

- [OpenClaw](https://github.com/openclaw/openclaw) installed
- [Node.js](https://nodejs.org) ≥ 18
- Figma account connected to a supported MCP client (Claude Code, Cursor, VS Code, Codex, or similar — [full list](https://help.figma.com/hc/en-us/articles/32132100833559))
- **Full Seat** in Figma for write operations (Dev Seat = read-only)

### Install

**Via ClawHub (recommended):**

```bash
clawhub install figma-agent
```

**Manual:**

```bash
cd ~/.openclaw/skills
git clone https://github.com/rasimme/figma-agent.git
```

### Bootstrap Token

The skill extracts the Figma MCP token from whichever supported client you already have connected:

```bash
node ~/.openclaw/skills/figma-agent/scripts/bootstrap-token.mjs
```

Scans supported MCP client credential stores (Claude Code, Codex, Windsurf, and others), refreshes the token if needed, and writes it to your OpenClaw config under `mcp.servers.figma`.

Then restart the gateway:

```bash
openclaw gateway restart
```

### Configure in OpenClaw

Add to your `openclaw.json` (the bootstrap script does this automatically):

```json
{
  "mcp": {
    "servers": {
      "figma": {
        "url": "https://mcp.figma.com/mcp",
        "headers": {
          "Authorization": "Bearer YOUR_FIGMA_MCP_TOKEN"
        }
      }
    }
  }
}
```

---

## Tools

All 17 official Figma Remote MCP tools are available. See [`references/figma-api.md`](references/figma-api.md) for full details.

### Read / Inspect

| Tool | Description |
|------|-------------|
| `get_design_context` | Design structure, layout, component info for a node |
| `get_screenshot` | PNG screenshot of any frame or node |
| `get_metadata` | Full layer tree with node IDs, positions, dimensions |
| `get_variable_defs` | Local variables/tokens (requires valid nodeId) |
| `search_design_system` | Community and linked library components/styles |
| `get_code_connect_map` | Code Connect component mappings |
| `get_code_connect_suggestions` | Suggested Code Connect mappings |
| `get_context_for_code_connect` | Context for implementing Code Connect |
| `get_figjam` | FigJam diagram content |
| `whoami` | Current authenticated user |

### Write / Create (Full Seat required)

| Tool | Description |
|------|-------------|
| `use_figma` | Execute Plugin API JS: create/modify frames, components, variables, auto layout |
| `create_new_file` | Create a blank Figma file in Drafts |
| `generate_figma_design` | Capture live browser HTML/CSS as editable Figma layers |
| `generate_diagram` | Convert Mermaid diagram to FigJam |
| `add_code_connect_map` | Add Code Connect mappings |
| `send_code_connect_mappings` | Send Code Connect mappings |
| `create_design_system_rules` | Create design system instructions for agents |

---

## Architecture

Read operations go direct via the Figma Remote MCP server. Write operations are routed through an ACP coding session (Claude Code, Codex, or another supported agent with Figma MCP connected):

```
User prompt
    │
    ▼
OpenClaw Agent
    ├── Read/Inspect ──► figma-mcp.mjs ──► mcp.figma.com ──► Figma file
    └── Write/Create ──► ACP Agent (with Figma MCP) ──► Figma canvas
```

This hybrid approach means:
- Reads are fast and lightweight (direct MCP call)
- Writes use the full Figma MCP skill set available to the ACP agent
- The user sees one unified skill, not two systems

---

## Limitations

Current limitations as of Figma Remote MCP (April 2026). Source: [Figma Write to Canvas docs](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/).

- **20 KB output limit** per `use_figma` call — split large write operations
- **No image/asset import** — cannot embed raster images via MCP
- **No custom font loading** — only fonts already in the Figma file/org
- **Beta quality** — write to canvas is actively improving; some edge cases may fail
- **Dev Seat = read-only** — `use_figma` requires a Full Seat
- **`saveVersionHistoryAsync` not available** in Remote MCP sandbox
- **`figma.variables.getVariableById()` not available** — use IDs from `get_variable_defs` + `setBoundVariableForPaint`
- **SVG/vector creation** not supported via Plugin API in this context — clone existing vectors from the file
- **Write to canvas** only available with approved MCP clients (Claude Code, Cursor, VS Code, Codex, and others — see [Figma MCP docs](https://help.figma.com/hc/en-us/articles/32132100833559))
- **Token auth** requires one-time bootstrap from a supported Figma MCP client (no direct OAuth for custom clients yet)

---

## Project structure

```
figma-agent/
├── SKILL.md                    # OpenClaw skill instructions
├── CHANGELOG.md
├── LICENSE
├── package.json
├── references/
│   └── figma-api.md            # Full MCP tool reference
├── scripts/
│   ├── figma-mcp.mjs           # Zero-dep Figma MCP client
│   └── bootstrap-token.mjs     # Multi-client token extractor
└── state/                      # Runtime state (gitignored)
```

---

## License

MIT — see [LICENSE](LICENSE).
