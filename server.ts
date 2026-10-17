import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const VALID_VOICES = new Set(['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr']);

app.post('/api/generate-speech', async (req, res) => {
  try {
    const { text, voiceId, style, speed, pitch } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập văn bản cần chuyển đổi.' });
    }

    if (!apiKey) {
      return res.status(500).json({
        error: 'Chưa tìm thấy API Key (GEMINI_API_KEY). Hãy đảm bảo dự án đã được cấp API key trong Settings > Secrets.',
      });
    }

    // Strip SSML tags to prevent TTS reading markup tags aloud
    const cleanText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    const selectedVoice = VALID_VOICES.has(voiceId) ? voiceId : 'Kore';

    // Build natural style description
    let styleDescription = style || 'Clear, natural, professional speaker';
    if (speed && typeof speed === 'number') {
      if (speed > 1.25) styleDescription += ', speaking at a brisk pace';
      else if (speed < 0.85) styleDescription += ', speaking at a slow, calm, measured pace';
    }
    if (pitch && typeof pitch === 'number') {
      if (pitch >= 3) styleDescription += ', in a bright, higher-pitched tone';
      else if (pitch <= -2) styleDescription += ', in a deep, warm, resonant tone';
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: styleDescription,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(502).json({ error: 'Không nhận được dữ liệu âm thanh từ Gemini TTS.' });
    }

    return res.json({ audio: base64Audio });
  } catch (error: any) {
    console.error('Error in /api/generate-speech:', error);
    const msg = error?.message || 'Lỗi xử lý chuyển văn bản thành giọng nói.';
    return res.status(500).json({ error: msg });
  }
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
