# Capability Routing Map — figma-agent

## Purpose
This document defines how `figma-agent` should route user requests internally while preserving a unified skill UX.

The product rule is simple:
- **Read / inspect / analyze** → direct path
- **Write / edit / create** → CC/ACP path

The user should not have to choose the path manually.

---

## 1. Routing Layers

## Namespace note
- `figma__*` = OpenClaw-side direct tool surface
- `mcp__figma__*` = Figma MCP usage from inside Claude Code / CC path

Both belong to the same product behavior, but they are different execution surfaces.

### Layer A — Direct Read / Inspect
Use this layer when the user wants to understand an existing Figma state.

Typical intent verbs:
- analyze
- inspect
- review
- compare
- explain
- summarize
- extract
- show

Typical outputs:
- screenshot
- design summary
- metadata / structure summary
- variable / design-system information
- code-connect overview

### Layer B — CC / ACP Write Path
Use this layer when the user wants a changed future state in Figma.

Typical intent verbs:
- change
- edit
- create
- generate
- rewrite
- restructure
- update
- make a variant
- build a screen

Typical outputs:
- changed screen
- new screen
- changed component structure
- generated design result

### Layer C — Review Loop
Use this when the user evaluates the result of a write step and asks for refinement.

Typical sequence:
1. inspect result
2. collect feedback
3. run one targeted follow-up edit
4. return updated result

This remains deliberately shallow in MVP scope.

---

## 2. Canonical Routing Rules

### Rule 1 — Existing state only = direct path
If the request is about the **current** design state only, stay on the direct path.

Examples:
- “Analysiere diesen Screen”
- “Zeig mir den Screenshot”
- “Welche Komponenten sind hier wichtig?”
- “Welche Variablen nutzt das?”

### Rule 2 — Future changed state = CC path
If the request implies a **new or changed** state in Figma, route to CC/ACP.

Examples:
- “Mach den Hero kompakter”
- “Erstelle eine Mobile-Variante”
- “Baue einen neuen Settings-Screen”
- “Ändere die Karten auf 2 Spalten”

### Rule 3 — Mixed request = inspect first, then switch
If a request contains both analysis and change:
1. inspect current context first
2. summarize the important findings
3. switch to CC/ACP for mutation

This is the preferred hybrid flow.

### Rule 4 — Clarify only when routing depends on the answer
Ask a question only if the answer materially changes:
- whether the task is read vs write
- which artifact should be edited
- what concrete output should be produced

Do **not** over-clarify stylistic details too early.

### Rule 5 — Mention heavy path only when relevant
When switching to CC/ACP, say so clearly.
For direct reads, avoid unnecessary internal narration.

### Rule 6 — Mechanical write path
For MVP, the CC write path means:
1. determine that mutation is required
2. gather the relevant Figma context first
3. hand the mutation task to Claude Code via ACP
4. let the CC-side flow execute the Figma write step
5. return the result into the main conversation

This should stay explicit and simple.

---

## 3. Capability Buckets

### Direct bucket
Use when available and sufficient:
- screenshot retrieval
- design-context extraction
- metadata / structure inspection
- variable / token inspection
- connected design-system search
- figjam inspection
- code-connect lookup
- context for code connect
- identity / auth confirmation

### CC bucket
Use for:
- targeted edits
- creating new screens
- generating variants
- writing to canvas
- design-generation requests
- design-system rule generation where mutation is implied

### Hybrid bucket
Requests that naturally span both:
- “Analysiere und verbessere diesen Screen”
- “Hol den Kontext und passe danach das Layout an”
- “Vergleiche den Screen und baue eine bessere Mobile-Version”

---

## 4. Failure behavior and usage constraints

### 401 / token-expired behavior
If a direct Figma read fails because the token is expired or invalid:
1. stop the current direct-read attempt
2. tell the user clearly that the Figma authentication is no longer valid
3. point to the bootstrap / refresh path
4. do not silently reinterpret this as a write-path problem

### Read-budget / rate-limit behavior
Direct reads should be treated as valuable, not infinite.

Current product rule:
- if direct reads are healthy and available, prefer them for inspect/analyze flows
- if direct-read budget or rate limits become a real constraint, surface that explicitly

User-facing rule:
- say clearly when the direct-read path is currently constrained
- do not hide read scarcity behind vague tool-failure wording

## 5. MVP-safe boundaries

### In-scope for MVP
- direct reads
- targeted writes via CC
- one review iteration
- unified UX

### Not in scope for MVP
- autonomous multi-step orchestration
- automatic retries / recovery trees
- deep workflow state machines
- opaque background execution without user awareness

---

## 6. User-facing behavior

### For reads
Good behavior:
- concise
- direct
- result-oriented

### For writes
Good behavior:
- explicitly note heavier execution path
- set expectation that generation/edit may take longer
- return result clearly

Example phrasing:
- “Ich lese mir den aktuellen Figma-Kontext kurz direkt ein.”
- “Für die Änderung gehe ich jetzt über den CC-Pfad, weil wir dafür in Figma schreiben müssen.”

---

## 7. Build implications

This routing map drives the next implementation work:
- direct read surface
- CC write entrypoint
- simple review loop
- packaging and public capability communication

It should remain the canonical routing reference for `figma-agent` unless the architecture changes materially.
