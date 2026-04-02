# T-013: Figma Agent — Token Bootstrap + Skill

**Created**: 2026-04-02
**Status**: Draft
**Project**: figma-agent
**Source**: chat

## Goal

OpenClaw-Agenten können Figma-Daten nativ lesen (über CC-OAuth-Token-Bootstrap in OpenClaw MCP) und komplexe Write-Operationen über CC-Sessions ausführen — geliefert als publishbarer OpenClaw-Skill mit Bootstrap-Script.

## Non-Goals

- Eigene Figma-OAuth-App oder Custom-DCR-Registration (DCR 403 bleibt ungelöst, Bootstrap nutzt bestehenden CC-Token)
- Automatisches Token-Refresh (v1.0: manuell; Cron-Refresh ist v1.1)
- Figma Desktop MCP Integration (kein Linux-Desktop auf Jetson)

## User Stories

### Story 1 — Natives Figma-Lesen aus OpenClaw (Priority: P1)

Als OpenClaw-Agent kann ich Figma-Daten (Screenshots, Design Context, Variables, Metadata) direkt nativ lesen, ohne eine CC-Session starten zu müssen.

**Acceptance Scenarios:**
1. **Given** Bootstrap-Script wurde einmal ausgeführt, **When** OpenClaw-Agent ruft `figma__get_design_context` auf, **Then** gibt Figma-Daten zurück ohne CC-Session
2. **Given** Token ist abgelaufen, **When** Agent versucht Figma-Tool aufzurufen, **Then** erhält klaren 401-Fehler mit Hinweis "Bootstrap-Script erneut ausführen"

### Story 2 — Figma Writes via CC-Session (Priority: P1)

Als Nutzer kann ich den Agenten beauftragen, Figma-Designs zu erstellen oder Bibliotheken zu pflegen — der Agent startet dafür automatisch eine CC-Session.

**Acceptance Scenarios:**
1. **Given** Skill ist geladen, **When** Nutzer sagt "erstelle eine neue Figma-Komponente", **Then** Agent nutzt CC-Session mit `mcp__figma__use_figma` oder `mcp__figma__generate_figma_design`
2. **Given** SKILL.md ist geladen, **When** Agent will Design Library aufbauen, **Then** delegiert an CC via `figma:figma-generate-library` Skill

### Story 3 — Einmaliger Bootstrap-Setup (Priority: P1)

Als Nutzer kann ich einmalig ein Bootstrap-Script ausführen, das den CC-OAuth-Token automatisch in OpenClaw's MCP-Config einträgt.

**Acceptance Scenarios:**
1. **Given** CC hat Figma OAuth-Token in `~/.claude/.credentials.json`, **When** `node scripts/auth.mjs` ausgeführt wird, **Then** wird `openclaw.json` mit `mcp.servers.figma.headers.Authorization` aktualisiert und OpenClaw-Gateway restarted
2. **Given** Bootstrap-Script erfolgreich ausgeführt, **When** `openclaw mcp list` oder nativer Tool-Aufruf, **Then** Figma-Server zeigt `Connected` in OpenClaw

### Story 4 — SKILL.md Workflow-Dokumentation (Priority: P2)

Als OpenClaw-Agent erhalte ich durch das SKILL.md klare Anweisungen welche Figma-Tools in welchem Kontext genutzt werden (native vs. CC-Session).

**Acceptance Scenarios:**
1. **Given** SKILL.md geladen, **When** Figma-Read-Aufgabe, **Then** Agent nutzt native `figma__*` Tools ohne CC
2. **Given** SKILL.md geladen, **When** Figma-Write-Aufgabe, **Then** Agent startet CC-Session mit korrektem Figma-Skill

## Requirements

- **FR-001**: Bootstrap-Script MUSS `accessToken` aus `~/.claude/.credentials.json` (Schlüssel `mcpOAuth`) lesen können
- **FR-002**: Bootstrap-Script MUSS `openclaw.json` mit `mcp.servers.figma.headers.Authorization = "Bearer <token>"` aktualisieren
- **FR-003**: Bootstrap-Script MUSS `expiresAt` aus Credentials lesen und bei abgelaufenem Token warnen (nicht abbrechen)
- **FR-004**: SKILL.md MUSS alle 17 Figma-MCP-Tools mit Context-Annotation dokumentieren (Read/native vs. Write/CC)
- **FR-005**: SKILL.md MUSS mindestens diese Workflows dokumentieren: Design-Library-Aufbau, Screen-Generierung, Design-Context-Review, Variables/Tokens-Lesen, Code-Connect-Setup

## Success Criteria

- **SC-001**: Nach `node scripts/auth.mjs` ist `figma__whoami` in OpenClaw-Sessions aufrufbar ohne CC-Session
- **SC-002**: SKILL.md vollständig (alle 17 Tools gelistet, Read/Write-Split klar markiert)
- **SC-003**: Skill hat Stitch-analoge Struktur: `SKILL.md` + `scripts/` + `references/` + `.clawhubignore`

## Approach

1. **T-013-1 Bootstrap-Script**: Node.js-Script (`scripts/auth.mjs`) liest CC credentials, patcht `openclaw.json`, optionaler Gateway-Restart
2. **T-013-2 SKILL.md**: Dokumentiert alle Workflows — Read-Workflows (native), Write-Workflows (CC-Session mit figma:figma-use / figma:figma-generate-library etc.), Tool-Inventar, Setup-Anleitung
3. **T-013-3 Skill-Struktur**: `references/figma-api.md` (Tool-Referenz), `SKILL.md`-Frontmatter für Clawhub, `.clawhubignore` (scripts/auth.mjs Token-Pfade)

## Constraints

- Token-Refresh v1.0: manuell (bootstrap.mjs erneut ausführen)
- Script darf Token-Werte niemals loggen oder ausgeben
- Skill muss ohne Netzwerk-Zugriff zur Install-Zeit funktionieren (Bootstrap läuft on-demand, nicht beim Skill-Load)

## Clarifications

### Session 2026-04-02
- Q: Alle Operationen über CC oder Hybrid? → A: Hybrid — OpenClaw nativ für Reads, CC für Writes
- Q: Scripts oder reines SKILL.md? → A: SKILL.md + Bootstrap-Script für Token-Setup
- Q: Token-Refresh-Strategie? → A: v1.0 manuell, v1.1 Cron
