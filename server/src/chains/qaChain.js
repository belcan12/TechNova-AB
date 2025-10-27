import { ChatOllama } from '@langchain/community/chat_models/ollama';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence, RunnablePassthrough, RunnableWithMessageHistory, RunnableLambda } from '@langchain/core/runnables';
import { buildPrompt } from './prompt.js';
import { getHistory } from '../memory/messageHistory.js';

function chatModel() {
  return new ChatOllama({
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_CHAT_MODEL || 'llama3.2:3b',
    temperature: 0.2,
  });
}

// Enkel scope-koll: bara TechNova-relaterade frågor ska besvaras
function isInScope(question) {
  const q = (question || '').toLowerCase();
  const keywords = [
    'technova', 'order', 'beställ', 'leverans', 'frakt', 'spårning', 'garanti',
    'reklamation', 'återbetal', 'retur', 'ångerrätt', 'produkt', 'reservdel',
    'gdpr', 'integritet', 'kundsupport', 'kontakt', 'öppettider', 'miljö', 'hållbarhet'
  ];
  return keywords.some(k => q.includes(k));
}

export async function createQAOrRefusalChain({ retriever }) {
  const model = chatModel();
  const prompt = buildPrompt();

  // Gör om träffade dokument till en sammanhängande kontextsträng
  const formatDocs = new RunnableLambda({
    func: async (input) => {
      const docs = input.docs || await retriever.getRelevantDocuments(input.question);
      const formatted = docs.map((d, i) => {
        const sec = d.metadata?.section ? `§${d.metadata.section}` : '§Okänd';
        return `(${i + 1}) [${sec}] ${d.pageContent}`;
      });
      return formatted.join('\n---\n');
    }
  });

  // Vår vanliga RAG-kedja
  const qaCore = RunnableSequence.from([
    RunnablePassthrough.assign({ context: formatDocs }),
    prompt,
    model,
    new StringOutputParser()
  ]);

  // Vänligt avslag utanför scope
  const refusal = new RunnableLambda({
    func: async () =>
      `Jag kan tyvärr inte svara på den typen av fråga. ` +
      `Jag hjälper endast till med TechNova AB:s produkter, leveranser, returer, garantier, tekniskt stöd och policyer. ` +
      `Ställ gärna en fråga inom dessa områden.`
  });

  // Router som avgör vilken kedja som ska köras
  const router = new RunnableLambda({
    func: async (input) => {
      if (isInScope(input.question)) {
        return qaCore.invoke(input);
      }
      return refusal.invoke(input);
    }
  });

  // Chat-minne per session
  const withHistory = new RunnableWithMessageHistory({
    runnable: router,
    getMessageHistory: async (sessionId) => getHistory(sessionId),
    historyMessagesKey: 'chat_history',
    inputMessagesKey: 'question'
  });

  return withHistory;
}
