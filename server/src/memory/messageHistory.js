import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';

const store = new Map();

export function getHistory(sessionId) {
  if (!store.has(sessionId)) {
    store.set(sessionId, new InMemoryChatMessageHistory());
  }
  return store.get(sessionId);
}
