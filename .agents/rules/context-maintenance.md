# Context Maintenance & Task Tracking Guidelines

To keep development coherent across turns, agent interruptions, and multi-day coding tasks:

## 1. Single Source of Active State
- Maintain [decisions/ACTIVE_CONTEXT.md](../../decisions/ACTIVE_CONTEXT.md) as the working state descriptor.
- Whenever completing a significant task phase or pivoting to a new feature:
  - Update the "Current Sprint / Active Task" section in `decisions/ACTIVE_CONTEXT.md`.
  - Record the latest verification status (`npm run typecheck` passed/failed, any open regressions).

## 2. Document Architectural Shifts Immediately
- If a new architectural invariant, container support, decoder quirk, or new public attribute is introduced:
  - Add an Architecture Decision Record in `decisions/` following `decisions/TEMPLATE.md`.
  - Update `decisions/README.md` index.
  - Update `custom-elements.json` by running `npm run build:ts` (which triggers `scripts/build-custom-data.mjs`).

## 3. Reference Existing Rules
- Standalone master rule: [AGENTS.md](../../AGENTS.md) at the repository root.
- ADR index: [decisions/README.md](../../decisions/README.md).
