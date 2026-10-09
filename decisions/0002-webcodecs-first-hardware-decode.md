# ADR-0002: WebCodecs-First Hardware Decode with Resilient Software Fallback

- **Status**: Accepted
- **Date**: 2026-10-08
- **Subsystem**: `decode`
- **Key Files**: `src/decode/VideoDecoder.ts`, `src/decode/AudioDecoder.ts`, `src/decode/SoftwareVideoDecoder.ts`, `src/decode/CodecParser.ts`

## 1. Context and Problem Statement
Software decoding 4K/8K AV1 or HEVC in JavaScript/WASM consumes prohibitive CPU, causing thermal throttling, frame drops, and battery drain. However, browser WebCodecs hardware implementations are finicky:
- WebCodecs may reject valid HEVC streams if color metadata is present.
- WebCodecs may fail on HEVC Range Extension (Rext) profiles without extradata patching.
- WebCodecs audio decoders choke on Opus packet gaps.
- Chrome Android AV1 hardware support is fragmented.

## 2. Decision Outcome
Adopt a **Hardware-First with Cascading Fallback** strategy:
1. Attempt `VideoDecoder.configure({ hardwareAcceleration: "prefer-hardware", ... })`.
2. Fallback Chain on configuration/decode failure:
   - Strip `colorSpace` and retry.
   - For HEVC Rext (`hvc1.4`), patch extradata (hvcC bytes) to Main10 and retry.
   - If hardware fails entirely, switch to software WASM decoder (`SoftwareVideoDecoder` using `dav1d` for AV1, `de265` for HEVC).
3. **Opus Audio Exception**: Opus packets are strictly diverted to software WASM decoding (`SoftwareAudioDecoder`), never WebCodecs audio, because WebCodecs crashes or stutters on Opus packet gaps.

### Invariants
1. **Never route Opus to WebCodecs**: Opus must remain in the software codec whitelist.
2. **Never swallow decode errors**: Recovery heuristics in `VideoDecoder.ts` (`_doRecover`, `waitingForKeyframe`) must notify `MoviPlayer` to transition to `buffering` rather than letting clock run adrift.
