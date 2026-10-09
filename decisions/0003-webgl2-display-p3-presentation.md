# ADR-0003: WebGL2 Presentation & Display-P3 HDR Pipeline

- **Status**: Accepted
- **Date**: 2026-10-08
- **Subsystem**: `render`
- **Key Files**: `src/render/CanvasRenderer.ts`

## 1. Context and Problem Statement
HTML5 `<video>` tags cannot reliably expose Wide Color Gamut (WCG) or High Dynamic Range (HDR) presentation on many desktop/mobile browser combinations. Furthermore, `<video>` cannot perform low-latency subtitle blending, custom tone mapping, or ambient backlighting without DOM overhead.

## 2. Decision Outcome
Use WebGL2 rendering to a `<canvas>` element:
1. On Chromium: Configure drawing buffer with `colorSpace: "display-p3"` when HDR/BT.2020 metadata is detected.
2. On browsers lacking native HDR canvas backing: Execute a PQ (Perceptual Quantizer) to SDR tone-mapping GLSL fragment shader.
3. Ambient sampling: Maintain a 16x16 RGBA8 framebuffer object (FBO) and sample average color in microseconds rather than doing full 8K frame readbacks (which stall the GPU for ~100ms).

### Invariants
1. Do not perform full-resolution `readPixels` from the main WebGL canvas. Always downsample to the 16x16 FBO first.
2. Tone-mapping shaders must preserve SDR contrast and avoid color clipping when PQ/HLG primaries are mapped.
