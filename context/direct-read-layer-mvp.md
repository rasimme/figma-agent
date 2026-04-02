# Direct Read Layer MVP — figma-agent

## Goal
Define the first concrete MVP layer for direct Figma reads so `figma-agent` can inspect existing design state without routing every request through Claude Code.

This layer is intentionally narrow and reliable.

---

## Scope

### In scope
- inspect current design state
- fetch screenshot
- fetch design context
- fetch metadata
- fetch variable definitions
- search connected design-system elements
- fetch code-connect context/mappings when relevant
- auth sanity check (`whoami`)

### Out of scope
- any mutation
- new file creation
- design generation
- canvas edits
- autonomous retries / fallback trees

---

## Supported read operations

### Tier 1 — Core MVP reads
These should be considered the minimum reliable read layer:
- screenshot
- design context
- metadata
- variable definitions
- whoami

### Tier 2 — Extended reads
These are useful but secondary in MVP:
- search design system
- code-connect map
- code-connect suggestions
- context for code connect
- figjam inspection

---

## Product behavior

### Rule A — Prefer the smallest useful read
Do not over-call tools.
If the user only needs a screenshot, do not automatically fetch everything else.

### Rule B — Summarize, don’t dump
Return the insight the user needs, not raw technical noise, unless explicitly requested.

### Rule C — Read before write when context matters
If a mutation request depends on the current design state, use this layer first.

### Rule D — Fail clearly
If auth is invalid or the read path is unavailable:
- say that directly
- point to bootstrap / refresh
- do not invent a soft success

---

## Canonical operation mapping

### "Show / inspect / analyze"
Preferred tools, roughly in this order depending on the ask:
1. `figma__get_screenshot`
2. `figma__get_design_context`
3. `figma__get_metadata`

### "Variables / tokens / styles"
Preferred tools:
1. `figma__get_variable_defs`
2. `figma__search_design_system`

### "Code connect / implementation context"
Preferred tools:
1. `figma__get_context_for_code_connect`
2. `figma__get_code_connect_map`
3. `figma__get_code_connect_suggestions`

### "Auth / connection sanity check"
Preferred tool:
1. `figma__whoami`

---

## MVP response shapes

The layer should produce compact user-facing outputs such as:
- short visual summary
- component / structure summary
- variable / design-system summary
- implementation-relevant context summary
- auth/availability status

Not the full raw output unless the user asks.

---

## Failure handling

### Invalid / expired auth
Return a clear operational message:
- Figma direct access is currently not authenticated
- bootstrap / refresh is needed
- the request cannot proceed on the direct path right now

### Rate-limit / availability pressure
If the direct path is constrained:
- tell the user that direct inspection is currently constrained
- avoid pretending this is a generic unknown error

---

## Done when
- The direct read layer has a documented MVP scope
- Core vs extended read operations are separated
- Canonical tool mapping exists for main request types
- Failure behavior is explicit
- This can serve as the implementation reference for the next real skill behavior step
