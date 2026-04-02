# ClawHub Positioning — figma-agent

## Current release posture
`figma-agent` is **not ready for public publication yet**.

Current intent:
- prepare a clean publishable skill structure
- make positioning and capability communication sharp
- review likely ClawHub concerns early
- keep release gated until implementation and packaging are stable

---

## Positioning statement

### Short positioning
`figma-agent` is a unified OpenClaw skill for working with Figma through a hybrid architecture:
- direct read / inspect flows where available
- write / edit / create via Claude Code / ACP path
- simple review loop on top

### Core promise
The user interacts with one skill, while the system routes internally between lightweight inspection and heavier mutation work.

---

## What should be emphasized publicly

### 1. Unified UX
The user does not need to think in separate technical paths.
They ask for Figma help naturally.

### 2. Real-world pragmatism
The skill is built around the currently reliable paths rather than pretending all Figma capabilities are equally native in OpenClaw today.

### 3. Strong read / write separation
This is a feature, not a weakness:
- inspect quickly
- mutate deliberately

### 4. Review-friendly workflow
The skill supports iterative design work rather than only one-shot commands.

---

## What should not be overclaimed

Do **not** claim yet:
- full native OpenClaw-only Figma write support
- production-grade autonomous orchestration
- broad self-healing workflows
- universal custom-client compatibility with Figma MCP auth flows

Do **not** hide the heavier write path.
That would create the wrong expectation.

---

## Likely ClawHub review sensitivities

### Sensitivity 1 — external side effects
Write-path behavior should be described clearly so review does not interpret it as hidden remote mutation.

### Sensitivity 2 — auth/bootstrap ambiguity
Do not present the auth situation as magically solved everywhere. Be explicit about the practical architecture.

### Sensitivity 3 — dependency confusion
Be clear that the skill experience is unified, but that write execution may rely on Claude Code / ACP in the current architecture.

### Sensitivity 4 — over-marketing
Keep wording concrete, not hypey.

---

## Safe packaging posture for now

Before publication, ensure:
- SKILL.md is public-facing and not full of internal delivery chatter
- package.json description matches actual product behavior
- ignored files exclude local auth / state / experiments
- references stay useful but focused
- no stale DCR/PKCE-first positioning remains

---

## Recommended pre-publish checklist

1. Run clawhub-lint before any publish attempt
2. Remove or soften internal implementation-only notes in SKILL.md
3. Verify `.clawhubignore` excludes local-only scripts/state
4. Re-check wording around auth, CC path, and native capability claims
5. Confirm repo is clean and intentionally structured

---

## Private-repo posture

For now the correct state is:
- keep the project in a private Git repo
- continue review and implementation there
- treat current ClawHub work as positioning/preparation only

No publish until the product behavior and packaging are both intentionally ready.
