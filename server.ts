import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateArrangementWithGemini } from './src/server/geminiArranger.js';
import { composeArrangementFromPrompt } from './src/services/proArranger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// API: Generate Arrangement with Gemini
app.post('/api/generate-arrangement', async (req: Request, res: Response) => {
  try {
    const { dicePrompt, chordTab, vocalRange, refinementInstruction, existingArrangement } = req.body;
    const arrangement = await generateArrangementWithGemini({
      dicePrompt: dicePrompt || '',
      chordTab,
      vocalRange,
      refinementInstruction,
      existingArrangement,
    });
    res.json({ success: true, source: 'ai', arrangement });
  } catch (error: any) {
    console.warn('Handling request with fallback arrangement:', error?.message || error);
    const arrangement = composeArrangementFromPrompt(req.body || {});
    res.json({
      success: false,
      source: 'local',
      reason: error?.message === 'no-key' ? 'no-key' : 'gemini-error',
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
