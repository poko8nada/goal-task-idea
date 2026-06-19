---
name: visual-prototype
description: Use this skill when visual aspects come up in the conversation — color, atmosphere, reference apps, similar products, "what should this look like". Covers project initialization (greenfield, no components yet), adding a new screen or visual feature to an existing app, redesign of an existing screen, and any point where visual alignment is needed before building. Triggers on phrases like "I want it to feel like Linear", "mockup this", "what should this look like", "I want it more minimal", or when the agent senses the user wants to see something before committing to code. Builds a throwaway static visual mockup in the project's stack. Do NOT use for backend work, visual already locked in a written spec or external design file, or work already in the build phase.
compatibility: opencode
---

# Skill: visual-prototype

Build a throwaway static visual mockup in the project's stack to align on look and feel. The mockup is a single file with hardcoded values and no real functionality. The dev server and hot reload show every edit. The user reviews the rendered browser view, gives feedback, the agent edits, repeat.

## Principle

The mockup is an alignment snapshot, not a source of truth. It captures the look and feel at the moment of alignment. The real implementation evolves. When the visual direction changes, re-trigger this skill to refresh the snapshot.

In a greenfield project with no existing components, the mockup serves as the starting point — components are extracted from the mockup during the build phase. In a project with existing components, the mockup uses them so it matches the real build. When adding a new screen that needs new components, the new components appear inline in the mockup.

## Cap

One mockup file holds at most 3–5 screens. Past that, split into multiple files (e.g., `_prototype-list.tsx`, `_prototype-detail.tsx`) or run multiple sessions. A single stacked file becomes unreadable past that point, defeating the "scroll to review" workflow.

## Workflow

### 1. Confirm scope

Ask the user which screens to mock. Suggest 2–4 high-priority screens for the current discussion, based on the project type and current state (greenfield, new feature, redesign).

If the user references existing apps ("like Linear", "Notion-style", "Figma-like"), use Context7 or web search to research those apps' UI patterns before building. This grounds the mockup in concrete references rather than guessing.

Get agreement on the screen list before building.

### 2. Detect stack and file location

Read `package.json` and config files to determine framework. Read source layout to find where app code lives. Pick the mockup file path:

- Next.js (App Router) → `app/_prototype/page.tsx`
- Next.js (Pages Router) → `pages/_prototype.tsx`
- Nuxt → `pages/_prototype.vue` or `app/pages/_prototype.vue`
- Vite + React → `src/_prototype.tsx`
- Vite + Vue → `src/_prototype.vue`
- Vite + Svelte → `src/_prototype.svelte`
- Solid Start → `src/routes/_prototype.tsx`
- SvelteKit → `src/routes/_prototype/+page.svelte`
- Remix → `app/routes/_prototype.tsx`
- Qwik City → `src/routes/_prototype/index.tsx`
- Astro → `src/pages/_prototype.astro`
- Honox (Hono + JSX) → `app/routes/_prototype.tsx`
- Plain HTML / no framework → `prototype.html` (project root)
- Other / unclear → ask the user

The `_prototype` prefix signals "not part of the real app" — Next.js, Nuxt, SvelteKit, Remix, Qwik City, and Honox treat it as a private route; other frameworks ignore the prefix. Confirm the location with the user if it is non-obvious.

### 3. Build the mockup

One file. Project stack. Hardcoded values. No real functionality. All screens stacked vertically with comments or section breaks as dividers. The dev server's hot reload shows every edit.

Component usage — depends on the project state:

- Existing components available (Button, Card, layout primitives) → use them so the mockup matches the real build.
- Greenfield project (no components yet) → the mockup is the prototype. The build phase extracts components from it. Do not invent a component abstraction that does not yet exist.
- Existing app, new screen that needs new components → include the new components inline in the mockup. The build phase promotes them to real components.

Other rules:

- No event handlers, no animations, no real state, no API calls. The component tree may still render lists, map over data, etc. — that is static rendering, not interactivity.
- Buttons, forms, links are visual only — they render but do nothing when interacted with.
- Realistic content (not "lorem ipsum" repeated).
- Empty / error / loading states only if the user asked.
- Hardcoded text, colors, sizes, layout — no props, no theming, no abstraction in the mockup itself.
- The mockup must be deletable by removing one file.

### 4. Show in dev environment

Start the dev server. The user reviews the rendered browser view directly. Hot reload shows every edit immediately. For plain HTML, open the file directly or serve it statically.

Ask the user:

- "Is this the visual direction?"
- "What features are missing or wrong?"
- "Which parts need adjustment?"

### 5. Iterate or lock in

If changes needed → edit the mockup → dev server hot reloads → user reviews → repeat. The loop is fast because the dev server picks up every edit.

If aligned → leave the mockup file in the repo as a snapshot. The build phase can reference it as the visual target.

## Examples

User scenarios where this skill fires:

Greenfield project (no components yet):

- "I want to build a goal management app" → mockup: gantt view, list view, detail view. The build phase extracts components from this.
- "Build a SaaS dashboard" → mockup: sidebar, main content area, charts.

Adding a new screen or feature to an existing app:

- "Add a settings page" → mockup: settings with sections (account, notifications, billing). Uses existing components if available.
- "Add a Kanban board" → mockup: kanban with columns and cards. New components inline if needed.
- "Add a search results page" → mockup: search input, filters, result cards.
- "Add a profile page" → mockup: avatar, info, activity feed.
- "Build a calendar view" → mockup: month/week view, events.
- "Add notifications" → mockup: notification list, badges.
- "Build a chat interface" → mockup: message list, input, sidebar.
- "Build a pricing page" → mockup: tiers, feature comparison, CTA.

Redesign of an existing screen:

- "Redesign the home page" → mockup the new home page, compare against the existing one.

Reference app mentioned:

- "I want it to feel like Linear" → research Linear's UI patterns first via Context7 or web search, then mockup.
- "Like Notion" → research Notion's UI patterns, then mockup.

General visual alignment:

- "What should this look like?" → mockup 2-3 candidate directions for the user to compare.
- "I want it more minimal" or "more colorful" → adjust the existing mockup or build a new variant.

## Hand off

When aligned:

- Mockup file stays in the repo as an alignment snapshot.
- The design step (if used) references the mockup path as the visual constraint (e.g., "visually matches `app/_prototype/page.tsx`"). The mockup is the input to that step, not a deliverable of it.
- The build phase uses the mockup as the visual target. In a greenfield project, the build phase also extracts components from the mockup.
- If the user later wants to change the visual, re-trigger this skill to refresh the snapshot.

## Drift warning

The mockup is a snapshot. The real implementation will evolve. If the visual drifts from the mockup during the build, the user decides:

- Re-trigger this skill to refresh the mockup to match.
- Or let the mockup stay as the original snapshot and update the implementation freely.
