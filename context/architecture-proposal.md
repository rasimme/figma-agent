# Architektur: Figma Agent Skill für OpenClaw

**Datum:** 2026-04-01 (erstellt), 2026-04-02 (finale Entscheidung)
**Status:** Entschieden — Hybrid: CC Token Bootstrap + native OpenClaw MCP für Reads
**Ziel:** Saubere Entscheidungsgrundlage für Figma MCP Integration in OpenClaw

---

## Entschiedene Architektur: Hybrid CC Token Bootstrap

> Update 2026-04-02: Diese Architektur ist nicht nur ein technischer Integrationsentscheid, sondern auch die **produktseitige MVP-Richtung** für `figma-agent`. Der Skill wird als **einheitliche Oberfläche mit internem Routing** gedacht: direkte Read/Inspect-Fähigkeiten + CC/ACP für Write-Operationen.

## Delivery Sequence

### Phase A — Foundation / Enablement (T-013)
Zuerst wird die technische Grundlage sauber fertiggestellt:
- Token Bootstrap
- Skill-Struktur
- Basis-SKILL.md
- technischer E2E-Nachweis

### Phase B — Hybrid MVP / Productization (T-014)
Danach wird daraus das eigentliche Produkt gebaut:
- Capability Map
- Routing-Regeln
- Direct Read Layer
- Write via CC/ACP
- Review Loop
- Skill Packaging / ClawHub Positioning

Die erste kanonische Routing-Definition liegt in `context/capability-routing-map.md`.
Die ersten konkreten MVP-Ausführungsdefinitionen liegen in:
- `context/direct-read-layer-mvp.md`
- `context/write-via-cc-mvp.md`

Diese Trennung ist bewusst: **T-013 macht den Stack belastbar, T-014 macht daraus ein Produkt.**

### Kern-Entscheidung (2026-04-02)

Der CC-OAuth-Token für Figma ist in `~/.claude/.credentials.json` unter `mcpOAuth` gespeichert (inkl. `refreshToken`). Damit ist ein **Token-Bootstrap ohne neue DCR** möglich: der Token wird einmalig aus CC-Credentials extrahiert und in OpenClaw's MCP-Config als Bearer-Header eingetragen.

**Read-Operationen:** OpenClaw nativ via `figma__*` Tools (kein CC-Overhead)
**Write-Operationen:** CC-Session mit nativen `mcp__figma__*` Tools + offiziellen Figma-Skills

### Optionen-Übersicht

| Option | Ansatz | Bewertung |
|--------|--------|-----------|
| 1. mcporter Bug fixen | Externe CLI-Dependency | ❌ Fragile Dependency, ClawHub-Scanner-Risiko |
| 2. Standalone Auth (DCR/PKCE) | Eigenes Auth-Script + OpenClaw `figma__*` Tools | ❌ Gescheitert: DCR 403 für Custom Clients |
| 3. CC in tmux | Claude Code als interaktiver Bridge | ❌ Nicht publishbar, nicht automatisierbar |
| 4. Eigener MCP-Client im Skill | Bundled SDK-Transport | ❌ Overkill, dupliziert OpenClaw-Features |
| **5. CC Token Bootstrap (Hybrid)** | **CC-Token extrahieren → OpenClaw-Config + CC für Writes** | **✅ Gewählt** |

### Warum Option 5

Diese Option ist nicht nur technisch brauchbar, sondern auch produktseitig die stärkste Basis für den nächsten Schritt:
- **Ein Skill, zwei Pfade:** Der User spricht mit einem System, nicht mit zwei getrennten Integrationen.
- **Breite Capability, flache Automatisierung:** v1 soll viele sinnvolle Fähigkeiten kennen, ohne sofort eine große Workflow-Maschine zu bauen.
- **MVP-tauglich:** Ein echter End-to-End Flow ist möglich: bestehenden Screen lesen → gezielten Write-Pfad nutzen → Ergebnis zurückgeben → Review-Iteration.

- **Reads sofort nativ:** Nach einmaligem Bootstrap läuft `figma__whoami`, `figma__get_design_context` etc. nativ in OpenClaw — keine CC-Session-Latenz für Review-Workflows
- **Writes via CC:** `use_figma`, `generate_figma_design` etc. laufen in CC wo die Figma-OAuth-Session nativ besteht und die offiziellen Figma-Skills verfügbar sind
- **Kein DCR nötig:** Der Token existiert bereits durch CC-Auth — kein Custom-Client-Registration-Problem
- **Saubere Trennung:** Agent orchestriert aus OpenClaw, CC führt komplexe Write-Workflows aus
- **Clawhub-publishbar:** Skill hat keine Laufzeit-Dependencies auf CC; Bootstrap ist einmaliges Setup-Script

---

## Skill-Architektur (T-013)

```
figma-agent/
├── SKILL.md                  # Workflows: Read (native) + Write (CC) + Tool-Inventar
├── scripts/
│   └── auth.mjs              # Token-Bootstrap: CC credentials → openclaw.json
├── references/
│   └── figma-api.md          # Tool-Referenz: alle 17 Tools mit Kontext-Annotation
├── package.json              # Kein SDK — nur Node built-ins
└── .clawhubignore
```

### Token-Bootstrap Flow (scripts/auth.mjs)

```
~/.claude/.credentials.json
  → lese mcpOAuth['figma|...'].accessToken + expiresAt
  → prüfe ob abgelaufen (Warnung, kein Abbruch)
  → patch ~/.openclaw/openclaw.json:
      mcp.servers.figma.headers.Authorization = "Bearer <token>"
  → Hinweis: OpenClaw-Gateway-Restart erforderlich
  → figma__whoami nativ verfügbar
```

### Read/Write-Split

### Produktregel für v1
- **Read / Inspect:** eher leise und direkt
- **Write / Edit / Create:** transparent als schwererer Pfad kommunizieren, wenn CC/ACP genutzt wird
- **Außenkommunikation / ClawHub:** Capability-Gruppen klar benennen, auch wenn die Nutzung natürlichsprachlich einheitlich bleibt

### Read/Write-Split

| Kontext | Tools | Wann |
|---------|-------|------|
| **OpenClaw nativ** | `figma__get_design_context`, `figma__get_screenshot`, `figma__get_metadata`, `figma__get_variable_defs`, `figma__search_design_system`, `figma__whoami`, `figma__get_figjam`, `figma__get_code_connect_map` | Review, Analyse, Inspect, Daten holen |
| **CC-Session** | `mcp__figma__use_figma`, `mcp__figma__generate_figma_design`, `mcp__figma__create_new_file`, `mcp__figma__generate_diagram`, `mcp__figma__add_code_connect_map`, `mcp__figma__send_code_connect_mappings`, `mcp__figma__create_design_system_rules` | Design erstellen, Library pflegen, Tokens schreiben |

### Token-Refresh

- v1.0: Manuell — bootstrap.mjs erneut ausführen bei 401-Fehler (CC refresht Token automatisch)
- v1.1: Cron-Job der `expiresAt` überwacht und Bootstrap auto-triggert

---

## Erkenntnisse aus PoC-Phase (2026-04-01)

### Offiziell dokumentiert

- Figma Remote MCP unterstützt **Read + Write**, nicht nur Read-only
- Offizielle Clients: Claude Code, Codex, Cursor, VS Code (und weitere via MCP Catalog)
- OpenClaw hat seit 2026.4.1 nativen HTTP-MCP-Support

### Praktisch beobachtet

- Custom-Client-DCR: **403 Forbidden** (Raw-Request + MCP-SDK-Pfad getestet)
- CC-Sessions in `--print` Mode laden keine MCP-Server → CC als reiner Bridge-Pfad nicht geeignet
- CC interaktiv: alle 17 Figma-Tools verfügbar, OAuth-Token in `~/.claude/.credentials.json`

### Entschieden

- DCR/PKCE Custom-Auth: **Aufgegeben** (403, kein Freigabe-Modell bekannt)
- mcporter: **Aufgegeben** (OAuth-Flow unvollständig, fragile Dependency)
- CC Token Bootstrap: **Gewählt**

---

## Rate Limits & Kosten

| Plan | Tägliches Limit | Write-Tools |
|------|----------------|-------------|
| Org/Pro Full/Dev | 200/Tag | Exempt |
| Starter | 6/Monat | Exempt |

- `use_figma` aktuell kostenlos (Beta), wird "usage-based paid feature"
- Simeon: Starter Plan (privat) + UXMA Org Plan
