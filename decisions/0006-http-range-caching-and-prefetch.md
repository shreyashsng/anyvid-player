# ADR-0006: Fixed 4MB Range Chunking & Head Probe Handover

- **Status**: Accepted
- **Date**: 2026-10-08
- **Subsystem**: `source`, `cache`
- **Key Files**: `src/source/HttpSource.ts`, `src/source/SourceAdapter.ts`, `src/cache/LRUCache.ts`

## 1. Context and Problem Statement
When streaming large media over HTTP:
- Naive small chunk sizes (e.g. 512KB) drastically delay `loadedmetadata` (jumping from 1.6s to 28.8s) because FFmpeg requires significant container headers before parsing can proceed.
- Hosts (CDNs, edge proxies, app shells) prefetch the opening range to warm browser HTTP caches. A browser 206 cache hit requires the exact requested byte range.
- Head probe timing can misjudge cached hits if bytes are discarded before handover.

## 2. Decision Outcome
1. **Fixed Opening Read Constants**:
   - `HttpSource.FIRST_RANGE_CHUNK_SIZE` is fixed at **4 MB** (`bytes=0-4194303`).
   - Split audio opening range is fixed at **1 MB** (`bytes=0-999999`).
2. **Head Probe Handover**:
   - `_probeHeadAndWarm()` reads the initial chunk to measure connection speed.
   - It MUST call `HttpSource.offerWarmHead()` **before** evaluating cache or network speed, ensuring valid prefetched bytes are handed over even if the response arrives in <30ms from local cache.
3. **Shared LRU Cache**:
   - Shared 520MB byte cache across HTTP reads to balance multi-track buffering and tab memory limits.

### Invariants
- **NEVER alter `FIRST_RANGE_CHUNK_SIZE` (4MB) or split-audio (1MB)** without updating all host prefetch configurations and documentation.
- **NEVER return early in `_probeHeadAndWarm()` before calling `offerWarmHead()`**.
