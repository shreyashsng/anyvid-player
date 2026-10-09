# Anti-Hallucination Guardrails for movi-player

To eliminate hallucinations and costly debugging loops in this complex media-engineering codebase:

## 1. Always Verify Against Active Code & Manifests
- **Custom Element API**: Do NOT guess attributes or events for `<movi-player>`. Always check `custom-elements.json` (70 attributes, 47 events) or `src/render/MoviElement.ts`.
- **Custom Events**: `<movi-player>` does **not** emit standard HTML5 `waiting`, `seeking`, `seeked`, or `playing` DOM events. It emits `statechange` with explicit state objects (`buffering`, `seeking`, `ready`, etc.).
- **Codecs & Containers**: Do NOT claim that WebCodecs handles Opus without issue. Opus is intentionally forced to WASM software decode because WebCodecs chokes on packet gaps.
- **Hardware Fallback Chain**: Do NOT simplify `VideoDecoder.ts` error handling or assume browser codecs are uniform. The fallback chain (strip colorSpace -> patch HEVC Rext extradata -> WASM dav1d/de265) is mandatory.

## 2. Invariant Protection
- Review [decisions/ACTIVE_CONTEXT.md](../../decisions/ACTIVE_CONTEXT.md) and [decisions/README.md](../../decisions/README.md) before proposing changes to:
  - Demuxer loop & packet flow.
  - A/V sync clock & audio starving thresholds.
  - Frame queue limits (`baseHwQueue`).
  - Range chunk sizes (`4MB` / `1MB`).

## 3. Git History as Truth
- If a code construct looks redundant, overly defensive, or "suboptimal", **search git history** or check `AGENTS.md` §7 and §8. Browser media bugs are non-obvious; "cleaning up" a hack usually revives a silent browser-crashing bug.
