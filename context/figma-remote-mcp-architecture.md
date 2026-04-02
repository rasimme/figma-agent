# Figma Remote MCP → OpenClaw Agent

## Target State

An OpenClaw agent should not only read Figma files but actively work in Figma:
- create new files
- create screens/frames
- modify existing screens
- search and use library components
- manage variables/styles/tokens
- retrieve screenshots and design context
- iterate on feedback loops

**Not a Phase 1 goal:** direct orchestration of Figma Make as an independent prompt system. This is not sufficiently validated yet.

---

## Technical Foundation

### Recommended path
The official **Figma Remote MCP Server** is the target foundation:
- Endpoint: `https://mcp.figma.com/mcp`
- Auth: OAuth
- Recommended by Figma
- Broadest documented feature set

### Why Desktop MCP is not the target architecture
Desktop MCP is useful for local designer workflows, but weaker as a long-term OpenClaw foundation:
- Requires desktop app
- Officially Windows/macOS only
- Not suitable for Jetson/Linux server setup
- More tightly coupled to local selection/UI behavior

**Conclusion:** OpenClaw should target **Remote MCP**, not Desktop MCP.

---

## Capability Matrix

### A. What the agent can read
- design context from frames/layers
- variables/styles
- screenshots
- metadata/layer structure
- Code Connect mappings
- design-system search
- FigJam diagrams
- Make resources as context

Relevant tools:
- `get_design_context`
- `get_variable_defs`
- `get_metadata`
- `get_screenshot`
- `search_design_system`
- `get_code_connect_map`
- `get_figjam`

### B. What the agent can write
- create new Figma files
- create pages/frames
- create/modify components
- generate variants
- create variable/token collections
- maintain styles
- build auto-layout structures
- update canvas content

Relevant tools:
- `use_figma`
- `create_new_file`
- `search_design_system`

### C. Likely possible but needs validation
- full screen generation from brief
- iterative screen revisions
- multi-step design-system maintenance
- library-sync-like workflows
- code↔design loops with Code Connect

### D. Open / unclear
- whether Figma Make can be directly orchestrated
- whether MCP uses Make only as context source
- how flexible `use_figma` is in real-world complex flows
- robustness of large multi-step write operations
- practical impact of limits/seat restrictions

---

## OpenClaw Target Architecture

### Layer 1 — Connector
An OpenClaw skill or wrapper connects to Figma Remote MCP.
Responsibilities:
- MCP connection
- OAuth/auth handling
- file/node reference handling
- tool call abstraction

### Layer 2 — Workflow abstraction
Not just raw tools, but meaningful OpenClaw commands/flows:
- `figma new-file`
- `figma build-screen`
- `figma edit-screen`
- `figma search-library`
- `figma sync-tokens`
- `figma inspect-selection`
- `figma screenshot`
- `figma implement-design`

### Layer 3 — Agentic loop
1. brief/prompt
2. determine target file/page
3. search library/components/tokens
4. write content to canvas
5. retrieve screenshot/context
6. visual review
7. iterate
8. optional handoff to code workflow

---

## Typical Workflows

### Workflow A — New screen
- create new file or page
- search existing components
- assemble screen
- capture screenshot
- review / next iteration

### Workflow B — Edit existing screen
- reference target frame via URL/node ID
- read structure/tokens/components
- apply targeted changes
- capture screenshot
- diff/review

### Workflow C — Design system maintenance
- create variable collections
- structure colors/spacing/typography
- update components/variants
- verify naming/consistency

### Workflow D — Design-to-code
- read design context
- use Code Connect mapping
- generate/update code
- optionally reflect updates back to Figma

---

## Differences vs Stitch

### Stitch
- prompt-centric generation
- strong for exploratory screen creation
- good for rapid ideation

### Figma MCP
- more structured
- closer to real production design-system workflows
- better for libraries, components, tokens, iterative team workflows, and code/design integration

**Short:** Stitch is generation-first. Figma MCP is production design workflow-first.

---

## Risks / Open Points
- clean OAuth integration into OpenClaw
- validate how well MCP stack handles HTTP Remote MCP at scale
- seat/plan-dependent write permissions
- large multi-step changes may be brittle
- Figma Make remains a gray area
- ClawHub ecosystem maturity for this use case is still limited

---

## Recommendation

### Phase 1 — PoC
With Dev Botti:
1. connect Remote MCP
2. build minimal OpenClaw wrapper
3. test three core cases:
   - `create_new_file`
   - `search_design_system`
   - `use_figma` for a simple screen/frame/component flow

### Phase 2 — Workflow skill
Then add:
- `build-screen`
- `edit-screen`
- `design-system-sync`
- `screenshot-review-loop`

### Phase 3 — Clarify Make path
Investigate separately:
- whether Make can be orchestrated directly
- or only used as context source

## Decision Summary
If this is a serious OpenClaw integration, target the **official Remote Figma MCP**, not a Jetson-local desktop-app approach.
