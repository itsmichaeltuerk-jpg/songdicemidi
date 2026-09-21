import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';
import { defineConfig, Plugin } from 'vite';
import { generateArrangementWithGemini } from './src/server/geminiArranger';
import { composeArrangementFromPrompt } from './src/services/proArranger';

dotenv.config();

function apiServerPlugin(): Plugin {
  return {
    name: 'api-server-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/generate-arrangement' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const arrangement = await generateArrangementWithGemini({
                dicePrompt: parsed.dicePrompt || '',
                chordTab: parsed.chordTab,
                vocalRange: parsed.vocalRange,
                refinementInstruction: parsed.refinementInstruction,
                existingArrangement: parsed.existingArrangement,
              });
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, arrangement }));
            } catch (err: any) {
              console.warn('[Vite Middleware] Handling with Pro Arranger fallback:', err?.message || err);
              const fallbackArr = composeArrangementFromPrompt({});
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, arrangement: fallbackArr }));
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
