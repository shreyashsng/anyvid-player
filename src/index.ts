/**
 * AnyVid - Browser Media Engine & Video Player
 *
 * A production-grade JavaScript + WebAssembly engine for streaming,
 * seeking, and rendering complex multi-GB video files in the browser.
 *
 * This is the complete bundle. For smaller bundles, import specific modules:
 * - import { Demuxer } from 'anyvid-player/demuxer'        (~45KB - demuxing only)
 * - import { AnyVidPlayer } from 'anyvid-player/player'    (~180KB - playback without UI)
 * - import { AnyVidElement } from 'anyvid-player/element'  (~410KB - full web component)
 */

// Export everything from element module (includes player and demuxer)
export * from './element';