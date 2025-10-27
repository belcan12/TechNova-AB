import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export async function askServer(question, sessionId) {
  const res = await axios.post(
    `${API_BASE}/api/chat`,
    { question },
    { headers: { 'x-session-id': sessionId } }
  );
  return res.data;
}
