# ACTIVE_CONTEXT.md — Real-Time Agent Memory & Working State

> **RULE FOR LLM AGENTS**: Check this file FIRST at the start of any conversation. When finishing or modifying a multi-step workflow, update the "Current Sprint / Active Task" section below.

---

## 1. Quick Orientation (Read This Instead of Whole Source Files)

| Subsystem | Core Files | Essential Invariant / What It Does |
|---|---|---|
| **Element UI** | `src/render/MoviElement.ts` (~15k lines) | Custom Element `<movi-player>`. Shadow DOM. Read `custom-elements.json` for attributes/events. **Do NOT dump this file entirely into context**. |
| **Orchestrator** | `src/core/MoviPlayer.ts` (~4.5k lines) | Playback loop, demux loop, A/V clock sync, backpressure. |
| **Presentation** | `src/render/CanvasRenderer.ts` | WebGL2 canvas. `display-p3` color space for Chromium HDR; PQ tone-map shader elsewhere. Frame queue management. |
| **Audio** | `src/render/AudioRenderer.ts` | Web Audio context (`latencyHint: "interactive"`), Signalsmith time stretcher, DynamicsCompressor. |
| **Demuxer** | `src/demux/Demuxer.ts`, `src/wasm/*` | FFmpeg compiled to WASM. Demuxes MKV, MP4, TS, WebM. |
| **Video Decoder** | `src/decode/VideoDecoder.ts` | Hardware WebCodecs with fallback: color space stripping -> HEVC Rext -> software dav1d/de265. |
| **Audio Decoder** | `src/decode/AudioDecoder.ts` | WebCodecs audio. **Opus is forced to software decode** (WebCodecs fails on packet gaps). |
| **Source Adapters**| `src/source/HttpSource.ts`, `FileSource.ts` | Chunked reads with LRU cache (520MB). Fixed 4MB initial range chunk. |

---

## 2. Hard-Won Invariants Cheat Sheet (NEVER Violate)

1. **4K+ Playback Rate Clamp**: Max 1.5x on 4K+ content (`MoviElement.getMaxAllowedRate()`). 2x will overwhelm hardware decoders at 60fps/120fps.
2. **Audio Starving Threshold**: Must track `latencyHint`. At `"interactive"` (~100ms buffer), threshold is **0.1s**. At `"playback"`, threshold is **0.5s**. Never bump to 0.5s with interactive latency, or AV1 GOPs will corrupt.
3. **Queue Limits**: Desktop 4K queue = 16 frames. Mobile 4K queue = 8-12 frames. 1080p = 100 frames. Do not inflate (VRAM exhaustion).
4. **Initial Chunk Size**: `HttpSource.FIRST_RANGE_CHUNK_SIZE` is strictly **4 MB** (`bytes=0-4194303`). Split audio is **1 MB**. Hosts prefetch exactly this size; changing it breaks cache hits.
5. **Opus Audio**: Must remain software decoded in WASM. Never redirect to WebCodecs.
6. **MPEG-TS Seeking**: PTS is absolute broadcast wall-clock; `getCurrentTime()` normalizes by subtracting `startTime`. `seekKeyframeOffset` corrects jump to post-seek keyframes.
7. **Attribute Authoritative Source**: `custom-elements.json` is generated from code. Consult it first before adding or questioning attributes.

---

## 3. Current Sprint / Active Task

- **Current Status**: PHASES 1, 2, 3 & 5 COMPLETED.
  - Core positioning: Browser Media Engine for complex media (MKV, HEVC, AV1, 4K HDR).
  - Persisted requirements to [info.txt](../info.txt).
  - Implementation Plan Artifact: [media_engine_implementation_plan.md](../../../brain/e0435fc7-9201-4069-9e49-e81d00ec1f81/media_engine_implementation_plan.md).
- **Completed Milestones**:
  1. **Phase 1: Extreme Performance & Remote MKV Streaming**:
     - Sliding buffer default reduced from 520MB/250MB to 64MB.
     - `EAGER_FULL_CACHE_MAX_BYTES` (30MB) prevents multi-GB remote MKVs from downloading into memory.
     - Metered network protection (`navigator.connection.saveData`, cellular) clamps buffer to 32MB.
     - Sliding window cache compaction and stream backpressure parking.
  2. **Phase 2: Manifest-First Engine**:
     - Standardized `MediaManifest` JSON schema in `src/types.ts`.
     - `Demuxer.getMediaManifest()` and `Demuxer.inspect(source, wasmBinary)`.
     - `MoviPlayer.inspect(input, options)` and `MoviPlayer.getMediaManifest()`.
     - Exported `MediaManifest` across `movi-player/player`, `movi-player/demuxer`, and `movi-player/element`.
  3. **Phase 3: Capability Intelligence & Live Diagnostics HUD**:
     - `src/utils/CapabilityEngine.ts`: Hardware-acceleration detection, audio/video profile assessment, human-readable fallback explanations.
     - Diagnostics HUD / Stats for Nerds overlay wired to `stats` and `diagnostics` attributes on `<movi-player>`.
     - Telemetry toggle added to `dev/index.html` and player UI.
  4. **Phase 4 & UI: Universal Media Inspector**:
     - Built `dev/inspector.html` developer tool.
     - Drag-and-drop local file inspector + remote URL stream inspector (with dev CORS proxy).
     - Visual track badges (Codecs, HDR primaries, Audio channel layout, Subtitles, Chapters, Attachments).
     - Copyable standardized JSON manifest and embedded reference player preview.
  5. **Phase 5: Framework Adapters & Headless API**:
     - React (`movi-player/react`), Vue (`movi-player/vue`), and Svelte (`movi-player/svelte`) adapters verified in `dist/`.
     - Headless programmatic use via `movi-player/player` and `movi-player/demuxer`.
- **Active Subsystem**: Production-ready. All verification tests pass (`npm run typecheck` clean exit code 0).

