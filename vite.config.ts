import { defineConfig, type Plugin } from 'vite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';

const pkgVersion = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8'),
).version;

// Production build is handled by scripts/build-standalone.js (not this config)
// This config is only used for dev server (vite dev) and vitest
function devCorsProxyPlugin(): Plugin {
  return {
    name: 'dev-cors-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const url = new URL(req.url || '', 'http://127.0.0.1');
          if (url.pathname === '/_proxy' || url.pathname.startsWith('/_proxy/')) {
            if (req.method === 'OPTIONS') {
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', '*');
              res.statusCode = 204;
              return res.end();
            }

            const target = url.searchParams.get('url');
            if (!target || !/^https?:\/\//i.test(target)) {
              res.statusCode = 400;
              return res.end('Bad target URL');
            }

            const fwd: Record<string, string> = {};
            if (req.headers.range) fwd['Range'] = req.headers.range;
            fwd['User-Agent'] = (req.headers['user-agent'] as string) || 'MoviPlayer-DevProxy';

            const upstream = await fetch(target, {
              headers: fwd,
              redirect: 'follow',
              method: req.method === 'HEAD' ? 'HEAD' : 'GET',
            });

            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', '*');
            res.setHeader('Access-Control-Expose-Headers', '*');
            res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream');
            res.setHeader('Accept-Ranges', upstream.headers.get('accept-ranges') || 'bytes');
            res.setHeader('Cache-Control', 'no-store');

            const cl = upstream.headers.get('content-length');
            if (cl) res.setHeader('Content-Length', cl);
            const cr = upstream.headers.get('content-range');
            if (cr) res.setHeader('Content-Range', cr);
            const cd = upstream.headers.get('content-disposition');
            if (cd) res.setHeader('Content-Disposition', cd);

            res.statusCode = upstream.status;
            if (req.method === 'HEAD' || !upstream.body) return res.end();
            // @ts-ignore
            Readable.fromWeb(upstream.body).pipe(res).on('error', () => res.end());
            return;
          }
        } catch (err: any) {
          if (!res.headersSent) res.statusCode = 502;
          return res.end('Dev proxy fetch failed: ' + (err?.message || err));
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [devCorsProxyPlugin()],
  resolve: {
    alias: {
      'anyvid-player/element/slim': fileURLToPath(new URL('./src/element-slim.ts', import.meta.url)),
      'anyvid-player/element': fileURLToPath(new URL('./src/element.ts', import.meta.url)),
      'anyvid-player/player': fileURLToPath(new URL('./src/player.ts', import.meta.url)),
      'anyvid-player/demuxer': fileURLToPath(new URL('./src/demuxer.ts', import.meta.url)),
      'anyvid-player/react': fileURLToPath(new URL('./packages/react/index.tsx', import.meta.url)),
      'anyvid-player/vue': fileURLToPath(new URL('./packages/vue/index.ts', import.meta.url)),
      'anyvid-player/svelte': fileURLToPath(new URL('./packages/svelte/AnyVidPlayer.svelte', import.meta.url)),
      'anyvid-player': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      'movi-player/element/slim': fileURLToPath(new URL('./src/element-slim.ts', import.meta.url)),
      'movi-player/element': fileURLToPath(new URL('./src/element.ts', import.meta.url)),
      'movi-player/player': fileURLToPath(new URL('./src/player.ts', import.meta.url)),
      'movi-player/demuxer': fileURLToPath(new URL('./src/demuxer.ts', import.meta.url)),
      'movi-player/react': fileURLToPath(new URL('./packages/react/index.tsx', import.meta.url)),
      'movi-player/vue': fileURLToPath(new URL('./packages/vue/index.ts', import.meta.url)),
      'movi-player/svelte': fileURLToPath(new URL('./packages/svelte/AnyVidPlayer.svelte', import.meta.url)),
      'movi-player': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
  // Keep the dev server / vitest in sync with the same version define the
  // production build injects, so MoviElement.version works there too.
  define: {
    __MOVI_VERSION__: JSON.stringify(pkgVersion),
  },
  worker: {
    format: 'es',
  },
  // Don't let Vite pre-bundle the generated WASM glue into node_modules/.vite.
  // It's a ~6 MB emscripten module rebuilt via `npm run build:wasm`; if Vite
  // caches it as an optimized dep, the dev server keeps serving a STALE copy
  // after a WASM rebuild (no [movi] logs, old behaviour). Excluding it makes
  // the dev server always read the fresh dist/wasm/movi.js.
  optimizeDeps: {
    exclude: ['movi'],
  },
  server: {
    allowedHosts: true,
    headers: {
      // 'same-origin-allow-popups' (not 'same-origin') so Google Identity
      // Services OAuth popups can post the token back to the opener — plain
      // 'same-origin' severs that link and GIS falsely reports 'popup_closed'.
      // COEP is intentionally NOT set: it's only useful together with
      // COOP 'same-origin' to earn crossOriginIsolated (SharedArrayBuffer),
      // which we've given up here — and 'require-corp' both blocks cross-origin
      // subresources and further breaks the OAuth popup. The player does NOT
      // need SAB: single-threaded WASM + Asyncify I/O, HttpSource plain-buffer
      // fallback. SAB was only a zero-copy optimisation.
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
});
