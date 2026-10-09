# ADR-0007: Buffer Pacing, Sliding Window Sizing & Metered Network Optimization

- **Status**: Proposed / Under Evaluation
- **Date**: 2026-10-08
- **Subsystem**: `source`, `cache`, `core`
- **Key Files**: `src/source/HttpSource.ts`, `src/cache/LRUCache.ts`, `src/render/MoviElement.ts`, `src/core/MoviPlayer.ts`

## 1. Context and Problem Statement
A deep audit of `HttpSource.ts` and `MoviElement.ts` revealed that:
1. `MoviElement.ts` (line 31547) initializes MoviPlayer with `cache: { type: "lru", maxSizeMB: 520 }`.
2. In `HttpSource.ts` (lines 948–953), any file where `fileSize <= maxBufferSizeMB` is flagged as `canCacheEntireFile = true`.
3. In `HttpSource.readStreamBackground` (lines 1575–1587), when `canCacheEntireFile` is true:
   - Stream limit checks (`limitReached`, `bufferAlmostFull`) are completely bypassed.
   - The stream reads continuously until End of File (EOF).
4. **Impact**:
   - Files up to 520 MB (like the tested 176 MB `.mkv`) are downloaded completely and eagerly in browser memory, even if the user pauses or closes the player after 10 seconds.
   - On metered cellular/mobile connections, this causes severe data wastage and costs.
   - On mobile browsers, allocating a 200–500 MB continuous buffer in JavaScript memory risks browser tab OOM crashes.
5. **Behavior for files > 520 MB (1GB, 2GB, 3GB, etc.)**:
   - `canCacheEntireFile` is false.
   - Buffer size switches to a sliding window of 8% of file size (`BUFFER_PERCENTAGE = 0.08`), capped at `maxBufferSizeMB`.
   - The stream parks when 90% full and waits for the viewer to consume at least 25% of the window before compacting and streaming forward.
   - Thus, large 1–3GB files are NOT downloaded completely, but the 8% sliding window can still allocate up to 240MB in browser memory.

## 2. Recommended Optimizations
1. **Reduce Eager Full-File Cache Cap**:
   - Lower `canCacheEntireFile` threshold from 520 MB to a conservative cap (e.g., <= 30 MB or 50 MB for short clips/audio), or require an explicit attribute/flag.
2. **Time-Based Buffer Lead Pacing**:
   - Rather than allocating buffer purely based on percentage of byte size, pace the sliding window to maintain a target playback forward lead (e.g., 30s–60s ahead of playback).
3. **Respect `buffersize` Attribute & Connection Hints**:
   - Ensure the `buffersize` attribute on `<movi-player>` defaults sensibly (e.g., 64 MB instead of 520 MB on mobile/metered).
   - Check `navigator.connection?.saveData` to automatically clamp buffer size to 20–30 MB when Data Saver is active.
