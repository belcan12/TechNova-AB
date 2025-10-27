export default function ChatMessage({ role, text, citations }) {
  return (
    <div className={`msg ${role === 'user' ? 'user' : 'bot'}`}>
      <div>{text}</div>
      {role !== 'user' && citations?.length > 0 && (
        <div className="citations">
          <div className="small"><strong>Källor:</strong></div>
          {citations.map((c, idx) => (
            <div key={idx} className="citation-item small">
              • [{c.section}] — <em>{c.source}</em>
              <div className="small">”{c.snippet}”</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
