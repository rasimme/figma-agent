---
name: figma-agent
description: Unified Figma skill for OpenClaw. Reads design context directly via Figma's Remote MCP and routes write/edit/create operations through Claude Code ACP sessions. Best for screen inspection, design-context analysis, targeted edits, screenshot retrieval, and lightweight review loops.
version: 0.1.0
requires:
  env:
    - FIGMA_MCP_TOKEN
  anyBins:
    - node
primaryEnv: FIGMA_MCP_TOKEN
homepage: https://github.com/rasimme/figma-agent
---

# Figma Agent

A **unified Figma skill** with a **hybrid architecture**:
- **Read / Inspect** operations use the direct Figma MCP path.
- **Write / Edit / Create** operations go through **Claude Code via ACP**.
- To the user, this feels like **one skill**, not two separate systems.

## Prerequisites

1. **Figma account** (Full Seat required for write access)
2. **One-time Figma MCP connection** via a supported client:
   - Claude Code: `claude plugin install figma`
   - Codex, Cursor, VS Code, Windsurf: add Figma in MCP settings
3. **Token bootstrap:** `node scripts/bootstrap-token.mjs` — automatically extracts the token and writes it to OpenClaw config
4. **Gateway restart:** `openclaw gateway restart`

This external-client requirement is temporary. Once Figma opens Dynamic Client Registration for custom clients, direct auth will replace this step.

## When to use this skill

Use this skill when the user wants to:
- inspect a Figma screen, frame, or file
- retrieve screenshots or design context
- understand variables, structure, metadata, or design-system elements
- request targeted edits to an existing screen
- create a new screen or variant in Figma
- run a simple review loop: inspect → edit → inspect again

Do **not** use this skill for:
- generic design discussions without Figma context
- heavy multi-step autonomous workflow orchestration
- non-Figma browser automation

## Product behavior

The skill behaves like **one product** with internal routing.

### Transparency rule
- **Read operations:** stay quiet about internal routing unless it matters.
- **Write / edit / create operations:** explicitly tell the user when switching to the heavier CC/ACP execution path.

Examples:
- Read: "The screen uses a 12-column grid with 16px gutters…"
- Write: "I'll push this change through Claude Code now and bring back the result."

## Capability groups

### 1. Inspect / Read (direct path)

Typical requests:
- "Analyze this screen"
- "Get me the screenshot"
- "What are the key components here?"
- "Which variables / tokens are used?"

Available tools (via `scripts/figma-mcp.mjs`):
- `get_design_context` — full design context for a node
- `get_screenshot` — PNG screenshot of a node
- `get_metadata` — structural metadata and node tree
- `get_variable_defs` — design token / variable definitions
- `search_design_system` — search across design system
- `get_figjam` — FigJam board content
- `get_code_connect_map` — Code Connect mappings
- `get_code_connect_suggestions` — Code Connect suggestions
- `get_context_for_code_connect` — context for Code Connect setup
- `whoami` — verify auth and account info

### 2. Write / Edit / Create (CC/ACP path)

Typical requests:
- "Change this layout"
- "Create a new variant"
- "Add a new screen"
- "Rewrite this in Figma"

For these, use **Claude Code via ACP**. The CC session has access to:
- `use_figma` — general-purpose Plugin API execution
- `create_new_file` — create blank Figma file
- `generate_figma_design` — code-to-canvas generation
- `generate_diagram` — Mermaid to FigJam
- `add_code_connect_map` — add Code Connect mappings
- `send_code_connect_mappings` — publish Code Connect
- `create_design_system_rules` — define design system rules

## Routing rules

### Namespace note
- `figma__*` = OpenClaw-side direct tools (if/when native MCP materializes)
- `mcp__figma__*` = Figma MCP tools inside Claude Code sessions
- `scripts/figma-mcp.mjs` = zero-dependency wrapper for direct calls

The user does not need to know about this distinction.

### Default heuristic

**Route to direct read when the request is about:**
seeing, understanding, comparing, extracting, summarizing, inspecting, reviewing existing design state.

**Route to CC/ACP when the request is about:**
changing, editing, creating, generating, restructuring, writing to canvas, producing new design state.

### Mixed requests
1. Inspect first (direct path)
2. Summarize relevant context
3. Switch to CC/ACP for the mutation
4. Return the result

### Write path flow
1. Determine that mutation is required
2. Gather relevant Figma context directly first
3. Hand mutation task to Claude Code via ACP
4. Let CC execute the Figma change
5. Return result to the conversation

## Review loop

A simple review loop is in scope:
1. Inspect current state
2. Perform targeted change
3. Show / summarize result
4. Accept one more correction or refinement

Avoid over-complicated automation. Prefer clear step-by-step execution.

## Write safety: checkpoint before every write

Before any write operation (`use_figma`, `create_new_file`, `generate_figma_design`),
always save a version-history checkpoint first:

```js
// Use writeWithCheckpoint() instead of call('use_figma', ...)
await client.writeWithCheckpoint(fileKey, 'Short label', 'Description', code);
```

This saves a named entry in Figma's Version History (File → Version History)
so the user can always restore the state before the edit.

**Rule:** reads never need a checkpoint. Writes always do.

## Failure handling

### Auth failure
If a direct Figma read fails due to invalid or expired auth:
- Stop the attempt
- Tell the user clearly that Figma auth needs renewal
- Point to: `node scripts/bootstrap-token.mjs --refresh`
- Do not silently reroute as if it were a different problem

### Rate limits
If reads are rate-limited, say so clearly. Do not pretend direct reads are always cheap or always available.

## Token management

### Bootstrap
```bash
node scripts/bootstrap-token.mjs          # scan + write
node scripts/bootstrap-token.mjs --dry-run # preview only
node scripts/bootstrap-token.mjs --refresh # refresh expired token
```

Supported token sources (in priority order):
1. Claude Code (`~/.claude/.credentials.json`)
2. Codex (`~/.codex/auth.json`)
3. Windsurf (`~/.codeium/windsurf/mcp_config.json`)

### Token location
The token is written to `openclaw.json` under `mcp.servers.figma.headers.Authorization`.

## What works via Remote MCP (official)

All capabilities below are confirmed via [Figma's official documentation](https://help.figma.com/hc/en-us/articles/32132100833559).

### Read / Inspect ✅
- `get_design_context` — design structure, layout, component info
- `get_screenshot` — PNG screenshot of any frame or node
- `get_metadata` — full layer tree with node IDs, positions, dimensions
- `get_variable_defs` — local variables/tokens (requires valid nodeId)
- `search_design_system` — community and linked library components/styles
- `get_code_connect_map` / `get_code_connect_suggestions` — Code Connect mappings
- `get_figjam` — FigJam diagram content
- `whoami` — current user identity

### Write / Create ✅ (Full Seat required)
- `use_figma` — executes JavaScript via Figma Plugin API: create/modify frames, components, variables, auto layout, fills, strokes, text
- `create_new_file` — creates a blank Figma file in Drafts
- `generate_figma_design` — captures live HTML/CSS from a browser URL and imports it as editable Figma layers (HTML-to-canvas)
- `generate_diagram` — converts Mermaid diagrams to FigJam
- `add_code_connect_map` / `send_code_connect_mappings` — Code Connect
- `create_design_system_rules` — design system agent instructions

## Known limitations (official, as of April 2026)

Source: [Figma Write to Canvas docs](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/)

- **20 KB output limit** per `use_figma` call — large write operations must be split into multiple calls
- **No image/asset import** — cannot embed raster images or external assets via MCP
- **No custom font loading** — only fonts already installed in the Figma file/org are available
- **Beta quality** — write to canvas is actively being improved; some edge cases may fail silently
- **Dev Seat = read-only** — `use_figma` (write) requires a Full Seat
- **`saveVersionHistoryAsync` not available** in Remote MCP sandbox — manual version history via Figma UI only
- **`figma.variables.getVariableById()` not available** in Remote MCP sandbox — use variable IDs retrieved via `get_variable_defs` and bind via `setBoundVariableForPaint`
- **SVG/vector assets** cannot be created programmatically via Plugin API in this context — clone existing vector nodes from the file instead
- **`generate_figma_design` (HTML capture)** requires the Figma capture script to run in the browser; external `<script src>` tags are not executed in headless browsers — use inline script embedding as a workaround
- **Write to canvas** is only available with select approved MCP clients (Claude Code, Cursor, VS Code, Codex, Copilot CLI, etc.) — not with arbitrary custom clients

## Constraints

- Do not assume custom-client OAuth/DCR for Figma Remote MCP is stable.
- Do not over-promise fully native OpenClaw-only write support.
- Keep the architecture future-compatible with a more native path later.
- Prefer usefulness over purity.
