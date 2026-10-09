# ADR-0008: Capability Intelligence and Manifest-First Architecture

## Context & Problem
Developers using in-browser media playback face opaque black-box errors when dealing with complex containers (MKV, TS, AVI) and advanced codecs (HEVC, AV1, Opus, TrueHD, ASS/SSA). Native `<video>` elements silently fail without explaining *why* a track is unsupported (e.g. lack of hardware decode acceleration, high profile/level, or missing container support). Furthermore, applications often need metadata, track lists, chapters, and format assessment *before* or *without* instantiating a full visual player.

## Decision
1. **Manifest-First Media Schema (`MediaManifest`)**:
   - Surface a standardized JSON manifest representation across containers (`MKV`, `MP4`, `WebM`, `MPEG-TS`, `AVI`).
   - Include container attributes (duration, size, bitrate, format), video streams (codec, profile, HDR primaries, bit depth), audio streams (codec, channels, sample rate), subtitle tracks (codecs, embedded vs external), chapters, and font/cover attachments.
   - Provide non-visual inspection APIs: `Demuxer.inspect(source)`, `MoviPlayer.inspect(source)`, and `player.getMediaManifest()`.

2. **Capability Engine (`CapabilityEngine.ts`)**:
   - Provide asynchronous client capability probing via `VideoDecoder.isConfigSupported()` and `AudioDecoder.isConfigSupported()`.
   - Distinguish between `hardware-accelerated WebCodecs`, `software WebCodecs`, and `WASM software fallback` (dav1d/de265/ffmpeg).
   - Generate human-readable diagnostics explaining exact playback strategies (e.g., "Decoded via Hardware WebCodecs", "WASM software fallback: AV1 not supported by platform hardware").

3. **Diagnostics & Telemetry HUD**:
   - Connect the internal Stats for Nerds overlay to the custom element's observed attributes (`stats`, `diagnostics`).
   - Enable developers to toggle real-time telemetry (dropped frames, decode latency, frame queue size, buffer lead, and memory usage) declaratively via HTML or programmatically.

4. **Universal Media Inspector (`dev/inspector.html`)**:
   - Provide a turnkey developer workbench supporting local drag-and-drop file inspection and remote HTTP stream inspection.
   - Display real-time system capabilities, visual track badges, JSON manifest inspection with clipboard export, and optional reference player preview.

## Consequences
- **Positive**: Eliminates developer guesswork when debugging codec compatibility. Decouples metadata extraction from DOM video rendering.
- **Guardrails**: Inspection requests initialize the WASM demuxer context without mounting WebGL2 canvas or audio graphs, ensuring near-instant (<300ms) metadata extraction with minimal memory footprint.
