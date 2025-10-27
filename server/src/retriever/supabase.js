import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';

let _client = null;
let _vectorStore = null;

function supabaseClient() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Saknar SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY i .env');
  _client = createClient(url, key);
  return _client;
}

function embeddings() {
  return new OllamaEmbeddings({
    model: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  });
}

export async function getVectorStore() {
  if (_vectorStore) return _vectorStore;
  const client = supabaseClient();

  _vectorStore = new SupabaseVectorStore(embeddings(), {
    client,
    tableName: 'documents',
    queryName: 'match_documents',
  });

  return _vectorStore;
}

export async function getRetriever() {
  const store = await getVectorStore();
  return store.asRetriever({
    k: 4,
    searchType: 'mmr'
  });
}
