# Figma Remote MCP → OpenClaw Agent

## Zielbild

Ein OpenClaw-Agent soll nicht nur Figma-Dateien lesen, sondern aktiv in Figma arbeiten können:
- neue Files anlegen
- Screens / Frames erzeugen
- bestehende Screens ändern
- Komponenten aus Libraries suchen und verwenden
- Variablen / Styles / Tokens pflegen
- Screenshots / Design-Kontext zurückholen
- iterativ auf Feedback reagieren

**Nicht Ziel in Phase 1:** direkte Orchestrierung von Figma Make als eigenständigem Prompt-System; das ist aktuell nicht sauber belegt.

---

## Technische Grundlage

### Empfohlener Pfad
Der offizielle **Figma Remote MCP Server** ist die Zielbasis:
- Endpoint: `https://mcp.figma.com/mcp`
- Auth: OAuth
- von Figma selbst empfohlen
- laut offizieller Doku mit der breitesten Feature-Menge

### Warum nicht Desktop MCP als Zielarchitektur
Desktop MCP ist nützlich für lokale Designer-Workflows, aber schlechter als dauerhafte OpenClaw-Basis:
- Desktop App nötig
- offiziell nur Windows/macOS
- Jetson/Linux ungeeignet
- stärker an lokale Selection/UI gebunden

**Fazit:** OpenClaw sollte auf **Remote MCP** zielen, nicht auf Desktop MCP.

---

## Capability-Matrix

### A. Was der Agent lesen kann
- Design-Kontext aus Frames/Layers
- Variablen / Styles
- Screenshots
- Metadaten / Layerstruktur
- Code Connect Mappings
- Design-System-Suche
- FigJam-Diagramme
- Make-Ressourcen als Kontext

Relevante Tools:
- `get_design_context`
- `get_variable_defs`
- `get_metadata`
- `get_screenshot`
- `search_design_system`
- `get_code_connect_map`
- `get_figjam`

### B. Was der Agent schreiben kann
- neue Figma-Dateien erzeugen
- Seiten / Frames anlegen
- Komponenten erstellen / ändern
- Varianten erzeugen
- Variablen / Token Collections anlegen
- Styles pflegen
- Auto Layouts bauen
- Inhalte in Figma updaten

Relevante Tools:
- `use_figma`
- `create_new_file`
- `search_design_system`

### C. Was wahrscheinlich möglich ist, aber getestet werden muss
- vollständige Screen-Erzeugung aus Briefing
- iterative Screen-Überarbeitung
- Design-System-Pflege über mehrere Schritte
- Library-Sync-ähnliche Workflows
- Code↔Design Loops mit Code Connect

### D. Was offen / unklar ist
- ob Figma Make direkt promptbar ist
- ob MCP Make nur als Kontextquelle nutzt
- wie frei `use_figma` in der Praxis wirklich ist
- wie robust große mehrstufige Schreibvorgänge sind
- welche Limits / Seat-Beschränkungen in der Praxis relevant werden

---

## OpenClaw-Zielarchitektur

### Schicht 1 – Connector
Ein OpenClaw-Skill oder Wrapper verbindet sich mit dem Figma Remote MCP.
Aufgaben:
- MCP-Verbindung
- OAuth/Auth-Handling
- Figma-File-/Node-Referenzen verwalten
- Skills/Tool-Aufrufe bündeln

### Schicht 2 – Workflow-Abstraktion
Nicht nur rohe Tools, sondern sinnvolle OpenClaw-Kommandos / Flows:
- `figma new-file`
- `figma build-screen`
- `figma edit-screen`
- `figma search-library`
- `figma sync-tokens`
- `figma inspect-selection`
- `figma screenshot`
- `figma implement-design`

### Schicht 3 – Agentische Schleife
1. Briefing / Prompt
2. Figma-File oder Zielseite bestimmen
3. Library / Komponenten / Tokens suchen
4. Inhalte auf Canvas schreiben
5. Screenshot / Kontext zurückholen
6. visuelle Prüfung / Review
7. iterieren
8. optional Übergabe an Code-Workflow

---

## Typische Workflows

### Workflow A — Neuer Screen
- neues File oder neue Page
- vorhandene Komponenten suchen
- Screen zusammensetzen
- Screenshot ziehen
- Review / nächste Iteration

### Workflow B — Bestehenden Screen ändern
- Ziel-Frame per URL/Node-ID referenzieren
- Struktur / Tokens / Komponenten lesen
- gezielt ändern
- Screenshot ziehen
- Diff / Review

### Workflow C — Design System Pflege
- Variables Collections erzeugen
- Farben / Spacing / Typography sauber strukturieren
- Komponenten / Varianten aktualisieren
- Benennung / Konsistenz prüfen

### Workflow D — Design-to-Code
- Design-Kontext lesen
- Code Connect Mapping nutzen
- Code generieren / aktualisieren
- ggf. zurück in Figma spiegeln

---

## Unterschiede zu Stitch

### Stitch
- prompt-zentrierte Generierung
- stark für explorative Screen-Erzeugung
- gut für „einfach mal was bauen“

### Figma MCP
- stärker strukturiert
- näher an echter Produkt-/Designsystem-Arbeit
- besser für Libraries, Komponenten, Tokens, iterative Team-Workflows und Code/Design-Verzahnung

**Kurz:** Stitch ist eher „Generierung zuerst“. Figma MCP ist eher „produktives Designsystem-/File-Arbeiten“.

---

## Risiken / offene Punkte
- Auth/OAuth sauber in OpenClaw integrieren
- prüfen, wie gut unser MCP-Stack HTTP-Remote-MCP trägt
- seat-/planabhängige Write-Rechte
- große mehrstufige Änderungen könnten fehleranfällig sein
- Figma Make selbst bleibt eine Grauzone
- ClawHub-Skill-Landschaft scheint dafür noch nicht reif → vermutlich Eigenbau

---

## Empfehlung

### Phase 1 — PoC
Mit Dev Botti:
1. Remote MCP anbinden
2. minimalen OpenClaw-Wrapper bauen
3. drei Kernfälle testen:
   - `create_new_file`
   - `search_design_system`
   - `use_figma` für einen einfachen Screen / Frame / Component-Flow

### Phase 2 — Workflow-Skill
Darauf aufbauend:
- `build-screen`
- `edit-screen`
- `design-system-sync`
- `screenshot-review-loop`

### Phase 3 — Make klären
Separat untersuchen:
- ob Make direkt orchestrierbar wird
- oder nur als Ressourcenkontext dient

## Entscheidungsfazit
Wenn wir das ernsthaft für OpenClaw bauen wollen, sollten wir auf den **offiziellen Remote Figma MCP** zielen, nicht auf eine Jetson-lokale Desktop-App-Lösung.
