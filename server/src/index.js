import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat.js';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
}));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.use('/api/chat', chatRouter);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`☕ TechNova server igång på http://localhost:${port}`);
});
