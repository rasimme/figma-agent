# Review Loop MVP — figma-agent

## Goal
Define the smallest useful review loop for `figma-agent` after a write step.

The purpose is not full workflow orchestration. The purpose is one clean follow-up cycle after a changed Figma result comes back.

---

## Scope

### In scope
- present result after a write step
- collect focused feedback
- run one targeted follow-up edit
- return updated result

### Out of scope
- long autonomous iteration chains
- hidden branching review states
- complex retry trees
- approval workflow engines

---

## Canonical review loop

1. **Present the result clearly**
   After a write step, show the user what changed.

2. **Anchor the feedback request**
   Ask for focused feedback on the result, not a total re-brief.

3. **Detect whether the feedback is a targeted revision**
   If yes, run one follow-up write step.

4. **Return the revised result**
   Summarize what was adjusted.

5. **Stop after one clean iteration in MVP mode**
   If the work is drifting into larger redesign, surface that explicitly.

---

## Product rules

### Rule A — Ask for concrete feedback
Good prompts:
- what should change?
- what should stay?
- is the issue layout, hierarchy, spacing, copy, or style?

### Rule B — Keep the second write narrower than the first
The review loop should refine, not restart the task.

### Rule C — Surface scope drift honestly
If the user’s follow-up really implies a broader redesign, say so instead of pretending it is a small iteration.

### Rule D — Preserve continuity
The user should feel this is the same task continuing, not a new disconnected request.

---

## Good MVP behavior

After the first result:
- summarize the visible change
- ask one focused follow-up question if needed
- run one targeted revision
- return the revised result

---

## Failure behavior

### If the follow-up request is too broad
Say that it exceeds the intended lightweight review loop and should become a bigger change request.

### If the write path fails during review
Say clearly that the revision could not be completed and why.

---

## Done when
- the review loop is defined as a small explicit layer
- one clean follow-up iteration is supported conceptually
- scope drift behavior is explicit
- this can serve as the implementation reference for T-014-4
