import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateArrangementWithGemini } from './src/server/geminiArranger.js';
import { composeArrangementFromPrompt } from './src/services/proArranger.js';
import { searchYouTubeCatalog } from './src/services/youtubeService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// API: Search YouTube & YouTube Music tracks
app.get('/api/search-youtube', (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  const results = searchYouTubeCatalog(query);
  res.json({ success: true, results });
});

// API: Generate Arrangement with Gemini
app.post('/api/generate-arrangement', async (req: Request, res: Response) => {
  try {
    const {
      dicePrompt,
      chordTab,
      vocalRange,
      refinementInstruction,
      existingArrangement,
      youtubeQuery,
      youtubeUrl,
      songTitle,
      artist,
      videoId,
    } = req.body;
    const arrangement = await generateArrangementWithGemini({
      dicePrompt: dicePrompt || '',
      chordTab,
      vocalRange,
      refinementInstruction,
      existingArrangement,
      youtubeQuery,
      youtubeUrl,
      songTitle,
      artist,
      videoId,
    });
    res.json({ success: true, source: 'ai', arrangement });
  } catch (error: any) {
    const isCreditsDepleted =
      error?.isCreditsDepleted ||
      error?.message === 'prepayment-credits-depleted' ||
      String(error?.message || '').includes('402') ||
      String(error?.message || '').includes('prepayment credits are depleted') ||
      String(error?.message || '').includes('RESOURCE_EXHAUSTED');

    if (isCreditsDepleted) {
      console.info('[Song Dice] Notice: Gemini API prepayment credits depleted; smoothly served with Pro Arranger engine.');
    } else if (error?.message === 'no-key') {
      console.info('[Song Dice] No Gemini API key provided; generating arrangement using local Pro Arranger.');
    } else {
      console.info('[Song Dice] Serving arrangement with local Pro Arranger:', error?.message || 'Offline mode');
    }

    const arrangement = composeArrangementFromPrompt(req.body || {});
    res.json({
      success: false,
      source: 'local',
      reason: isCreditsDepleted ? 'credits-depleted' : error?.message === 'no-key' ? 'no-key' : 'gemini-error',
      message: isCreditsDepleted
        ? 'AI Studio project prepayment credits are depleted. Arranged using high-fidelity local Pro Arranger.'
        : undefined,
      arrangement,
    });
  }
});

// API: Health check & config
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', hasGeminiKey: !!process.env.GEMINI_API_KEY });
});

// Serve built frontend assets
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Song Dice server running on port ${PORT}`);
});
