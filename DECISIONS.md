# Decisions

## 2026-04-02 — Single Source of Truth
- `~/repos/figma-agent` is the canonical source of truth.
- `~/.openclaw/workspace/projects/figma-agent` must only be a symlink to the repo.
- Project state belongs in PROJECT.md / specs / context inside the repo.
- Bot-specific awareness belongs in the respective bot `TOOLS.md` when relevant.
- Do **not** add `figma-agent` as if it were already a globally installed/released skill in agent-wide identity docs.


## 2026-04-01 — Remote MCP als Zielarchitektur
- **Entscheidung:** Für die OpenClaw-Integration wird der offizielle Figma **Remote MCP** als Zielpfad verfolgt, nicht der Desktop MCP.
- **Warum:** Remote MCP ist von Figma empfohlen, benötigt keine Desktop-App auf dem Jetson und passt besser zu agentischen/serverseitigen Workflows.
- **Konsequenz:** Desktop MCP bleibt höchstens Test-/Fallbackpfad, aber nicht Architekturziel.
