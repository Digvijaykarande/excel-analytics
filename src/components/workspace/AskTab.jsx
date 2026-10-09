import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Send } from "lucide-react";
import { api } from "../../lib/api";
import { aiPayload } from "../../lib/analyze";
import { Spinner } from "../ui";
import ChartFromSpec, { normalizeSpec } from "../ChartFromSpec";

export default function AskTab({ name, sheet, profile, aiEnabled }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  const payload = useMemo(() => aiPayload(name, sheet, profile), [name, sheet, profile]);

  useEffect(() => { setMessages([]); }, [sheet]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, busy]);

  const examples = useMemo(() => {
    const num = profile.columns.find((c) => c.type === "number"), cat = profile.columns.find((c) => c.type === "category");
    return [
      "What are the most important takeaways?",
      num && cat ? `Which ${cat.name} has the highest ${num.name}?` : "Are there any data quality problems?",
      num ? `Are there outliers in ${num.name}?` : "How is the data distributed?",
      "Which columns are most related?",
    ];
  }, [profile]);

  const send = async (text) => {
    const question = (text ?? input).trim();
    if (!question || busy) return;
    const history = messages.slice(-6).map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text }));
    setMessages((m) => [...m, { role: "user", text: question }]); setInput(""); setBusy(true);
    try {
      const r = await api("/api/ai/ask", { method: "POST", body: { ...payload, question, history } });
      setMessages((m) => [...m, { role: "ai", text: r.answer, chart: normalizeSpec(r.chart, sheet) }]);
    } catch (e) { setMessages((m) => [...m, { role: "ai", text: e.message, error: true }]); }
    finally { setBusy(false); }
  };

  if (aiEnabled === false) return <div className="callout"><Bot size={18} style={{ flex: "none" }} />AI isn't configured on the server. Add GROQ_API_KEY to the backend .env to enable chat.</div>;

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", minHeight: 480 }}>
      <div className="card-head"><div className="row"><Bot size={18} color="var(--primary)" /><h3>Ask your data</h3></div><span className="muted sm">Answers are based on column statistics and sample rows</span></div>
      <div className="card-pad chat" style={{ flex: 1, overflow: "auto", maxHeight: 520 }} aria-live="polite">
        {messages.length === 0 && <div className="stack" style={{ gap: 10 }}><p className="muted">Ask anything about this sheet in plain English. Try:</p><div className="sugg">{examples.map((e) => <button key={e} onClick={() => send(e)}>{e}</button>)}</div></div>}
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div className={`bubble ${m.role}`} style={m.error ? { color: "var(--bad)" } : undefined}>{m.text}</div>
            {m.chart && <div className="card card-pad" style={{ width: "100%", maxWidth: 560 }}><ChartFromSpec sheet={sheet} spec={m.chart} small /></div>}
          </div>
        ))}
        {busy && <div className="bubble ai row"><Spinner />Thinking…</div>}
        <div ref={end} />
      </div>
      <form className="row" style={{ padding: 14, borderTop: "1px solid var(--border)" }} onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input className="input" placeholder="Ask a question about your data…" maxLength={500} value={input} onChange={(e) => setInput(e.target.value)} aria-label="Your question" />
        <button className="btn primary" disabled={busy || !input.trim()} aria-label="Send"><Send size={16} /></button>
      </form>
    </div>
  );
}
