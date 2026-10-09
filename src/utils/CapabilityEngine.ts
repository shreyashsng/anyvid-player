/**
 * CapabilityEngine - Intelligent browser and hardware media capability diagnostics.
 *
 * Inspects WebCodecs hardware decode readiness, display color spaces (Display-P3, HDR),
 * Web Audio channel topologies, and metered network states.
 */

import { Logger } from "./Logger";

const TAG = "CapabilityEngine";

export interface SystemCapabilities {
  webCodecsVideo: boolean;
  webCodecsAudio: boolean;
  webAudio: boolean;
  webgl2: boolean;
  p3ColorGamut: boolean;
  hdrDisplay: boolean;
  meteredConnection: boolean;
  hardwareConcurrency: number;
  deviceMemoryGB?: number;
}

export interface CodecTestResult {
  supported: boolean;
  hardwareAccelerated: boolean;
  recommendedEngine: "webcodecs-hw" | "webcodecs-sw" | "wasm";
  reason: string;
}

export class CapabilityEngine {
  /**
   * Check if WebCodecs VideoDecoder is present in browser context
   */
  static isWebCodecsVideoSupported(): boolean {
    return typeof (globalThis as any).VideoDecoder !== "undefined";
  }

  /**
   * Check if WebCodecs AudioDecoder is present in browser context
   */
  static isWebCodecsAudioSupported(): boolean {
    return typeof (globalThis as any).AudioDecoder !== "undefined";
  }

  /**
   * Check if WebGL2 is available in browser context
   */
  static isWebGL2Supported(): boolean {
    if (typeof document === "undefined") return false;
    try {
      const canvas = document.createElement("canvas");
      return !!canvas.getContext("webgl2");
    } catch {
      return false;
    }
  }

  /**
   * Check if current display supports wide Display-P3 color gamut
   */
  static isP3GamutSupported(): boolean {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    try {
      return window.matchMedia("(color-gamut: p3)").matches;
    } catch {
      return false;
    }
  }

  /**
   * Check if display supports High Dynamic Range (HDR)
   */
  static isHDRDisplaySupported(): boolean {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    try {
      return window.matchMedia("(dynamic-range: high)").matches;
    } catch {
      return false;
    }
  }

  /**
   * Check if connection is metered or bandwidth-restricted (e.g. Save-Data or 2G/3G)
   */
  static isMeteredConnection(): boolean {
    if (typeof navigator === "undefined") return false;
    const nav = navigator as any;
    if (nav.connection?.saveData === true) return true;
    const type = nav.connection?.type;
    if (type === "cellular") return true;
    const effectiveType = nav.connection?.effectiveType;
    if (effectiveType === "2g" || effectiveType === "slow-2g" || effectiveType === "3g") return true;
    return false;
  }

  /**
   * Get complete snapshot of host system capabilities
   */
  static getSystemOverview(): SystemCapabilities {
    return {
      webCodecsVideo: this.isWebCodecsVideoSupported(),
      webCodecsAudio: this.isWebCodecsAudioSupported(),
      webAudio: typeof (globalThis as any).AudioContext !== "undefined" || typeof (globalThis as any).webkitAudioContext !== "undefined",
      webgl2: this.isWebGL2Supported(),
      p3ColorGamut: this.isP3GamutSupported(),
      hdrDisplay: this.isHDRDisplaySupported(),
      meteredConnection: this.isMeteredConnection(),
      hardwareConcurrency: typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 4 : 4,
      deviceMemoryGB: typeof navigator !== "undefined" ? (navigator as any).deviceMemory : undefined,
    };
  }

  /**
   * Query WebCodecs VideoDecoder for specific codec configuration
   */
  static async testVideoCodec(config: {
    codec: string;
    width?: number;
    height?: number;
  }): Promise<CodecTestResult> {
    if (!this.isWebCodecsVideoSupported()) {
      return {
        supported: false,
        hardwareAccelerated: false,
        recommendedEngine: "wasm",
        reason: "WebCodecs VideoDecoder is unavailable in this environment (falling back to WASM).",
      };
    }

    const testWidth = config.width || 1920;
    const testHeight = config.height || 1080;

    // First try requesting prefer-hardware
    try {
      const hwSupport = await (globalThis as any).VideoDecoder.isConfigSupported({
        codec: config.codec,
        codedWidth: testWidth,
        codedHeight: testHeight,
        hardwareAcceleration: "prefer-hardware",
      });

      if (hwSupport?.supported) {
        return {
          supported: true,
          hardwareAccelerated: hwSupport.config?.hardwareAcceleration === "prefer-hardware",
          recommendedEngine: "webcodecs-hw",
          reason: `WebCodecs hardware acceleration verified for ${config.codec} (${testWidth}x${testHeight}).`,
        };
      }
    } catch (e) {
      Logger.debug(TAG, "Hardware query failed or unsupported", e);
    }

    // Try requesting no-preference (may fall back to software WebCodecs)
    try {
      const swSupport = await (globalThis as any).VideoDecoder.isConfigSupported({
        codec: config.codec,
        codedWidth: testWidth,
        codedHeight: testHeight,
        hardwareAcceleration: "no-preference",
      });

      if (swSupport?.supported) {
        return {
          supported: true,
          hardwareAccelerated: false,
          recommendedEngine: "webcodecs-sw",
          reason: `WebCodecs supported via software decoding for ${config.codec}.`,
        };
      }
    } catch (e) {
      Logger.debug(TAG, "Software WebCodecs query failed", e);
    }

    // Browser cannot decode via WebCodecs; WASM fallback required
    return {
      supported: true,
      hardwareAccelerated: false,
      recommendedEngine: "wasm",
      reason: `Browser native WebCodecs rejects ${config.codec}; will decode via WASM fallback engine.`,
    };
  }

  /**
   * Query WebCodecs AudioDecoder for specific audio codec configuration
   */
  static async testAudioCodec(config: {
    codec: string;
    sampleRate?: number;
    numberOfChannels?: number;
  }): Promise<{ supported: boolean; recommendedEngine: "webcodecs" | "wasm"; reason: string }> {
    // Opus is always software in our engine due to WebCodecs packet-gap sensitivity
    if (config.codec.toLowerCase().includes("opus")) {
      return {
        supported: true,
        recommendedEngine: "wasm",
        reason: "Opus audio streams are routed to WASM decoder for uninterrupted gapless playback.",
      };
    }

    if (!this.isWebCodecsAudioSupported()) {
      return {
        supported: true,
        recommendedEngine: "wasm",
        reason: "AudioDecoder unavailable; decoding via WASM.",
      };
    }

    try {
      const support = await (globalThis as any).AudioDecoder.isConfigSupported({
        codec: config.codec,
        sampleRate: config.sampleRate || 48000,
        numberOfChannels: config.numberOfChannels || 2,
      });

      if (support?.supported) {
        return {
          supported: true,
          recommendedEngine: "webcodecs",
          reason: `Native WebCodecs audio decoding supported for ${config.codec}.`,
        };
      }
    } catch {
      // Fall through
    }

    return {
      supported: true,
      recommendedEngine: "wasm",
      reason: `WebCodecs rejected ${config.codec}; fallback to WASM audio engine.`,
    };
  }
}
