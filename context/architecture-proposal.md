# Architecture: Figma Agent Skill for OpenClaw

**Date:** 2026-04-01 (created), 2026-04-02 (final decision)
**Status:** Decided — Hybrid: CC Token Bootstrap + direct MCP for reads
**Goal:** Clean decision basis for Figma MCP integration into OpenClaw

---

## Chosen Architecture: Hybrid CC Token Bootstrap

> Update 2026-04-02: This architecture is not just a technical integration decision — it is also the **product-level MVP direction** for `figma-agent`. The skill is designed as a **unified surface with internal routing**: direct read/inspect capabilities + CC/ACP for write operations.

## Delivery Sequence

### Phase A — Foundation / Enablement (T-013)
Technical foundation first:
- Token bootstrap
- Skill structure
- Base SKILL.md
- Technical E2E proof

### Phase B — Hybrid MVP / Productization (T-014)
Then build the actual product:
- Capability map
- Routing rules
- Direct read layer
- Write via CC/ACP
- Review loop
- Skill packaging / ClawHub positioning

The first canonical routing definition is in `context/capability-routing-map.md`.
The first concrete MVP execution definitions are in:
- `context/direct-read-layer-mvp.md`
- `context/write-via-cc-mvp.md`

This separation is intentional: **T-013 makes the stack reliable, T-014 turns it into a product.**

### Core Decision (2026-04-02)

The CC OAuth token for Figma is stored in `~/.claude/.credentials.json` under `mcpOAuth` (including `refreshToken`). This enables a **token bootstrap without new DCR**: the token is extracted once from CC credentials and written into OpenClaw's MCP config as a Bearer header.

**Read operations:** Direct via zero-dep wrapper (`scripts/figma-mcp.mjs`)
**Write operations:** CC session with native `mcp__figma__*` tools + official Figma skills

### Options Overview

| Option | Approach | Assessment |
|--------|----------|------------|
| 1. Fix mcporter bug | External CLI dependency | ❌ Fragile dependency, ClawHub scanner risk |
| 2. Standalone auth (DCR/PKCE) | Custom auth script + OpenClaw `figma__*` tools | ❌ Failed: DCR 403 for custom clients |
| 3. CC in tmux | Claude Code as interactive bridge | ❌ Not publishable, not automatable |
| 4. Custom MCP client in skill | Bundled SDK transport | ❌ Overkill, duplicates OpenClaw features |
| **5. CC Token Bootstrap (Hybrid)** | **Extract CC token → OpenClaw config + CC for writes** | **✅ Chosen** |

### Why Option 5

This option is not just technically viable but also the strongest product foundation:
- **One skill, two paths:** The user talks to one system, not two separate integrations.
- **Broad capability, shallow automation:** v1 covers many useful capabilities without building a heavy workflow engine.
- **MVP-ready:** A real end-to-end flow is possible: read existing screen → targeted write path → return result → review iteration.
- **Reads immediately direct:** After one-time bootstrap, `get_design_context`, `get_screenshot` etc. run directly — no CC session latency for review workflows.
- **Writes via CC:** `use_figma`, `generate_figma_design` etc. run in CC where Figma OAuth session exists natively and official Figma skills are available.
- **No DCR needed:** Token already exists from CC auth — no custom client registration problem.
- **Clean separation:** Agent orchestrates from OpenClaw, CC executes complex write workflows.
- **ClawHub-publishable:** Skill has no runtime dependencies on CC; bootstrap is a one-time setup script.

---

## Skill Architecture (T-013)

```
figma-agent/
├── SKILL.md                  # Workflows: Read (direct) + Write (CC) + tool inventory
├── scripts/
│   ├── figma-mcp.mjs         # Zero-dep Figma MCP client (~191 LOC)
│   └── bootstrap-token.mjs   # Multi-client token bootstrap: CC/Codex/Windsurf → openclaw.json
├── references/
│   └── figma-api.md          # Tool reference: all 17 tools with context annotation
├── package.json              # No SDK — only Node built-ins
└── .clawhubignore
```

### Token Bootstrap Flow (scripts/bootstrap-token.mjs)

```
Scan supported clients (CC → Codex → Windsurf)
  → read accessToken + refreshToken + expiresAt
  → optional: --refresh to get fresh token via OAuth metadata endpoint
  → write to ~/.openclaw/openclaw.json:
      mcp.servers.figma.headers.Authorization = "Bearer <token>"
  → reminder: gateway restart required
```

### Read/Write Split

| Context | Tools | When |
|---------|-------|------|
| **Direct (figma-mcp.mjs)** | `get_design_context`, `get_screenshot`, `get_metadata`, `get_variable_defs`, `search_design_system`, `whoami`, `get_figjam`, `get_code_connect_map`, `get_code_connect_suggestions`, `get_context_for_code_connect` | Review, analysis, inspect, data retrieval |
| **CC session** | `use_figma`, `generate_figma_design`, `create_new_file`, `generate_diagram`, `add_code_connect_map`, `send_code_connect_mappings`, `create_design_system_rules` | Create designs, manage libraries, write tokens |

### Product Rules for v1
- **Read / Inspect:** quiet and direct
- **Write / Edit / Create:** transparently communicate the heavier CC/ACP path
- **External positioning / ClawHub:** clearly name capability groups, even though user interaction stays naturally unified

### Token Refresh
- v1.0: Manual — re-run `bootstrap-token.mjs --refresh` on 401 errors
- v1.1: Cron job monitoring `expiresAt` and auto-triggering bootstrap

---

## PoC Phase Findings (2026-04-01)

### Officially documented
- Figma Remote MCP supports **read + write**, not just read-only
- Official clients: Claude Code, Codex, Cursor, VS Code (and more via MCP Catalog)
- OpenClaw has native HTTP MCP support since 2026.4.1

### Practically observed
- Custom client DCR: **403 Forbidden** (raw request + MCP SDK path tested)
- CC sessions in `--print` mode do not load MCP servers → CC as pure bridge path is not viable
- CC interactive: all 17 Figma tools available, OAuth token in `~/.claude/.credentials.json`

### Decided
- DCR/PKCE custom auth: **Abandoned** (403, no known approval model)
- mcporter: **Abandoned** (OAuth flow incomplete, fragile dependency)
- CC Token Bootstrap: **Chosen**

---

## Rate Limits & Costs

| Plan | Daily Limit | Write Tools |
|------|-------------|-------------|
| Org/Pro Full/Dev | 200/day | Exempt |
| Starter | 6/month | Exempt |

- `use_figma` currently free (beta), will become "usage-based paid feature"
