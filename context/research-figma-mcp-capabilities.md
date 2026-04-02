# Research: Figma MCP Capabilities & Landscape

**Date:** 2026-04-01
**Source:** Official Figma Developer Docs, Figma Forum, community projects

---

## 1. Official Figma Remote MCP — Tool Inventory

Endpoint: `https://mcp.figma.com/mcp`

### Read Tools
| Tool | Description | File Types |
|------|------------|------------|
| `get_design_context` | Design context for layer/selection — default output: React + Tailwind, configurable | Design, Make |
| `get_variable_defs` | Variables and styles of a selection (colors, spacing, typography) | Design |
| `get_code_connect_map` | Mapping Figma node IDs → code components in codebase | Design |
| `get_screenshot` | Screenshot of a selection — recommended for layout fidelity | Design, FigJam |
| `get_metadata` | Sparse XML: layer IDs, names, types, position, sizes — good for large designs | Design |
| `get_figjam` | FigJam diagrams as XML with screenshots | FigJam |
| `search_design_system` | Search across all connected libraries: components, variables, styles | Design |
| `whoami` | User identity, plans, seat types (remote only) | — |

### Write Tools
| Tool | Description | File Types | Notes |
|------|------------|------------|-------|
| `use_figma` | General-purpose write: create, edit, delete, inspect arbitrary objects | Design, FigJam | Executes JavaScript via Plugin API. Requires Full Seat. Beta, will become paid. |
| `create_new_file` | New empty design or FigJam file in drafts | — | Returns file_key + file_url |
| `generate_figma_design` | Generate UI layers from live interfaces → new/existing file or clipboard | Design | Remote only, certain clients only, exempt from rate limits |
| `generate_diagram` | FigJam diagram from Mermaid syntax | — | Flowchart, Gantt, state, sequence |
| `add_code_connect_map` | Add mapping Figma node → code component | Design | |
| `create_design_system_rules` | Rule file for design-system-aware code generation | — | |

### Code Connect Tools
| Tool | Description |
|------|------------|
| `get_code_connect_suggestions` | Figma-triggered: suggestions for component → code mappings |
| `send_code_connect_mappings` | Confirm proposed Code Connect mappings |
| `get_context_for_code_connect` | Context needed for Code Connect setup |

---

## 2. Comparison: Remote MCP vs. Desktop MCP vs. REST API vs. Plugin API

| Aspect | Remote MCP | Desktop MCP | REST API | Plugin API |
|--------|-----------|-------------|----------|------------|
| **Hosting** | Figma Cloud (`mcp.figma.com`) | Local, requires Figma Desktop App | Figma Cloud endpoints | Inside Figma App (plugins/widgets) |
| **Auth** | OAuth 2.0 (DCR, approved clients only) | Local app session | Personal Access Token (PAT) or OAuth | App session |
| **Platform** | Any (headless possible with proxy) | Windows/macOS only | Any | Windows/macOS (Desktop App) |
| **Write capability** | ✅ via `use_figma` (Plugin API JS) | ✅ via `use_figma` | Limited (comments, variables, some properties) | ✅ Full access |
| **Selection awareness** | ❌ No — link-based | ✅ Yes, real-time | ❌ No | ✅ Yes |
| **Rate limits** | 200/day (Pro/Org Full/Dev), 600/day (Enterprise) | None documented | Tier-based (10-100/min) | None |
| **Jetson compatible** | ✅ (with OAuth solution) | ❌ (no Linux desktop) | ✅ | ❌ |
| **Feature breadth** | Broadest MCP toolset | Selection + write | CRUD on files/nodes/variables | Full runtime access |

### Comparison Summary
- **REST API:** Good for automated bulk ops (export, variables CRUD, file management), no `use_figma`
- **Plugin API:** Most powerful interface, but requires desktop app runtime — no headless
- **Desktop MCP:** Plugin API via MCP protocol, but desktop-app-bound
- **Remote MCP:** Plugin API via cloud proxy — headless-capable, but OAuth gate

---

## 3. Auth Model — The Central Problem

### How Remote MCP authenticates (official + technical)
1. OAuth 2.0 with Dynamic Client Registration (DCR)
2. Client sends registration to Figma's registration endpoint
3. Then authorization + token exchange follow
4. For Remote MCP there is no PAT/API-key shortcut like with the REST API

### What is officially documented
- Figma documents concrete supported clients / install paths (Claude Code, Codex, Cursor, VS Code, etc.)
- Figma does **not explicitly state** that only those clients are allowed
- Figma also does **not explicitly promise** that arbitrary standards-compliant custom clients are freely supported via DCR/OAuth

### What was practically observed
- Custom client tests currently fail at OAuth Client Registration / DCR with **`403 Forbidden`**
- This applies to both direct DCR requests and a clean test via the official MCP SDK OAuth path
- Public reports/forum posts point in the same direction: documented clients work, custom clients hit barriers at the auth/DCR layer

### What this means for OpenClaw
- OpenClaw's native HTTP MCP support is **not** the main problem
- The real blocker is currently the **Figma auth/DCR layer for custom clients**
- Consequence: documented/supported clients are the safest known integration path; custom client support remains unresolved

### Solution Paths

#### Option A: Approved client as proxy (recommended for PoC)
OpenClaw uses an approved client (Claude Code, Cursor, Codex) as MCP bridge.

#### Option B: Community proxy (bitovi/figma-mcp-proxy)
Open-source OAuth proxy that works around the DCR problem.

#### Option C: Seek Figma client approval / clarification
Direct clarification with Figma on custom MCP client support.

#### Option D: REST API + Community MCP (GLips/Figma-Context-MCP)
Read: GLips MCP (uses REST API with PAT, no OAuth gate). Write: limited via REST or `use_figma` via Option A.

#### Option E: mcporter direct to Remote MCP
mcporter has OAuth support (`mcporter auth`), could act as Figma MCP client.

---

## 4. Rate Limits & Costs

| Plan/Seat | Daily Limit | Per Minute |
|-----------|-------------|------------|
| Enterprise (all) | 600/day | 20/min |
| Org/Pro + Full/Dev | 200/day | 10-15/min |
| Starter or View/Collab | 6/month | — |

**Important:**
- Write tools (`use_figma`, `generate_figma_design`, `add_code_connect_map`, `whoami`) are **exempt from rate limits**
- Limits apply to read tools
- Limit depends on file location (workspace/team), not just user seat
- `use_figma` is currently free (beta), will become "usage-based paid feature"

---

## 5. Known Limitations of `use_figma`

- 20KB output response limit per call
- No image/asset support (no import of images/videos/GIFs)
- No custom fonts
- Components must be manually published before Code Connect applies
- Beta quality — output needs manual review and cleanup
- No selection awareness (link-based, not real-time selection)

---

## 6. Alternative MCP Servers (Community)

| Server | Approach | Auth | Write? | Advantages |
|--------|----------|------|--------|------------|
| **GLips/Figma-Context-MCP** | REST API, simplified responses | PAT | ❌ | Immediately usable, no OAuth gate, open source |
| **Figma Console MCP** | WebSocket Desktop Bridge + REST + Plugin API | PAT | ✅ (90+ dedicated tools) | Granular write tools, batch ops, better error handling |
| **Tim Holden's Design System MCP** | REST API, design-system-focused | PAT | Partially | Variables/files without Plugin API |

---

## 7. OpenClaw-Specific Context

### What we have
- `mcp-bridge` plugin active in OpenClaw
- `mcporter` CLI installed (HTTP + stdio MCP, auth, config)
- ACP runtime for CC/Codex sessions (approved Figma clients)
- Stitch Design Skill as reference architecture for design tool integration

### What we need
- OAuth solution for headless Figma MCP access
- Or: deliberate decision to use CC/Codex as proxy
- Figma Full Seat (for write access)
