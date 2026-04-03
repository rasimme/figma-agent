# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.2] - 2026-04-03

### Changed
- Republished `figma-agent` to ensure the ClawHub listing uses the display name **Figma Agent**

## [0.1.1] - 2026-04-03

### Fixed
- Removed legacy OAuth experiment scripts (`auth.mjs`, `sdk-auth-test.mjs`) from repo
- Corrected Figma Remote MCP link in README (→ official help docs)
- Made all ACP/write-path references provider-agnostic (Claude Code, Codex, or any supported ACP agent)
- Removed `.clawhubignore` from public git tracking (added to `.gitignore`)
- Added `displayName: "Figma Agent"` to `package.json` for correct ClawHub display name

## [0.1.0] - 2026-04-03

### Added
- **Hybrid architecture** — direct read/inspect via Figma Remote MCP + write/edit/create via Claude Code ACP sessions
- **Zero-dependency MCP client** (`scripts/figma-mcp.mjs`) — JSON-RPC 2.0 over HTTP POST, handles SSE and direct JSON responses, auto-Bearer-prefix, timeout support
- **Multi-client token bootstrap** (`scripts/bootstrap-token.mjs`) — scans Claude Code, Codex, and Windsurf credential stores, refreshes expired tokens, writes Bearer header to OpenClaw config
- **Full 17-tool coverage** — all official Figma Remote MCP tools documented with read/write split
- **Known limitations** — official Figma limitations (20 KB limit, no image import, no custom fonts, sandbox restrictions) documented in SKILL.md with sources
- **`references/figma-api.md`** — concise API reference for all MCP tools
