# Figma Agent

## Git Repositories

- **Figma Agent:** _TBD (private repo to be created)_

## Goal

Prüfen, dokumentieren und umsetzen, wie der offizielle **Figma Remote MCP** in einen OpenClaw-Agenten integriert werden kann — inklusive Lesen, Schreiben, Design-System-Nutzung und iterativer Agent-Workflows.

## Scope
- **Dazu gehört:** Offizielle Figma-MCP-Recherche, Capability-Matrix, OpenClaw-Architektur, Auth-/MCP-Anbindung, PoC-Plan, möglicher Skill/Wrapper
- **Nicht dazu:** Produktionsreife Browser-Hacks, inoffizielle Figma-Automation als Primärpfad, generische Figma-Designarbeit ohne MCP-Bezug
- **Appetite:** Mittel bis groß — erst saubere Architektur und PoC, dann Umsetzung

## Background
Figma MCP hat sich stark weiterentwickelt: neben Read-Zugriff gibt es inzwischen offizielle Write-to-Canvas-Funktionen. Für OpenClaw ist das potenziell die Grundlage für einen echten Figma-Agenten, ähnlich zur Stitch-Integration — aber näher an realen Figma-Dateien, Libraries, Variablen und Komponenten.

Zentrale offene Frage: Wie gut eignet sich der **offizielle Remote MCP** als stabile Basis für einen OpenClaw-Agenten, und wo liegen die Grenzen gegenüber Figma Make, Desktop MCP oder Community-Lösungen wie figma-console-mcp?

## Architecture

**Stand 2026-04-02: Entschieden — Hybrid CC Token Bootstrap**

Siehe `context/architecture-proposal.md` für die vollständige Einordnung.

**Read-Operationen:** OpenClaw direkt, sobald der Bearer-Header in `openclaw.json` gesetzt ist und die Figma-Tools im jeweiligen Agenten erlaubt sind.
**Write-Operationen:** CC-Session mit Figma-MCP / offiziellen Figma-Skills.

Der aktuell gewählte Bootstrap-Pfad nutzt den vorhandenen Claude-Code-OAuth-Token als pragmatische Grundlage, statt auf einen ungeklärten Custom-DCR-Flow zu setzen.

## Project Files
- `context/architecture-proposal.md` — Architektur-Entscheidung mit allen 4 Optionen, Begründung, PoC-Erkenntnisse
- `context/research-figma-mcp-capabilities.md` — Capability-Matrix: 16 Tools, Rate Limits, Limitations
- `context/capability-routing-map.md` — Kanonische Routing-Regeln für Read / Write / Hybrid Requests
- `context/direct-read-layer-mvp.md` — konkreter MVP-Scope für den direkten Read-Layer
- `context/write-via-cc-mvp.md` — konkreter MVP-Scope für den Write-via-CC/ACP Pfad
- `context/review-loop-mvp.md` — schlanker MVP-Review-Loop nach Write-Ergebnissen
- `context/figma-remote-mcp-architecture.md` — Initiale Architektur-Exploration (historisch, superseded)

## Current Status
**Struktur bereinigt: T-013 = Foundation, T-014 = Produkt-MVP.**

### Aktuelle Richtung
- `figma-agent` wird als **einheitliches Produkt** gebaut.
- **Read / Inspect** soll direkt laufen.
- **Write / Edit / Create** soll über **CC/ACP** laufen.
- Der Nutzer sieht **einen Skill**, intern gibt es getrennte Ausführungspfade.

### Sauberer Schnitt
- **T-013 = Foundation / Enablement**
  - Bootstrap
  - Skill-Struktur
  - Basis-Skill-Dokumentation
  - technischer E2E-Nachweis
- **T-014 = Hybrid MVP / Productization**
  - Capability Map
  - Routing-Regeln
  - Read-Layer
  - Write-via-CC
  - Review-Loop
  - klare Außenkommunikation / Packaging

### Task-Stand
- T-001/T-002: Research + Auth-Exploration ✅ done
- T-003–T-006: Archived (alter PoC-Plan)
- T-007–T-012: Archived (superseded oder aufgegeben)
- **T-013: Foundation — Token Bootstrap + Skill Enablement** ▶ in-progress
  - T-013-1: Bootstrap Script (auth.mjs) — review
  - T-013-2: SKILL.md — review
  - T-013-3: Skill-Struktur & Clawhub-Metadaten — review
  - T-013-4: E2E Test — open
- **T-014: Hybrid MVP — Productization** ▶ review
  - T-014-1: Capability Map + Routing Rules — review
  - T-014-2: Direct Read Layer MVP — review
  - T-014-3: Write via CC/ACP MVP — review
  - T-014-4: Review Loop MVP — review
  - T-014-5: Skill Packaging + ClawHub Positioning — review

### Nächster Schritt
Kompakter Gesamt-Review auf Produktversprechen, Skill-Readiness und ClawHub-Risiken. Danach Priorisierung der eigentlichen Umsetzungsarbeit auf dem privaten Repo.

## Session Log

### 2026-04-01 — Projekt angelegt
- **Was wurde gemacht:** Projekt angelegt, initiale Architektur-Exploration.
- **Offene Fragen:** Auth-Pfad, CC als Bridge vs. direkt.

### 2026-04-01 — Research & PoC, Architektur-Entscheidung
- **Was wurde gemacht:**
  - Figma Remote MCP vollständig recherchiert: offizielle Tool-Landschaft, Rate Limits, Auth-Requirements
  - OpenClaw auf 2026.4.1 aktualisiert — nativer MCP HTTP-Transport bestätigt
  - mcporter OAuth getestet: initial wirkte es wie ein möglicher alternativer Auth-Pfad, später zeigte sich aber, dass der Flow den entscheidenden Redirect-/Auth-Schritt nicht sauber erreicht
  - CC ACP Sessions getestet: `--print` Mode lädt keine MCP-Server → CC als Bridge für diesen Pfad nicht belastbar
  - Custom Figma OAuth App geprüft: REST-Scopes sind nicht der MCP-Auth-Pfad
  - Eigene Raw-DCR-Tests sowie ein sauberer MCP-SDK-Test durchgeführt → beide enden aktuell bei `403 Forbidden`
- **Korrigierte Einschätzung:** Native OpenClaw-MCP-Anbindung bleibt technisch sinnvoll, aber der Self-Contained-Custom-Client-Pfad ist aktuell nicht bestätigt. Supported Clients bleiben der einzige klar belastbare Referenzpfad.
- **Tasks:** T-001/T-002 done, T-003–T-006 archived, T-007–T-012 neu angelegt
- **Offene Fragen:** Unterstützt Figma Custom MCP Clients offiziell? Falls ja: unter welchen Bedingungen / Freigaben? Wie sieht ein sauberer Support-Pfad für OpenClaw aus?

### 2026-04-01 — Dokumentations-Update nach Auth-/DCR-Tests
- **Was wurde gemacht:**
  - Offizielle Doku von praktischen Beobachtungen getrennt dokumentiert
  - Festgehalten, dass Remote MCP offiziell read + write unterstützt
  - Festgehalten, dass dokumentierte Clients funktionieren, während eigene Custom-Client-DCR-Tests aktuell auf `403 Forbidden` laufen
  - Vorbereitung für Gespräch mit Figma Vertrieb / Ansprechpartner: gezielte Frage nach Support bzw. Freigabe für Custom MCP Clients
- **Nächster externer Klärungspunkt:** Morgen im Gespräch mit Figma gezielt nach **Support-/Freigabemodell für Custom MCP Clients** fragen.

### 2026-04-01 — Projekt vorerst geschlossen
- **Was wurde gemacht:** Forschungsstand bereinigt und in PROJECT.md sowie den Kontextdokumenten sauber festgehalten.
- **Stand:** OpenClaw-seitig ist nativer HTTP-MCP-Support vorhanden; ungeklärt bleibt die offizielle Unterstützung/Freigabe für Custom MCP Clients bei Figma.

### 2026-04-02 — T-013 Foundation umgesetzt und bereinigt

- **Was wurde gemacht:**
  - T-013-1: Bootstrap-/Auth-Pfad als technische Foundation festgehalten; historisches `auth.mjs` bleibt als Research-Artefakt, aber der belastbare Weg ist der pragmatische Bootstrap über vorhandenen CC-Kontext
  - Bearer-Header in `openclaw.json` ist gesetzt
  - T-013-2: `SKILL.md` erstellt — Hybrid-Logik, Read/Write-Split, Routing-Regeln, Capability-Gruppen, MVP-Flow
  - T-013-3: Skill-Struktur angelegt / bereinigt — `references/figma-api.md`, `.clawhubignore`, `package.json` Beschreibung korrigiert
  - T-013-4: Foundation-E2E als technischer Stand zusammengeführt: Bootstrap + Skill-Struktur + Dokumentation bilden jetzt eine konsistente Basis für den nächsten Produkt-Schritt
- **Ergebnis:** T-013 ist funktional als **Foundation / Enablement** abgeschlossen; der nächste sinnvolle Move liegt jetzt in T-014.

### 2026-04-02 — Review 1 verarbeitet, T-014-1 bis T-014-3 geschärft
- **Was wurde gemacht:**
  - externer Architektur-/Produkt-Review auf Foundation + Routing-Logik ausgewertet
  - mechanischer Write-via-CC Ablauf explizit dokumentiert
  - 401-/Token-Fehlerverhalten ergänzt
  - Read-Budget / Rate-Limit Verhalten als Nutzerregel ergänzt
  - Namespace-Unterschied (`figma__*` vs `mcp__figma__*`) dokumentiert
  - `get_context_for_code_connect` in die Read-Routing-Definition aufgenommen
  - `context/direct-read-layer-mvp.md` angelegt
  - `context/write-via-cc-mvp.md` angelegt
  - T-014-1 und T-014-2 in Review überführt, T-014-3 auf MVP-Niveau konkretisiert
- **Nächster Schritt:** T-014-4 beginnen (Review Loop MVP).

### 2026-04-02 — Projekt wieder aktiv, Architektur entschieden
- **Was wurde gemacht:**
  - Figma MCP via CC verifiziert: `✓ Connected`, alle 17 Tools verfügbar, Simeon authentifiziert
  - CC-OAuth-Token in `~/.claude/.credentials.json` gefunden → Bootstrap-Ansatz als gangbarer Weg bestätigt
  - Architektur-Entscheidung: **CC Token Bootstrap (Hybrid)** — DCR-Problem umgangen
  - Alte Tasks T-007–T-012 archiviert (DCR/PKCE + mcporter Ansätze aufgegeben)
  - T-013 angelegt mit Spec + 4 Subtasks
  - `architecture-proposal.md` vollständig überarbeitet
- **Nächster Schritt:** T-013-1 implementieren (Bootstrap-Script)

### 2026-04-02 — Specify für Hybrid MVP abgeschlossen
- **Was wurde gemacht:**
  - Produktentscheidung für den nächsten Schritt präzisiert: nicht nur technischer Bootstrap, sondern ein echter **Hybrid MVP** für `figma-agent`
  - Specify-Flow genutzt, um Produktverhalten, Capability-Gruppen und MVP-Grenzen zu schärfen
  - Festgelegt: **Read direkt, Write über CC/ACP, einheitliche Skill-UX**
  - Transparenz-Regel festgelegt: Reads eher still, Writes/CC klar kommunizieren
  - Neuer Parent-Task **T-014 — Hybrid MVP für figma-agent** angelegt, inkl. 5 Subtasks
  - Neues Spec angelegt: `specs/T-014-figma-agent-hybrid-mvp.md`
  - Anschließend Task-Schnitt bereinigt: **T-013 bleibt Foundation**, **T-014 ist die nachgelagerte Produktisierung**
  - Foundation abgeschlossen und erste Productization-Arbeit gestartet: `context/capability-routing-map.md` angelegt
- **Nächster Schritt:** T-014-1 finalisieren und dann ersten externen Review-Punkt ansetzen.
