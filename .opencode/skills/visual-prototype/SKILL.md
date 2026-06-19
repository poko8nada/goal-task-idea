---
name: visual-prototype
description: Trigger when the user and agent are discussing a visual project (web app, rich UI, website) and the visual direction is unclear or undecided — invoked by the user explicitly, or sensed by the agent during discussion. Builds a throwaway static visual mockup in the project's stack (single file, hardcoded values, no real functionality) to make the look and feel discussable. Stays in the repo as a visual reference for /pre-check and /implement.
compatibility: opencode
---

# Skill: visual-prototype

Trigger this skill when discussing a visual project and the look and feel is not yet aligned. The mockup is a Figma-like artifact in code — it exists to make the goal discussable, not to be the real implementation. The project's dev server and hot reload are part of the loop: every change shows up in cmux-browser immediately, so the user can see and judge each edit without leaving the session.

## When to use

Use this skill when:

- The project has visual elements (web app, rich UI, website).
- The visual direction is unclear or undecided.
- The project's stack is known (existing project or already agreed with the user).
- The next step would be /pre-check or /implement, but alignment on the visual would unblock the discussion.

Do not use this skill when:

- The work is non-visual (backend, CLI, library, scripts).
- The visual is already locked (Figma file, screenshot, written spec, or user pointing at a reference).
- The work is past /pre-check — the mockup should come first.

## Self-trigger during discussion

The agent may invoke this skill when, during conversation, it senses that alignment on the visual is needed before code can be written usefully. Concrete signals:

- The user describes a visual feature but the look and feel is vague or contradictory.
- The user is weighing two or more visual directions.
- A new visual feature is mentioned without concrete form.
- The user asks "what should this look like?" or equivalent.

Skip signals (do not self-trigger):

- Backend, CLI, library, or non-UI work.
- Visual already pinned by a Figma file, screenshot, or spec.
- The user is past /pre-check on this work.

When in doubt, surface the option to the user ("Want to mock this up first to align on the visual?") rather than silently triggering.

## Principle

> The mockup is a Figma-like **alignment snapshot in code**, not a source of truth. It captures the look and feel at the moment of alignment. The real implementation evolves; the mockup is the anchor at alignment time, not forever. When the visual direction changes, re-trigger this skill to refresh the snapshot. The dev server + hot reload loop is the working surface: edit, see, discuss, edit again.

## Cap

One mockup file holds at most 3–5 screens. If the discussion needs more, split into multiple files (e.g., `_prototype-list.tsx`, `_prototype-detail.tsx`) or run multiple sessions. The cap exists because a single stacked file becomes unreadable past that point, defeating the "scroll to review" workflow.

## Workflow

### 1. Confirm scope

Ask the user which screens to mock. Suggest 2–4 high-priority screens for the current discussion, based on the project type. Get agreement on the screen list before building.

### 2. Detect stack and file location

Read the project to determine:

- **Framework**: from `package.json` dependencies and devDeps (react, vue, svelte, solid, etc.) and config files (`next.config.*`, `nuxt.config.*`, `svelte.config.*`, `vite.config.*`, etc.).
- **Source layout**: which directory holds the app code (`src/`, `app/`, `pages/`, `routes/`, etc.).

Pick the mockup file path:

- Next.js (App Router) → `app/_prototype/page.tsx`
- Next.js (Pages Router) → `pages/_prototype.tsx`
- Vite + React → `src/_prototype.tsx`
- Vite + Vue → `src/_prototype.vue`
- Vite + Svelte → `src/_prototype.svelte`
- SvelteKit → `src/routes/_prototype/+page.svelte`
- Remix → `app/routes/_prototype.tsx`
- Astro → `src/pages/_prototype.astro`
- Plain HTML / no framework → `prototype.html` (project root)
- Other / unclear → ask the user

The underscore prefix (`_prototype`) signals "not part of the real app" — Next.js, SvelteKit, and Remix treat it as a private route; other frameworks ignore the prefix. Confirm the location with the user if it is non-obvious.

### 3. Build the mockup

**One file. Project stack. Hardcoded values. No real functionality.** All screens stacked vertically with comments or section breaks as dividers. The user scrolls to review. The dev server's hot reload shows every edit.

Rules:

- Use the project's existing components (Button, Card, layout primitives, etc.) so the mockup looks like the future real build.
- No event handlers. No animations. No real state (no `useState` with real transitions, no `useEffect` that fetches, no stores, no router navigation). The component tree may still render lists, map over data, etc. — that is static rendering, not interactivity.
- No API calls. No real data fetching. No real auth, no real forms that submit.
- Buttons, forms, links are visual only — they render but do nothing when interacted with.
- Realistic content (not "lorem ipsum" repeated — make it look like a real product).
- Empty / error / loading states only if the user asked.
- Hardcoded text, colors, sizes, layout — no props, no theming, no abstraction, no reuse.
- The mockup must be deletable by removing one file.

### 4. Show in dev environment

- Project stack: start the dev server, capture a screenshot with cmux-browser, show the user.
- Plain HTML: open the file directly or serve it statically.

Ask the user:

- "Is this the visual direction?"
- "What features are missing or wrong?"
- "Which parts need adjustment?"

### 5. Iterate or lock in

If changes needed → edit the mockup → dev server hot reloads → re-screenshot → show → repeat. The loop is fast because the dev server picks up every edit.

If aligned → lock in the visual direction, leave the mockup file in the repo as a snapshot, hand off to /pre-check or /implement.

## Hand off

When aligned:

- Mockup file stays in the repo as an alignment snapshot.
- /pre-check for vertical slice work — the **Slice** section references the mockup path as the visual constraint ("visually matches `app/_prototype/page.tsx`"). The mockup is the input to slice, not a deliverable of it.
- /implement for one-off changes — the mockup is the visual reference during build.
- If the user later wants to change the visual, re-trigger this skill to refresh the snapshot, then continue the build.

## Drift warning

The mockup is a snapshot. The real implementation will evolve. If the visual drifts from the mockup during /implement, the user decides:

- Re-trigger this skill to refresh the mockup to match.
- Or let the mockup stay as the original alignment snapshot and update the implementation freely.
