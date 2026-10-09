# Architecture Decision Records (ADR) & System Context

This directory captures high-context Architectural Decision Records (ADRs) for `movi-player`.

## Why this exists for LLM Agentic Coding
1. **Zero Hallucination**: AI assistants must not guess why a quirk, threshold, or workaround exists. Every critical invariant is codified here.
2. **Token & Credit Preservation**: Instead of feeding 15,000+ lines of code (`MoviElement.ts`, `MoviPlayer.ts`) into LLM context windows, agents read concise, targeted decision records.
3. **Architectural Memory**: Changes to core algorithms (demuxing loop, A/V sync, queue depth, WebCodecs fallbacks) must reference or produce an ADR.

---

## Quick Reference Index

| ID | Title | Subsystem | Status | Key Files |
|---|---|---|---|---|
| [ADR-0001](./0001-wasm-ffmpeg-demuxer.md) | FFmpeg WASM Container Demuxing | `demux`, `wasm` | Accepted | `src/demux/Demuxer.ts`, `src/wasm/*` |
| [ADR-0002](./0002-webcodecs-first-hardware-decode.md) | WebCodecs Hardware Decode with Software Fallbacks | `decode` | Accepted | `src/decode/VideoDecoder.ts`, `AudioDecoder.ts` |
| [ADR-0003](./0003-webgl2-display-p3-presentation.md) | WebGL2 Presentation & Display-P3 HDR Pipeline | `render` | Accepted | `src/render/CanvasRenderer.ts` |
| [ADR-0004](./0004-web-component-architecture.md) | Monolithic `<movi-player>` Custom Element & Shadow DOM | `render`, `element` | Accepted | `src/render/MoviElement.ts`, `custom-elements.json` |
| [ADR-0005](./0005-buffer-and-queue-tuning.md) | Resolution-Aware Queue Sizing & A/V Backpressure Invariants | `core`, `render` | Accepted | `src/core/MoviPlayer.ts`, `AudioRenderer.ts` |
| [ADR-0006](./0006-http-range-caching-and-prefetch.md) | Fixed 4MB Range Chunking & Head Probe Handover | `source`, `cache` | Accepted | `src/source/HttpSource.ts`, `LRUCache.ts` |
| [ADR-0007](./0007-buffer-pacing-and-bandwidth-optimization.md) | Buffer Pacing & Metered Network Optimization | `source`, `cache` | Accepted | `src/source/HttpSource.ts`, `MoviElement.ts` |
| [ADR-0008](./0008-capability-intelligence-and-manifest-engine.md) | Capability Intelligence & Manifest-First Architecture | `types`, `utils`, `demux` | Accepted | `src/utils/CapabilityEngine.ts`, `Demuxer.ts`, `dev/inspector.html` |

---

## Active Working Context
When starting or continuing a development task, always inspect:
- [ACTIVE_CONTEXT.md](./ACTIVE_CONTEXT.md) — Real-time task tracker and quick invariants cheat sheet.

---

## ADR Process for AI Agents
1. **Before modifying core logic**: Check this index. If the change impacts an existing ADR, adhere to its constraints.
2. **When making an architectural change**: Create a new ADR using [TEMPLATE.md](./TEMPLATE.md).
3. **Keep ADRs concise**: Focus on *why*, *tradeoffs*, *rejected alternatives*, and *invariants*.
