# T-014 — Figma Agent Hybrid MVP

## Goal
Build `figma-agent` as a unified Figma skill that combines **direct read/inspect capabilities** with **CC/ACP-based write operations**, so the user experiences one coherent tool while the implementation uses the most reliable execution path per operation.

## Context
- Official Figma Remote MCP supports both read and write workflows, but custom-client OAuth/DCR remains the practical blocker for fully native OpenClaw integration.
- OpenClaw transport capability is not the main issue; authentication and client support are.
- Claude Code is an officially supported Figma MCP client and is the most reliable write-path reference for now.
- For product UX, the skill should feel unified, not like two separate systems.
- Complexity should stay moderate: broad capability coverage, shallow automation.

## Product Direction
The MVP should validate the **hybrid architecture**:
- **Read / Inspect:** direct path
- **Write / Edit / Create:** CC/ACP path
- **User experience:** one skill with natural language interaction
- **Transparency:** writes/CC usage are communicated when relevant; simple reads stay quiet

## In Scope
- One unified skill entrypoint and interaction model
- Internal routing logic between read and write operations
- Direct read/inspect support for available Figma capabilities
- CC/ACP write path for targeted edits and creation tasks
- A simple review loop: request → result → feedback → follow-up iteration
- Clear external communication of supported capability groups for future ClawHub publishing

## Out of Scope
- Large autonomous workflow orchestration
- Heavy retry/recovery systems
- Full native OpenClaw-only write integration
- Exhaustive support for every possible Figma workflow in v1
- Complex multi-agent execution logic

## MVP Lead Flow
1. User references an existing Figma screen or context
2. Skill reads and summarizes the relevant context directly
3. Skill detects that a write/edit is required
4. Skill transparently switches to the CC/ACP write path
5. Result is returned to the user
6. User gives feedback
7. One follow-up iteration is possible

## Capability Groups

### 1. Inspect / Read
- design context
- screenshots
- metadata
- variables / components / structure

### 2. Write / Edit / Create
- targeted edits
- new screen / variant creation
- write-to-canvas related actions via CC/ACP

### 3. Review Loop
- result handoff back to user
- lightweight follow-up iteration
- no heavy workflow engine

### 4. Capability Disclosure
Externally the skill must clearly document:
- what it can do directly
- what goes via CC/ACP
- what kind of prompts/requests it supports well

## UX Rules
- The skill should behave like **one product**
- Internals remain structured by operation type
- Reads do not over-explain infrastructure
- Writes explicitly mention that a heavier execution path is being used when relevant

## Constraints
- Custom-client DCR/OAuth cannot be assumed to work reliably
- The architecture must remain future-compatible with a more native Figma path later
- v1 should optimize for usefulness, not purity
- Avoid overbuilding orchestration before real need exists

## Architecture Decision
**Chosen MVP architecture: Hybrid**
- Direct read/inspect path
- CC/ACP write path
- Unified skill UX

## Done When
- The hybrid direction is reflected in skill scope and project architecture docs
- The work is split into concrete implementation tasks
- The first implementation wave is structured around routing, read path, write path, review loop, and packaging
- The project status reflects the new MVP direction

## Suggested Task Structure
- Parent: T-014 — Figma Agent Hybrid MVP
- T-014-1 — Capability Map + Routing Rules
- T-014-2 — Direct Read Layer MVP
- T-014-3 — Write via CC/ACP MVP
- T-014-4 — Review Loop MVP
- T-014-5 — Skill Packaging + ClawHub Positioning

## Notes
This is intentionally a **broad-capability, shallow-automation** MVP. The first version should prove the product shape, not solve every orchestration problem.
