# ADR-0004: Monolithic `<movi-player>` Custom Element & Shadow DOM

- **Status**: Accepted
- **Date**: 2026-10-08
- **Subsystem**: `render`, `element`
- **Key Files**: `src/render/MoviElement.ts`, `custom-elements.json`, `docs/api/element.md`

## 1. Context and Problem Statement
Consumers require a zero-setup, framework-agnostic drop-in replacement for `<video>`. Exposing disjointed canvas nodes, audio nodes, and controller scripts introduces integration friction in React, Vue, Svelte, and vanilla HTML.

## 2. Decision Outcome
Encapsulate all UI controls, subtitle overlays, keyboard hotkeys, mobile gestures, and settings menus inside a single custom element: `<movi-player>`.
- Internal implementation: `MoviElement.ts` wraps an underlying `MoviPlayer` engine instance.
- Shadow DOM encapsulates styles and control templates.
- Machine-readable manifest: `custom-elements.json` is automatically generated on build to prevent drift between documentation, attributes, and events.

### Invariants for Agents
1. **Never read `MoviElement.ts` in full into context**: It is ~15,000 lines long. Always use grep search or slice ranges.
2. **Consult `custom-elements.json` first**: It lists all 70 attributes and 47 events.
3. **No phantom standard events**: Note that `<movi-player>` emits `statechange` with explicit states (`buffering`, `seeking`, `playing`, etc.) rather than standard `waiting`/`seeking` DOM events.
