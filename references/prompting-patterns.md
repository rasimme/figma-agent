# Prompting Patterns

Operational prompt patterns for the Figma Agent. These are agent-facing — they define how the agent should structure its own `use_figma` calls and internal reasoning, not user-facing communication.

---

## 1. Explicit Design-System Usage

Never assume the model will use design-system tokens. State them explicitly in every `use_figma` call.

**Pattern:** Name the exact variables, components, and styles to use.

```
// Instead of: "create a blue button"
// State: "create a button using component 'Button/Primary' with fill bound to variable 'colors/primary/500'"
```

**Why:** Implicit references ("use the primary color") resolve inconsistently. Explicit variable names eliminate drift.

**Apply when:** Every write that involves colors, spacing, typography, or component instantiation.

---

## 2. Variable-First Behavior

Structure `use_figma` code to resolve variables before creating visual elements.

**Pattern:** Load variables at the top of the block, then reference them during node creation.

```js
// Step 1: Resolve variables
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const colorCollection = collections.find(c => c.name === "Colors");
const vars = [];
for (const id of colorCollection.variableIds) {
  vars.push(await figma.variables.getVariableByIdAsync(id));
}
const primaryFill = vars.find(v => v.name === "colors/primary/500");

// Step 2: Create node with variable binding
const rect = figma.createRectangle();
const fills = [figma.util.solidPaint("#000000")]; // placeholder
fills[0] = figma.variables.setBoundVariableForPaint(fills[0], primaryFill, "color");
rect.fills = fills;
```

**Why:** Front-loading variable resolution prevents mid-block failures and makes the code self-documenting.

**Apply when:** Any write involving design tokens. See also [plugin-api-gotchas.md#paint-binding](plugin-api-gotchas.md#paint-binding).

---

## 3. Section-by-Section Execution

Break complex screens into discrete sections. Each section is a separate `use_figma` call followed by validation.

**Pattern:**
1. Identify logical sections (header, content, sidebar, footer)
2. Build section 1 -> validate with `get_screenshot`
3. Build section 2 -> validate
4. Continue until complete

**Why:** Monolithic writes are fragile. A failure in section 3 does not destroy sections 1-2 if they were written and validated separately.

**Apply when:** Any screen with 3+ distinct sections. See [core-rules.md](core-rules.md) — Batch-Write Heuristic.

---

## 4. HTML-to-Figma Framing

When using `generate_figma_design` for HTML-to-Figma:

**Pattern:** Frame it as exploration, not production output.

Internal reasoning:
- "This is a rapid draft for layout reference"
- "Output will need cleanup: variable binding, text resize, SVG evaluation"
- "This is step 1; production quality requires follow-up passes"

**Follow-up checklist after HTML-to-Figma:**
1. Check text nodes for fixed sizing -> fix with `textAutoResize`
2. Check colors for hardcoded hex -> map to variables
3. Check SVGs -> evaluate per SVG Decision Matrix
4. Check dimensions for decimal values -> round to integers
5. Check for missing auto-layout -> add where appropriate

See [workflow-selection.md](workflow-selection.md) — Native vs HTML-to-Figma Decision.

---

## 5. Validation Loop Framing

After each write, run a validation step. Structure it as a tight loop, not an afterthought.

**Pattern:**
```
Write section -> get_screenshot -> evaluate against intent -> fix if needed -> move on
```

**Evaluation questions:**
- Does the screenshot match the intended layout?
- Are spacing and alignment correct?
- Are the right colors/variables applied (check via `get_variable_defs` if uncertain)?
- Are text nodes readable and properly sized?

**If issues found:**
- Targeted fix (not rebuild). See [core-rules.md](core-rules.md) — Read -> Understand -> Fix -> Retry.
- Re-validate after fix.
- Only rebuild if the structural approach is fundamentally wrong.

---

## 6. Local-Context-First Prompting

Before reaching for external search, explicitly query the local file.

**Pattern:**
```
Step 1: get_variable_defs(fileKey, nodeId) — what variables exist locally?
Step 2: get_metadata(fileKey, nodeId) — what components/styles are already used?
Step 3: Only if 1-2 insufficient: search_design_system(query, fileKey)
```

**Why:** External search costs API calls and may return results that conflict with what the file already uses. Local context is the ground truth for the current file.

---

## 7. Reducing Model Drift

Techniques to keep `use_figma` code focused and correct:

**Be specific about parent-child relationships:**
```js
// State explicitly: "append card to container, then set FILL"
container.appendChild(card);
card.layoutSizingHorizontal = "FILL";
```

**State the expected outcome:**
```js
// "This should produce a 3-column grid with 16px gap"
frame.layoutMode = "HORIZONTAL";
frame.itemSpacing = 16;
```

**Avoid open-ended generation:**
- Don't: "create a nice-looking dashboard"
- Do: "create a frame named 'Dashboard' with layoutMode VERTICAL, containing 3 child frames for header (64px height), content (FILL), and footer (48px height)"

**Keep individual calls focused:**
- One logical operation per call
- Don't mix unrelated operations (e.g., creating a header AND binding colors on an unrelated component)

---

## 8. Error Recovery Framing

When an error occurs, structure the recovery explicitly:

**Pattern:**
1. "The error says: [exact message]"
2. "Checking plugin-api-gotchas.md — this matches: [gotcha name]"
3. "The fix is: [specific code change]"
4. "Retrying with the fix only, keeping everything else unchanged"

**Anti-patterns:**
- "Let me try a completely different approach" (premature)
- "I'll rebuild from scratch" (wasteful)
- "Retrying the same code" (definition of insanity)
