# Write via CC / ACP MVP - figma-agent

## Goal
Define the first reliable write path for `figma-agent` using Claude Code / ACP as the mutation layer for Figma.

This is the complementary half of the hybrid architecture:
- reads can stay direct
- writes go through CC

---

## Why this exists
The product needs real Figma mutation capability, but the current trusted path for that capability is the Claude Code side with Figma MCP access.

Therefore, the MVP write layer should not try to be clever. It should be explicit, narrow, and dependable.

---

## Scope

### In scope
- targeted edits to an existing design
- creation of a new screen when explicitly requested
- one write task per user intent
- result returned into the main conversation
- support for at least one follow-up iteration

### Out of scope
- autonomous chains of many write steps
- hidden orchestration trees
- automatic retries after unclear failures
- complex workflow state machines
- silent background mutation without the user understanding that a write is happening

---

## Canonical write flow

1. **Detect mutation intent**
   The agent recognizes that the request implies a changed future Figma state.

2. **Gather minimum useful context first**
   Before writing, collect the relevant read context if needed:
   - screenshot
   - design context
   - metadata
   - variables / design-system context

3. **Frame the mutation task clearly**
   The write instruction should be narrow and explicit:
   - what should change
   - what should stay stable
   - what file/screen/context it applies to
   - what success looks like

4. **Hand off to CC via ACP**
   The OpenClaw-side agent starts the CC/ACP write execution.

5. **CC performs the mutation**
   CC uses its Figma-side MCP/tool context to execute the write step.

6. **Return result to main flow**
   The main agent summarizes what changed and presents the result.

7. **Allow one review iteration**
   If the user wants a refinement, run one targeted follow-up edit.

---

## Product rules

### Rule A - Read first when context matters
If the change request depends on the current state, inspect before writing.

### Rule B - Keep write instructions narrow
Do not send vague prompts like "make it better".
Prefer targeted deltas.

### Rule C - Tell the user when the heavy path starts
Because write execution is slower and has side effects, it should be communicated clearly.

### Rule D - Return concrete change summary
After a write step, the user should get:
- what changed
- what remained stable
- what to review next

### Rule E - One request, one write step
For MVP, avoid turning a single user message into a long hidden chain.

---

## Prompt content requirements for the CC path

A good write handoff should contain:
- target artifact / screen reference
- brief current-state summary
- requested delta
- constraints / non-goals
- expected output form

### Example structure
- Context: current screen / file / frame
- Change request: exact mutation
- Keep stable: things that must not drift
- Output expectation: updated design / screenshot / summary

---

## Failure behavior

### If CC write path is unavailable
Say so clearly. Do not pretend the mutation succeeded.

### If the write result is incomplete or ambiguous
Return the ambiguity honestly and ask for the next concrete decision.

### If the issue is really auth/tooling
Frame it as infrastructure/path failure, not as user design failure.

---

## User-facing behavior

Good phrasing:
- "I'll push this change through Claude Code now since we need to write directly into Figma."
- "Let me grab the relevant context first, then I'll hand the targeted change off to the write path."

Bad behavior:
- hiding that a heavier side-effecting path is being used
- pretending the write path is identical to a simple read

---

## Done when
- the CC write path is documented as a concrete MVP layer
- the handoff shape is clear enough for implementation
- failure behavior is explicit
- this can serve as the reference for T-014-3 implementation decisions
