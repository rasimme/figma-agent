---
name: figma-agent
description: Unified Figma skill for OpenClaw. Reads Figma context directly when available and routes write/edit/create operations through Claude Code ACP when needed. Best for screen inspection, design-context analysis, targeted edits, screenshot retrieval, and lightweight review loops.
version: 0.1.0
---

# Figma Agent

`figma-agent` is a **unified Figma skill** with a **hybrid architecture**:
- **Read / Inspect** operations should use the direct Figma path when available.
- **Write / Edit / Create** operations should go through **Claude Code via ACP**.
- To the user, this should feel like **one skill**, not two separate systems.

## When to use this skill

Use this skill when the user wants to:
- inspect a Figma screen, frame, or file
- retrieve screenshots or design context
- understand variables, structure, metadata, or connected design-system elements
- request targeted edits to an existing screen
- create a new screen or variant in Figma
- run a simple review loop: inspect → edit → inspect again

Do **not** use this skill for:
- generic design discussions without Figma context
- heavy multi-step autonomous workflow orchestration
- non-Figma browser automation as the primary path

## Product behavior

The skill should behave like **one product** with internal routing.

### Transparency rule
- **Simple read operations:** stay quiet about internal routing unless it matters.
- **Write / edit / create operations:** explicitly tell the user when you are switching to a heavier CC/ACP execution path.

Example:
- Good for read: “Ich habe den Screen analysiert. Das Layout nutzt …”
- Good for write: “Ich stoße die Änderung jetzt über Claude Code an und hole dir danach das Ergebnis zurück.”

## Capability groups

### 1. Inspect / Read
Use this path when the user wants to understand an existing design.

Typical requests:
- “Analysiere diesen Screen”
- “Hol mir den Screenshot”
- “Was sind hier die wichtigsten Komponenten?”
- “Welche Variablen / Tokens werden genutzt?”

Typical direct Figma capabilities:
- `figma__get_design_context`
- `figma__get_screenshot`
- `figma__get_metadata`
- `figma__get_variable_defs`
- `figma__search_design_system`
- `figma__get_figjam`
- `figma__get_code_connect_map`
- `figma__get_code_connect_suggestions`
- `figma__whoami`

### 2. Write / Edit / Create
Use this path when the user wants to change Figma content.

Typical requests:
- “Ändere dieses Layout”
- “Erstelle eine neue Variante”
- “Lege mir einen neuen Screen an”
- “Schreibe das in Figma um”

For these requests, prefer **Claude Code via ACP**.

Typical write-oriented Figma capabilities (via CC path):
- `use_figma`
- `create_new_file`
- `generate_figma_design`
- `generate_diagram`
- `add_code_connect_map`
- `send_code_connect_mappings`
- `create_design_system_rules`

## Routing rules

### Namespace note
- `figma__*` = direct OpenClaw-side tool surface
- `mcp__figma__*` = Figma MCP usage from inside the Claude Code path

The user should not need to care about this distinction, but the implementation must.

### Default heuristic
Use this simple split:

#### Route to direct read/inspect when the request is about:
- seeing
- understanding
- comparing
- extracting
- summarizing
- inspecting
- reviewing an already existing design state

#### Route to CC/ACP when the request is about:
- changing
- editing
- creating
- generating
- restructuring
- writing to canvas
- producing a new design state in Figma

### Mixed requests
If a request contains both reading and changing, do this:
1. Inspect first
2. Summarize the relevant context
3. Switch to the CC write path
4. Return the result

That is the preferred hybrid flow.

### Write path
For MVP, the write path means:
1. determine that mutation is required
2. gather the relevant Figma context first
3. hand the mutation task to the Claude Code path via ACP
4. let the write-side flow execute the Figma change
5. return the result into the main conversation

Keep this explicit and simple.

## MVP lead flow

The main v1 flow is:
1. User references an existing Figma screen or context
2. Read context directly
3. Detect needed change
4. Use CC/ACP for the write step
5. Return result
6. Accept one follow-up iteration

Keep this lightweight. Do not build a heavy workflow engine around it.

## Review loop behavior

A simple review loop is in scope:
- inspect current state
- perform targeted change
- show/summarize result
- accept one more correction or refinement

Avoid overcomplicated automation. Prefer clear step-by-step execution.

## Supported external positioning

For future ClawHub / public positioning, the skill should be described as:
- a **unified Figma skill**
- with **direct inspect/read capabilities**
- and **a transparent heavier write/edit/create path when needed**

This distinction should be documented clearly, but natural user interaction should stay simple.

## Failure handling

### If direct Figma auth fails
If a direct Figma read fails due to invalid or expired auth:
- stop the direct-read attempt
- tell the user clearly that Figma auth needs renewal
- point to the bootstrap / refresh path
- do not silently reroute this as if it were a write-path problem

### If read budget / limits become relevant
Do not pretend direct reads are always cheap or always available.
If the effective read path is constrained, say so clearly.

## Constraints

- Do not assume that arbitrary custom-client OAuth/DCR for the official remote MCP is stable.
- Do not over-promise fully native OpenClaw-only write support.
- Keep the architecture future-compatible with a more native direct path later.
- Prefer usefulness over purity.

## Execution guidance

### If the request is clearly read-only
Handle it directly and return the insight.

### If the request needs Figma mutation
Tell the user you are switching to the CC/ACP path, then execute there.

### If the request is ambiguous
Briefly clarify only if the answer materially changes whether this is a read or write operation, or changes the intended output.

## Packaging note

This skill is currently being prepared in a private repository.
Public packaging should keep the user-facing behavior clear and avoid overclaiming implementation maturity.
