import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Saknar SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY');
  }

  const client = createClient(supabaseUrl, supabaseKey);
  const embeddings = new OllamaEmbeddings({
    model: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  });

  const raw = await fs.readFile(path.join(__dirname, '../data/technova_faq.txt'), 'utf8');

  const sections = raw.split(/\n(?=\d+\.\s)/g).map(s => s.trim()).filter(Boolean);

  const allDocs = [];
  for (const s of sections) {
    const firstLine = s.split('\n')[0] || '';
    const match = firstLine.match(/^(\d+)\.\s*(.+)$/);
    const sectionId = match ? match[1] : 'X';
    const sectionTitle = match ? match[2] : 'Okänd sektion';

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 120
    });

    const chunks = await splitter.createDocuments([s], {
      metadata: {
        source: 'TechNova AB – FAQ & Policydokument',
        section: `${sectionId} ${sectionTitle}`
      }
    });

    allDocs.push(...chunks);
  }

  console.log(`Skapar embeddings för ${allDocs.length} chunks...`);

  const store = new SupabaseVectorStore(embeddings, {
    client,
    tableName: 'documents',
    queryName: 'match_documents',
  });

  // Rensa tabellen (re-ingest på ett säkert sätt)
  await client.from('documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  await store.addDocuments(allDocs);

  console.log('✅ Ingest klar!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
