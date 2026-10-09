# ADR-XXXX: [Short Title of the Decision]

- **Status**: [Proposed | Accepted | Superseded | Deprecated]
- **Date**: YYYY-MM-DD
- **Subsystem**: [`render` | `core` | `demux` | `decode` | `source` | `wasm` | `element`]
- **Related Issues / PRs**: [Links or numbers]

## 1. Context and Problem Statement
What problem are we solving? Why can't we use a naive approach? Cite browser quirks, performance bottlenecks, or protocol limits.

## 2. Decision Drivers
- Performance / VRAM / CPU constraints
- Browser compatibility (Chromium vs Safari vs Firefox)
- Token conservation (preventing regression in AI agent edits)
- Bundle size / dependency minimalism

## 3. Considered Options
- **Option 1**: [Description]
- **Option 2**: [Description]
- **Option 3**: [Description]

## 4. Decision Outcome
Chosen option: **[Option X]** because [primary rationale].

### Positive Consequences
- [Benefit 1]
- [Benefit 2]

### Negative Consequences / Trade-offs
- [Trade-off 1]
- [Trade-off 2]

## 5. Invariants and Guardrails (Do NOT Break)
List technical constraints that LLMs must never remove or bypass:
1. `Invariant 1`: [Explanation of why this line/threshold cannot be changed]
2. `Invariant 2`: [...]

## 6. Verification and Regression Testing
How an AI agent verifies this decision remains intact:
- Type check: `npm run typecheck`
- Real-world smoke test: Bisect using `app/test-native.html`
- Key log assertions to look for in browser console
