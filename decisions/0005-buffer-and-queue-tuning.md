# ADR-0005: Resolution-Aware Queue Sizing & A/V Backpressure Invariants

- **Status**: Accepted
- **Date**: 2026-10-08
- **Subsystem**: `core`, `render`
- **Key Files**: `src/core/MoviPlayer.ts`, `src/render/AudioRenderer.ts`, `src/render/CanvasRenderer.ts`

## 1. Context and Problem Statement
Video decoding memory and CPU limits vary drastically between 1080p and 8K HDR content:
- An uncompressed 8K 10-bit RGBA frame consumes ~250MB in GPU memory. Deep queues exhaust VRAM and crash browser tabs.
- Shallow queues trigger backpressure prematurely before audio can refill.
- If `audioBuffered` is checked against an improperly calibrated starving threshold, the demuxer prematurely drops non-keyframes, corrupting the reference chain and causing continuous `EncodingError` loops.

## 2. Decision Outcome
Codify explicit runtime thresholds based on resolution and latency hint:
1. **Renderer Frame Queue Limits (`baseHwQueue`)**:
   - 4K+ on Desktop: 16 frames.
   - 4K+ on Mobile: 8–12 frames.
   - <= 1080p on Mobile: ~800ms duration target.
   - <= 1080p on Desktop: 100 frames.
2. **Audio Starving Threshold vs LatencyHint**:
   - `AudioRenderer` uses `latencyHint: "interactive"` (~50–150ms buffer).
   - In `MoviPlayer.ts`, `skipVideoDecodeForAudio` threshold is calibrated to **0.1s**.
   - If `latencyHint` were `"playback"` (~200ms), threshold would be **0.5s**.
3. **4K+ Packet Dropping Disabled**:
   - For 4K+ content (`isHighRes`), `skipVideoDecodeForAudio` is disabled. Dropping packets on 4K breaks decoder reference frames. A slight audio drift is preferred over catastrophic decode corruption.
4. **Playback Rate Cap**:
   - 4K+ media playback rate is clamped to **1.5x**. Attempting 2x on 8K @ 60fps requires 120fps decode, exceeding all consumer hardware decoders.

### Invariants
- **NEVER change the 0.1s starving threshold while `latencyHint` is "interactive"**.
- **NEVER enable `skipVideoDecodeForAudio` when `isHighRes` is true**.
- **NEVER allow playbackRate > 1.5x on 4K+ media**.
