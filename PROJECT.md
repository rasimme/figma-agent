# Figma Agent

## Git Repositories

- **Figma Agent:** `git@github.com:rasimme/figma-agent.git` (private)

## Goal

Integrate Figma's official **Remote MCP** into OpenClaw as a unified skill — covering read, write, design-system access, and iterative agent workflows.

## Scope
- **In scope:** Official Figma MCP research, capability matrix, OpenClaw architecture, auth/MCP integration, PoC, publishable skill/wrapper
- **Out of scope:** Production-grade browser hacks, unofficial Figma automation as primary path, generic Figma design work without MCP context
- **Appetite:** Medium to large — clean architecture and PoC first, then implementation

## Background
Figma MCP has evolved significantly: beyond read access, there are now official write-to-canvas capabilities. For OpenClaw, this is potentially the foundation for a real Figma agent — closer to actual Figma files, libraries, variables, and components than the Stitch integration.

Central question: How well does the **official Remote MCP** serve as a stable foundation for an OpenClaw agent, and where are the limits compared to Figma Make, Desktop MCP, or community solutions?

## Architecture

**Decided 2026-04-02: Hybrid CC Token Bootstrap**

See `context/architecture-proposal.md` for the full evaluation.

- **Read operations:** Direct via zero-dep wrapper (`scripts/figma-mcp.mjs`) using Bearer token in `openclaw.json`.
- **Write operations:** Claude Code session with Figma MCP / official Figma skills via ACP.

The bootstrap path extracts an existing OAuth token from a supported MCP client (Claude Code, Codex, Windsurf) rather than relying on unproven custom DCR.

### Delivery Sequence
- **Phase A — Foundation / Enablement (T-013):** Token bootstrap, skill structure, base SKILL.md, technical E2E proof
- **Phase B — Hybrid MVP / Productization (T-014):** Capability map, routing, direct read layer, write via CC/ACP, review loop, packaging

T-013 makes the stack reliable. T-014 makes it a product.

## Single Source of Truth

**Canonical source:** `~/repos/figma-agent`

Workspace path `~/.openclaw/workspace/projects/figma-agent` should only be a symlink to the repo. Do not maintain two independent copies.

## Project Files
- `context/architecture-proposal.md` — Architecture decision with all options, rationale, PoC findings
- `context/research-figma-mcp-capabilities.md` — Capability matrix: 17 tools, rate limits, limitations
- `context/capability-routing-map.md` — Canonical routing rules for read / write / hybrid requests
- `context/direct-read-layer-mvp.md` — Concrete MVP scope for the direct read layer
- `context/write-via-cc-mvp.md` — Concrete MVP scope for the write-via-CC/ACP path
- `context/review-loop-mvp.md` — Lightweight MVP review loop after write results
- `context/clawhub-positioning.md` — ClawHub positioning, safe claims, pre-publish checklist
- `context/figma-remote-mcp-architecture.md` — Initial architecture exploration (historical, superseded)

## Current Status

**Structure clarified: T-013 = Foundation, T-014 = Product MVP.**

### Direction
- `figma-agent` is built as a **unified product**.
- **Read / Inspect** runs directly via `scripts/figma-mcp.mjs`.
- **Write / Edit / Create** runs through **CC/ACP**.
- The user sees **one skill**; internally there are separate execution paths.

### Task Status
- T-001/T-002: Research + auth exploration — done
- T-003–T-012: Archived (old PoC plans, superseded approaches)
- **T-013: Foundation — Token Bootstrap + Skill Enablement** — in-progress
  - T-013-1: Bootstrap script (auth.mjs) — review
  - T-013-2: SKILL.md — review
  - T-013-3: Skill structure & ClawHub metadata — review
  - T-013-4: E2E test — open
- **T-014: Hybrid MVP — Productization** — review
  - T-014-1: Capability map + routing rules — review
  - T-014-2: Direct read layer MVP — review
  - T-014-3: Write via CC/ACP MVP — review
  - T-014-4: Review loop MVP — review
  - T-014-5: Skill packaging + ClawHub positioning — review

### Next Step
Finish T-013-4 (E2E technical proof), then lock implementation order for T-014.

## Session Log

### 2026-04-01 — Project created
- **Done:** Project created, initial architecture exploration.
- **Open questions:** Auth path, CC as bridge vs. direct.

### 2026-04-01 — Research & PoC, architecture decision
- **Done:**
  - Figma Remote MCP fully researched: official tool landscape, rate limits, auth requirements
  - OpenClaw updated to 2026.4.1 — native MCP HTTP transport confirmed
  - mcporter OAuth tested: initial impression of a viable alt path; later showed it doesn't cleanly reach the redirect/auth step
  - CC ACP sessions tested: `--print` mode does not load MCP servers → CC as bridge unreliable for this path
  - Custom Figma OAuth app checked: REST scopes ≠ MCP auth path
  - Raw DCR tests + clean MCP SDK test → both end at `403 Forbidden`
- **Corrected assessment:** Native OpenClaw MCP remains technically sound, but self-contained custom-client path is unconfirmed. Supported clients remain the only proven reference path.
- **Tasks:** T-001/T-002 done, T-003–T-006 archived, T-007–T-012 created
- **Open questions:** Does Figma officially support custom MCP clients? If so, under what conditions?

### 2026-04-01 — Documentation update after auth/DCR tests
- **Done:** Separated official documentation from practical observations. Prepared targeted question for Figma contact about custom MCP client support.

### 2026-04-02 — Project reopened, architecture decided
- **Done:**
  - Figma MCP via CC verified: all 17 tools available, Simeon authenticated
  - CC OAuth token found in `~/.claude/.credentials.json` → bootstrap approach confirmed
  - Architecture decision: **CC Token Bootstrap (Hybrid)**
  - Old tasks T-007–T-012 archived
  - T-013 created with spec + 4 subtasks
  - `architecture-proposal.md` fully rewritten
- **Next:** T-013-1 implementation

### 2026-04-02 — T-013 Foundation implemented
- **Done:**
  - T-013-1: Bootstrap/auth path established as technical foundation
  - Bearer header set in `openclaw.json`
  - T-013-2: SKILL.md created — hybrid logic, read/write split, routing rules, capability groups
  - T-013-3: Skill structure created — `references/`, `.clawhubignore`, `package.json` corrected
- **Result:** T-013 functionally complete as Foundation / Enablement.

### 2026-04-02 — Specify for Hybrid MVP completed
- **Done:**
  - Product decision: unified Hybrid MVP for figma-agent
  - Specify flow used to sharpen product behavior, capability groups, MVP boundaries
  - Transparency rule defined: reads quiet, writes explicit about CC path
  - T-014 created with 5 subtasks + spec
  - Task split clarified: T-013 = Foundation, T-014 = Productization
  - Context docs created: capability-routing-map, direct-read-layer-mvp, write-via-cc-mvp, review-loop-mvp, clawhub-positioning

### 2026-04-02 — Repo established as SSOT
- **Done:**
  - `~/repos/figma-agent` set as canonical source
  - Workspace symlinked to repo
  - Private GitHub repo pushed
  - Overall review completed: documentation side ready, next is implementation

### 2026-04-02 — Zero-dep MCP wrapper built
- **Done:**
  - `scripts/figma-mcp.mjs` — zero-dependency Figma MCP client (~191 LOC)
  - JSON-RPC 2.0 over HTTP POST, SSE response parsing, PKCE-ready
  - All 4 tests passing: whoami, listTools, get_metadata, get_screenshot
  - GPT-5.4 review: 10 findings, 8 fixed in two commits
  - mcporter no longer needed — all operations run through own wrapper

### 2026-04-03 — Multi-client bootstrap + token refresh
- **Done:**
  - `scripts/bootstrap-token.mjs` — scans CC, Codex, Windsurf for Figma tokens
  - Token refresh via Figma OAuth metadata endpoint working
  - `--dry-run` and `--refresh` flags
  - Full E2E test: bootstrap → refresh → wrapper → all 4 Figma MCP calls passing
  - Prerequisite model finalized: one-time connection via supported client (CC, Codex, Cursor, VS Code, Windsurf), then bootstrap script handles the rest
