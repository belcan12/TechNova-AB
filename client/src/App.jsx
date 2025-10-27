import { useEffect, useRef, useState } from 'react';
import './styles.css';
import ChatMessage from './components/ChatMessage.jsx';
import { askServer } from './api.js';

function makeSessionId() {
  const key = 'technova_session_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'sess_' + Math.random().toString(36).slice(2);
    localStorage.setItem(key, id);
  }
  return id;
}

export default function App() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hej! Jag är TechNova AB:s kundtjänstbot. Fråga mig gärna om order, leverans, retur, garanti, tekniskt stöd eller policyer.' }
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const sessionIdRef = useRef(makeSessionId());

  async function onSend() {
    const q = input.trim();
    if (!q) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text: q }]);
    setBusy(true);
    try {
      const data = await askServer(q, sessionIdRef.current);
      setMessages(m => [...m, { role: 'bot', text: data.answer, citations: data.citations || [] }]);
    } catch (e) {
      console.error(e);
      setMessages(m => [...m, { role: 'bot', text: 'Tyvärr, något gick fel i servern.' }]);
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  useEffect(() => {
    const el = document.documentElement;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div className="container">
      <div className="header">
        <h2>TechNova AB – Kundtjänstbot</h2>
        <div className="badge">Session: {sessionIdRef.current}</div>
      </div>

      <div className="chat">
        {messages.map((m, i) => (
          <ChatMessage key={i} role={m.role} text={m.text} citations={m.citations} />
        ))}
      </div>

      <div className="input-row">
        <input
          placeholder={busy ? 'Skriver svar…' : 'Skriv din fråga om TechNova här…'}
          value={input}
          disabled={busy}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button disabled={busy} onClick={onSend}>Skicka</button>
      </div>

      <p className="small">Obs: Botten svarar endast på TechNova-relaterade frågor. Frågor utanför scope får ett vänligt avslag.</p>
    </div>
  );
}
