import express from 'express';
import { getRetriever } from '../retriever/supabase.js';
import { createQAOrRefusalChain } from '../chains/qaChain.js';

const router = express.Router();


router.post('/', async (req, res) => {
  try {
    const { question } = req.body || {};
    const sessionId = req.headers['x-session-id'] || `sess_${Math.random().toString(36).slice(2)}`;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Saknar "question" i body.' });
    }

    const retriever = await getRetriever();
    const chain = await createQAOrRefusalChain({ retriever });

    // Hämta dokument för källhänvisning (så vi kan visa dem för klienten)
    const docs = await retriever.getRelevantDocuments(question);

    const answer = await chain.invoke(
      { question, docs },
      { configurable: { sessionId } }
    );

    const citations = (docs || []).slice(0, 4).map((d) => ({
      section: d.metadata?.section || 'Okänd sektion',
      source: d.metadata?.source || 'TechNova AB – FAQ & Policydokument',
      snippet: (d.pageContent || '').slice(0, 240) + ((d.pageContent || '').length > 240 ? '…' : ''),
      score: d.metadata?.similarity ?? undefined
    }));

    res.json({ answer, citations, sessionId });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Internt fel i chat-endpoint.' });
  }
});

export default router;
