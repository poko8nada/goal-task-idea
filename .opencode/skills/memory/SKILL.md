---
name: memory
description: Trigger when a meta insight is worth recording, at session end, or when memory needs maintenance. Maintains a 3-layer knowledge base — raw logs, patterns, and principles. Only the principles layer is injected into the agent's context.
---

# Skill: memory

Maintain a 3-layer knowledge base. Only Layer 2 is injected into the agent's context. Layer 0 and Layer 1 are working data.

## The 3 layers

- **Layer 0** (Raw) — session events, append-only, max 500 lines, oldest removed first
- **Layer 1** (Patterns) — re-derived from Layer 0, MECE patterns
- **Layer 2** (Principles) — re-derived from Layer 1, injected into context

## How to maintain

### Layer 0: append and rotate

- Each entry is one bullet line — `[YYYY-MM-DD] [what happened — one sentence, specific and factual]`
- No headings, no sections — just a flat list
- Append new entries to the bottom
- If the file exceeds 500 lines, remove the oldest entries from the top
- No timestamps inside the entry — the date prefix is the only timestamp

### Layer 1: re-derive from Layer 0

When Layer 0 has changed meaningfully, re-derive Layer 1 from scratch. Do not merge with old Layer 1.

Each item is one of:

- "This user tends to value X" — observed preference
- "Past failure with this pattern, so next time..." — failure-informed judgment
- "This project's unspoken assumptions" — implicit context
- "Common communication friction and how to avoid it" — anti-pattern
- "My (this agent's) weakness and correction rule" — self-correction

### Layer 2: re-derive from Layer 1

When Layer 1 has changed meaningfully, re-derive Layer 2 from scratch. Do not merge with old Layer 2.

Flat list of abstract, actionable principles.

## Update timing

Decide based on content, not session count. If the agent catches itself thinking "5 sessions passed, time to update", that is a signal to think harder about whether the content has actually changed.

- Layer 0: at session end, or when significant events occur during the session
- Layer 1: when Layer 0 has content that does not fit the existing patterns
- Layer 2: when Layer 1 has content that does not fit the existing principles

## Storage

- Layer 0: `store/layer-0.md`
- Layer 1: `store/layer-1.md`
- Layer 2: `store/layer-2.md`
- All in `store/` subfolder of this skill
- All git ignored (handled by `store/.gitignore`)
- Plugin injects only Layer 2
