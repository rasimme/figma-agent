# Decisions

## 2026-04-01 — Remote MCP als Zielarchitektur
- **Entscheidung:** Für die OpenClaw-Integration wird der offizielle Figma **Remote MCP** als Zielpfad verfolgt, nicht der Desktop MCP.
- **Warum:** Remote MCP ist von Figma empfohlen, benötigt keine Desktop-App auf dem Jetson und passt besser zu agentischen/serverseitigen Workflows.
- **Konsequenz:** Desktop MCP bleibt höchstens Test-/Fallbackpfad, aber nicht Architekturziel.
