# Research: Figma MCP Capabilities & Landscape

**Datum:** 2026-04-01
**Quelle:** Offizielle Figma Developer Docs, Figma Forum, Community-Projekte

---

## 1. Offizielle Figma Remote MCP — Tool-Inventar

Endpoint: `https://mcp.figma.com/mcp`

### Read Tools
| Tool | Beschreibung | File-Typen |
|------|-------------|------------|
| `get_design_context` | Design-Kontext für Layer/Selection — Output Default: React + Tailwind, konfigurierbar | Design, Make |
| `get_variable_defs` | Variablen und Styles einer Selection (Farben, Spacing, Typography) | Design |
| `get_code_connect_map` | Mapping Figma Node-IDs → Code-Komponenten im Codebase | Design |
| `get_screenshot` | Screenshot einer Selection — empfohlen für Layout-Fidelity | Design, FigJam |
| `get_metadata` | Sparse XML: Layer IDs, Namen, Typen, Position, Größen — gut für große Designs | Design |
| `get_figjam` | FigJam-Diagramme als XML mit Screenshots | FigJam |
| `search_design_system` | Suche über alle verbundenen Libraries: Komponenten, Variablen, Styles | Design |
| `whoami` | User-Identität, Plans, Seat-Typen (remote only) | — |

### Write Tools
| Tool | Beschreibung | File-Typen | Hinweise |
|------|-------------|------------|----------|
| `use_figma` | General-Purpose Write: Create, Edit, Delete, Inspect beliebiger Objekte | Design, FigJam | Führt JavaScript via Plugin API aus. Braucht Full Seat. Beta, wird kostenpflichtig. |
| `create_new_file` | Neues leeres Design- oder FigJam-File in Drafts | — | Gibt file_key + file_url zurück |
| `generate_figma_design` | UI-Layers aus Live-Interfaces generieren → neues/bestehendes File oder Clipboard | Design | Remote only, nur bestimmte Clients, exempt von Rate Limits |
| `generate_diagram` | FigJam-Diagramm aus Mermaid-Syntax | — | Flowchart, Gantt, State, Sequence |
| `add_code_connect_map` | Mapping Figma Node → Code-Komponente hinzufügen | Design | |
| `create_design_system_rules` | Rule-File für Design-System-aware Code-Generierung | — | |

### Code Connect Tools
| Tool | Beschreibung |
|------|-------------|
| `get_code_connect_suggestions` | Von Figma getriggert: Vorschläge für Component→Code Mappings |
| `send_code_connect_mappings` | Bestätigt vorgeschlagene Code Connect Mappings |

---

## 2. Abgrenzung: Remote MCP vs. Desktop MCP vs. REST API vs. Plugin API

| Aspekt | Remote MCP | Desktop MCP | REST API | Plugin API |
|--------|-----------|-------------|----------|------------|
| **Hosting** | Figma Cloud (`mcp.figma.com`) | Lokal, braucht Figma Desktop App | Figma Cloud Endpoints | Innerhalb Figma App (Plugins/Widgets) |
| **Auth** | OAuth 2.0 (DCR, nur approved Clients) | Lokale App-Session | Personal Access Token (PAT) oder OAuth | App-Session |
| **Platform** | Jede (headless möglich mit Proxy) | Windows/macOS only | Jede | Windows/macOS (Desktop App) |
| **Write-Fähigkeit** | ✅ via `use_figma` (Plugin API JS) | ✅ via `use_figma` | Begrenzt (Comments, Variables, einige Properties) | ✅ Voller Zugriff |
| **Selection-Awareness** | ❌ Nein — Link-basiert | ✅ Ja, real-time | ❌ Nein | ✅ Ja |
| **Rate Limits** | 200/Tag (Pro/Org Full/Dev), 600/Tag (Enterprise) | Keine dokumentierten | Tier-basiert (10-100/min) | Keine |
| **Jetson-kompatibel** | ✅ (mit OAuth-Lösung) | ❌ (kein Linux-Desktop) | ✅ | ❌ |
| **Feature-Breite** | Breiteste MCP-Toolset | Selection + Write | CRUD auf Files/Nodes/Variables | Voller Runtime-Zugriff |
| **Figma Make** | Lesend als Kontext | Lesend als Kontext | ❌ | ❌ |

### Fazit Abgrenzung
- **REST API:** Gut für automatisierte Bulk-Ops (Export, Variables CRUD, File Management), kein `use_figma`
- **Plugin API:** Mächtigstes Interface, aber braucht Desktop-App-Runtime — kein headless
- **Desktop MCP:** Plugin API via MCP-Protokoll, aber Desktop-App-bound
- **Remote MCP:** Plugin API via Cloud-Proxy — headless-fähig, aber OAuth-Gate

---

## 3. Auth-Modell — Das zentrale Problem

### Wie Remote MCP authentifiziert (offiziell + technisch)
1. OAuth 2.0 mit Dynamic Client Registration (DCR)
2. Client schickt Registration gegen Figma's Registration-Endpoint
3. Danach folgen Authorization + Token Exchange
4. Für Remote MCP gibt es keinen PAT-/API-Key-Shortcut wie bei der REST API

### Was offiziell dokumentiert ist
- Figma dokumentiert konkrete unterstützte Clients / Installpfade (u. a. Claude Code, Codex, Cursor, VS Code).
- Figma dokumentiert **nicht explizit**, dass nur diese Clients erlaubt sind.
- Figma dokumentiert aber auch **nicht explizit**, dass beliebige standards-konforme Custom Clients frei per DCR/OAuth unterstützt werden.

### Was praktisch beobachtet wurde
- Eigene Custom-Client-Tests scheitern aktuell bei der OAuth Client Registration / DCR mit **`403 Forbidden`**.
- Das betrifft sowohl direkte DCR-Requests als auch einen sauberen Test über den offiziellen MCP SDK OAuth-Pfad.
- Öffentliche Berichte/Forum-Posts deuten in dieselbe Richtung: dokumentierte Clients funktionieren, Custom Clients stoßen an der Auth-/DCR-Schicht auf Hürden.

### Was das für OpenClaw aktuell bedeutet
- OpenClaws native HTTP-MCP-Support ist **nicht** das Hauptproblem.
- Der reale Blocker ist aktuell die **Figma-Auth-/DCR-Schicht für Custom Clients**.
- Daraus folgt momentan: dokumentierte/supported Clients sind der sicherste bekannte Integrationspfad; Custom-Client-Support bleibt ungeklärt.

### Lösungswege

#### Option A: Approved Client als Proxy (empfohlen für PoC)
OpenClaw nutzt einen approved Client (Claude Code, Cursor, Codex) als MCP-Bridge:
- CC/Codex verbindet zu Figma MCP direkt (ist approved)
- OpenClaw spawnt CC-Session, CC ruft Figma-Tools auf
- **Pro:** Funktioniert sofort, keine Custom-Auth
- **Contra:** Indirekt, zusätzliche Latenz, CC als Middleman

#### Option B: Community Proxy (bitovi/figma-mcp-proxy)
- Open-Source OAuth-Proxy der das DCR-Problem umgeht
- Läuft als eigener Service, leitet Auth weiter
- **Pro:** Headless, direkte Tool-Aufrufe
- **Contra:** Unklar ob noch funktioniert, Abhängigkeit von Figma's Toleranz

#### Option C: Figma Client-Approval / Klarstellung einholen
- Direkte Klärung mit Figma, ob und wie Custom MCP Clients unterstützt oder freigegeben werden
- **Pro:** Offizieller Weg, reduziert Rätselraten
- **Contra:** Abhängig von Figma-Antwort, möglicherweise Wartezeit

#### Option D: REST API + Community MCP (GLips/Figma-Context-MCP)
- Lesen: GLips MCP (nutzt REST API mit PAT, kein OAuth-Gate)
- Schreiben: REST API (begrenzt) oder `use_figma` via Option A
- **Pro:** Sofort nutzbar für Read-Workflows
- **Contra:** Kein `use_figma`, kein Write-to-Canvas via REST

#### Option E: mcporter direkt auf Remote MCP
- mcporter hat OAuth-Support (`mcporter auth`)
- Könnte als Figma-MCP-Client agieren wenn OAuth-Flow durchkommt
- **Zu testen:** Ob mcporter durch das DCR-Gate kommt oder auch 403 bekommt

---

## 4. Rate Limits & Kosten

| Plan/Seat | Tägliches Limit | Per-Minute |
|-----------|----------------|------------|
| Enterprise (alle) | 600/Tag | 20/min |
| Org/Pro + Full/Dev | 200/Tag | 10-15/min |
| Starter oder View/Collab | 6/Monat | — |

**Wichtig:**
- Write-Tools (`use_figma`, `generate_figma_design`, `add_code_connect_map`, `whoami`) sind **exempt von Rate Limits**
- Limits gelten für Read-Tools
- Limit richtet sich nach File-Location (Workspace/Team), nicht nur User-Seat
- `use_figma` ist aktuell kostenlos (Beta), wird "usage-based paid feature"

---

## 5. Bekannte Limitierungen von `use_figma`

- 20KB Output-Response-Limit pro Call
- Keine Image/Asset-Unterstützung (kein Import von Bildern/Videos/GIFs)
- Keine Custom Fonts
- Components müssen manuell published werden bevor Code Connect greift
- Beta-Qualität — Output braucht manuelles Review und Cleanup
- Keine Selection-Awareness (Link-basiert, nicht Echtzeit-Selection)

---

## 6. Alternative MCP Server (Community)

| Server | Ansatz | Auth | Write? | Vorteile |
|--------|--------|------|--------|----------|
| **GLips/Figma-Context-MCP** | REST API, vereinfacht Responses | PAT | ❌ | Sofort nutzbar, kein OAuth-Gate, Open Source |
| **Figma Console MCP** | WebSocket Desktop Bridge + REST + Plugin API | PAT | ✅ (90+ dedizierte Tools) | Granulare Write-Tools, Batch-Ops, besseres Error Handling |
| **Tim Holden's Design System MCP** | REST API, Design-System-fokussiert | PAT | Teilweise | Variables/Files ohne Plugin API |

---

## 7. Offene Klärung für das Gespräch mit Figma

Für morgen ist ein Gespräch mit einem Figma-Vertriebler / Ansprechpartner geplant. Ziel:
- klären, ob Custom MCP Clients offiziell unterstützt werden,
- falls ja: unter welchen Bedingungen,
- falls nein oder eingeschränkt: welcher offiziell empfohlene Integrationspfad für Plattformen wie OpenClaw vorgesehen ist.

Die Dokumentation sollte bis dahin bewusst trennen zwischen:
- **offiziell dokumentiert**,
- **praktisch beobachtet**,
- **offen / bei Figma zu klären**.

## 8. OpenClaw-spezifischer Kontext

### Was wir haben
- `mcp-bridge` Plugin aktiv in OpenClaw
- `mcporter` CLI installiert (HTTP + stdio MCP, Auth, Config)
- ACP-Runtime für CC/Codex-Sessions (approved Figma Clients)
- Stitch-Design Skill als Referenz-Architektur für Design-Tool-Integration

### Was wir brauchen
- OAuth-Lösung für headless Figma-MCP-Zugriff
- Oder: bewusste Entscheidung CC/Codex als Proxy zu nutzen
- Figma Full Seat (für Write-Access) — **Simeon: welcher Plan/Seat?**
