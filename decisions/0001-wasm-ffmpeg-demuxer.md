# ADR-0001: FFmpeg WASM Container Demuxing

- **Status**: Accepted
- **Date**: 2026-10-08
- **Subsystem**: `demux`, `wasm`
- **Key Files**: `src/demux/Demuxer.ts`, `src/wasm/FFmpegLoader.ts`, `src/wasm/bindings.ts`, `wasm/`

## 1. Context and Problem Statement
Standard browser `<video>` tags only support MP4/WebM containers with browser-whitelisted codecs. Users frequently encounter MKV, TS, FLV, multi-track audio, and embedded subtitles (ASS/SSA/PGS) which the native browser demuxer completely rejects.

## 2. Decision Outcome
Compile FFmpeg's `libavformat` and container parsing routines into WebAssembly (`movi.wasm`), wrapped by a TypeScript `Demuxer` class and `SourceAdapter` streaming interface.

### Positive Consequences
- Universal container support (MKV, MP4, MPEG-TS, WebM, FLV).
- Access to embedded subtitle packets, multiple audio tracks, chapter marks, and HDR stream metadata.
- WASM binary (~2MB compressed) is loaded lazily and shared across instances.

### Invariants
1. `FFmpegLoader` must remain lazy and idempotent.
2. WASM memory buffer allocation and packet recycling must not leak memory during seeking or loop playback.
3. ABI exports in `src/wasm/types.ts` must match C declarations in `wasm/movi.h`.
