<!-- Minimal Svelte example for anyvid-player/svelte.
     Run inside any Vite Svelte app:  npm i anyvid-player -->
<script lang="ts">
  import AnyVidPlayer from "../../packages/svelte/AnyVidPlayer.svelte";
  import type { AnyVidElement, QoEEvent } from "../../src/element";

  let player: AnyVidElement | null = null;
  let qoe: QoEEvent[] = [];

  function onQoe(e: CustomEvent<QoEEvent>) {
    qoe = [e.detail, ...qoe].slice(0, 8);
  }
</script>

<div style="max-width: 900px; margin: 2rem auto; font-family: system-ui">
  <h1>anyvid-player · Svelte</h1>

  <AnyVidPlayer
    bind:element={player}
    src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    controls
    autoplay
    muted
    theme="dark"
    style="width: 100%; aspect-ratio: 16 / 9; border-radius: 12px"
    on:anyvid-qoe={onQoe}
  />

  <div style="margin-top: 12px; display: flex; gap: 8px">
    <button on:click={() => player?.play()}>Play</button>
    <button on:click={() => player?.pause()}>Pause</button>
    <button on:click={() => player && (player.volume = 2)}>Boost 200%</button>
    <button on:click={() => console.log(player?.getQoeSession())}>
      Log QoE session
    </button>
  </div>

  <h3>QoE stream</h3>
  <ul>
    {#each qoe as e, i (i)}
      <li><code>{JSON.stringify(e)}</code></li>
    {/each}
  </ul>
</div>
