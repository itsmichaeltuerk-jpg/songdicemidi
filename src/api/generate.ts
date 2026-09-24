import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { dice, seed } = req.body

  const apiKey = process.env.GOOGLE_API_KEY // SERVER ONLY - no VITE_ prefix
  if (!apiKey) return res.status(500).json({ error: 'GOOGLE_API_KEY missing in Vercel env' })

  const prompt = `You are SongDiceMIDI. Dice: ${JSON.stringify(dice)}, Seed: ${seed}. Return strict JSON: { key, bpm, chords[], melody[], arrangement: { sections: [{name, bars, chords}] } } }`

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  )

  const data = await geminiRes.json()
  res.json(data)
}
