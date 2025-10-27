README.md
# TechNova AB – Kundtjänstbot (Fullstack JS)

En AI-baserad kundsupportassistent för TechNova AB. Svarar på frågor om produkter, leveranser, returer, garantier, tekniskt stöd och policyer – och visar källhänvisningar från företagets FAQ/policydokument.

## Teknik
- React (Vite) – chat-UI
- Express – API
- LangChain.js:
  - PromptTemplates, ChatPromptTemplate
  - RunnableSequence, RunnablePassthrough
  - RunnableWithMessageHistory (minne per session)
  - **RunnableBranch** (scope-vakt / routing) ← *extra-funktion för Väl Godkänt*
- Supabase + pgvector – vektor-sök
- Ollama – lokalt LLM & embeddings

## Varför RunnableBranch?
Jag använde **RunnableBranch** för att bygga en *scope-vakt* som dirigerar användarfrågor antingen till QA-kedjan (retrieval-augmented generation) eller till ett vänligt avslag när frågan ligger utanför uppgiftens tillåtna område. Detta ger tydlig kontroll och uppfyller kravet att botten inte ska svara på irrelevanta frågor (t.ex. "Vad är JavaScript?") samtidigt som det demonstrerar en LangChain-funktion vi inte gått igenom i kursen.

## Komma igång

### 1) Förkrav
- Node 18+
- Supabase-projekt
- Ollama installerat och modeller:

ollama pull llama3.2:3b
 ollama pull nomic-embed-text
 ollama serve

### 2) Supabase – SQL
Kör `sql/schema.sql` motsvarande (se README i repo) eller:
- Aktivera `pgvector`
- Skapa tabellen `documents` + RPC-funktionen `match_documents` (se koden i server/README).

### 3) Server
- Skapa `server/.env` utifrån `.env.example`:

SUPABASE_URL=...
 SUPABASE_SERVICE_ROLE_KEY=...
 OLLAMA_BASE_URL=http://localhost:11434
 OLLAMA_CHAT_MODEL=llama3.2:3b
 OLLAMA_EMBED_MODEL=nomic-embed-text
 PORT=3001
 CORS_ORIGIN=http://localhost:5173
- Kör:

cd server
 npm install
 npm run ingest # indexera dokumentet
 npm run dev

### 4) Client

cd client
 npm install
 npm run dev
Öppna http://localhost:5173

### 5) Skärmdump
- Ta en screenshot av Supabase Table Editor för `documents`.
- Lägg som `docs/supabase-table.png` i repot.

## Användning
- Ställ frågor om order, leverans, retur/återbetalning, garanti, tekniskt stöd, integritet/GDPR, säkerhet, miljö/hållbarhet.
- Varje svar med dokumentstöd listar "Källor:" med sektioner ur dokumentet.

## Licens
MIT
