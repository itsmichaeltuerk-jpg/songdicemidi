import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';
import { defineConfig, Plugin } from 'vite';
import { generateArrangementWithGemini } from './src/server/geminiArranger';
import { composeArrangementFromPrompt } from './src/services/proArranger';
import { searchYouTubeCatalog } from './src/services/youtubeService';

dotenv.config();

function apiServerPlugin(): Plugin {
  return {
    name: 'api-server-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/search-youtube') && req.method === 'GET') {
          const url = new URL(req.url, 'http://localhost:3000');
          const q = url.searchParams.get('q') || '';
          const results = searchYouTubeCatalog(q);
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, results }));
          return;
        }

        if (req.url === '/api/generate-arrangement' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            let parsed: any = {};
            try {
              parsed = JSON.parse(body || '{}');
              const arrangement = await generateArrangementWithGemini({
                dicePrompt: parsed.dicePrompt || '',
                chordTab: parsed.chordTab,
                vocalRange: parsed.vocalRange,
                refinementInstruction: parsed.refinementInstruction,
                existingArrangement: parsed.existingArrangement,
                youtubeQuery: parsed.youtubeQuery,
                youtubeUrl: parsed.youtubeUrl,
                songTitle: parsed.songTitle,
                artist: parsed.artist,
                videoId: parsed.videoId,
              });
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, source: 'ai', arrangement }));
            } catch (err: any) {
              const isCreditsDepleted =
                err?.isCreditsDepleted ||
                err?.message === 'prepayment-credits-depleted' ||
                String(err?.message || '').includes('402') ||
                String(err?.message || '').includes('prepayment credits are depleted') ||
                String(err?.message || '').includes('RESOURCE_EXHAUSTED');

              if (isCreditsDepleted) {
                console.info('[Song Dice] Notice: Gemini API prepayment credits depleted; smoothly served with Pro Arranger engine.');
              } else if (err?.message === 'no-key') {
                console.info('[Song Dice] No Gemini API key provided; generating arrangement using local Pro Arranger.');
              } else {
                console.info('[Song Dice] Serving arrangement with local Pro Arranger:', err?.message || 'Offline mode');
              }

              const fallbackArr = composeArrangementFromPrompt(parsed || {});
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  success: false,
                  source: 'local',
                  reason: isCreditsDepleted ? 'credits-depleted' : err?.message === 'no-key' ? 'no-key' : 'gemini-error',
                  message: isCreditsDepleted
                    ? 'AI Studio project prepayment credits are depleted. Arranged using high-fidelity local Pro Arranger.'
                    : undefined,
                  arrangement: fallbackArr,
                }),
              );
            }
          });
          return;
        }

        if (req.url === '/api/health' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ status: 'ok', hasGeminiKey: !!process.env.GEMINI_API_KEY }));
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
