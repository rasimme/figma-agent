# Decisions

## 2026-04-03 — Prerequisite model for auth
- **Decision:** Figma Remote MCP requires one-time OAuth via an approved client (Claude Code, Codex, Cursor, VS Code, Windsurf). This is a documented prerequisite.
- **Why:** Figma blocks Dynamic Client Registration (DCR) for custom/unapproved clients with HTTP 403. Approved clients complete DCR + OAuth automatically.
- **Consequence:** `bootstrap-token.mjs` extracts the token from the client's credential store and writes it to OpenClaw config. No custom DCR, no tmux hacks.
- **Temporary:** This will be replaced once Figma opens DCR or OpenClaw becomes an approved MCP client.

## 2026-04-02 — Single Source of Truth
- `~/repos/figma-agent` is the canonical source of truth.
- `~/.openclaw/workspace/projects/figma-agent` must only be a symlink to the repo.
- Project state belongs in PROJECT.md / specs / context inside the repo.
- Bot-specific awareness belongs in the respective bot `TOOLS.md` when relevant.
- Do **not** add `figma-agent` as if it were already a globally installed/released skill in agent-wide identity docs.

## 2026-04-01 — Remote MCP as target architecture
- **Decision:** The official Figma **Remote MCP** is the target path for OpenClaw integration, not Desktop MCP.
- **Why:** Remote MCP is Figma's recommended path, requires no desktop app on the Jetson, and fits agentic/server-side workflows better.
- **Consequence:** Desktop MCP remains a test/fallback path at most, not the architectural target.
