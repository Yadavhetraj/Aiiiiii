import { useState, useRef, useEffect } from "react";

export default function App() {
  const [tab, setTab] = useState("chat");

  // ── Chat ───────────────────────────────────────────────
  const [msgs, setMsgs]               = useState([]);
  const [chatInput, setChatInput]     = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const bottomRef = useRef(null);

  // ── Image ──────────────────────────────────────────────
  const [imgPrompt, setImgPrompt]   = useState("");
  const [currentImg, setCurrentImg] = useState(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgHistory, setImgHistory] = useState([]);

  // ── Code ───────────────────────────────────────────────
  const [code, setCode]               = useState("");
  const [codeLang, setCodeLang]       = useState("javascript");
  const [codeAction, setCodeAction]   = useState("explain");
  const [codeOutput, setCodeOutput]   = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [customTask, setCustomTask]   = useState("");

  useEffect(() => {
    if (tab === "chat") bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, chatLoading, tab]);

  // ── Chat: Claude API ───────────────────────────────────
  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput("");
    const newMsgs = [...msgs, { role: "user", content: text }];
    setMsgs(newMsgs);
    setChatLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are a helpful, friendly AI assistant. Be clear and concise.",
          messages: newMsgs,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      setMsgs([...newMsgs, { role: "assistant", content: data.content?.[0]?.text ?? "No response." }]);
    } catch (err) {
      setMsgs([...newMsgs, { role: "assistant", content: `⚠️ ${err.message}` }]);
    }
    setChatLoading(false);
  };

  // ── Image: Pollinations ────────────────────────────────
  const genImage = () => {
    const p = imgPrompt.trim();
    if (!p || imgLoading) return;
    setImgLoading(true);
    setCurrentImg(null);
    const seed = Math.floor(Math.random() * 999999);
    const url  = `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=800&height=800&seed=${seed}&nologo=true&enhance=true`;
    const img  = new Image();
    img.onload  = () => {
      const item = { url, prompt: p };
      setCurrentImg(item);
      setImgHistory(h => [item, ...h].slice(0, 9));
      setImgLoading(false);
    };
    img.onerror = () => setImgLoading(false);
    img.src = url;
  };

  // ── Code: Claude API ───────────────────────────────────
  const ACTIONS = {
    explain:   "Explain what this code does, step by step, in simple terms.",
    fix:       "Find and fix all bugs in this code. Show the corrected code and explain what was wrong.",
    optimize:  "Optimize this code for better performance and readability. Show the improved version and explain the changes.",
    comments:  "Add clear, helpful comments to every part of this code. Return the fully commented code.",
    convert:   `Convert this code to Python. Keep the same logic but use Python best practices.`,
    test:      "Write unit tests for this code. Cover edge cases and common scenarios.",
    custom:    "",
  };

  const runCode = async () => {
    const c = code.trim();
    if (!c || codeLoading) return;
    setCodeLoading(true);
    setCodeOutput("");
    const taskText = codeAction === "custom"
      ? customTask.trim() || "Review this code and give feedback."
      : ACTIONS[codeAction];
    const prompt = `Language: ${codeLang}\n\nTask: ${taskText}\n\nCode:\n\`\`\`${codeLang}\n${c}\n\`\`\``;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: "You are an expert software engineer and code reviewer. Give precise, actionable responses. When showing code, always use code blocks.",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      setCodeOutput(data.content?.[0]?.text ?? "No response.");
    } catch (err) {
      setCodeOutput(`⚠️ Error: ${err.message}`);
    }
    setCodeLoading(false);
  };

  // ── Design tokens ──────────────────────────────────────
  const T = {
    bg:      "#0b0b0e",
    surface: "#14141a",
    card:    "#1a1a22",
    border:  "#232330",
    text:    "#dcdce4",
    muted:   "#4c4c60",
    blue:    "#4070f4",
    green:   "#34d399",
    purple:  "#a78bfa",
    orange:  "#fb923c",
  };

  const LANGS = ["javascript","python","typescript","html","css","java","c++","c#","rust","go","php","swift","kotlin","sql","bash"];
  const ACTION_LIST = [
    { id: "explain",  label: "Explain",   icon: "📖" },
    { id: "fix",      label: "Fix Bugs",  icon: "🐛" },
    { id: "optimize", label: "Optimize",  icon: "⚡" },
    { id: "comments", label: "Comment",   icon: "💬" },
    { id: "convert",  label: "→ Python",  icon: "🔄" },
    { id: "test",     label: "Write Tests",icon: "🧪" },
    { id: "custom",   label: "Custom",    icon: "✏️" },
  ];

  const TABS = [
    { id: "chat",  icon: "💬", label: "Chat"   },
    { id: "image", icon: "🎨", label: "Image"  },
    { id: "code",  icon: "💻", label: "Code"   },
  ];

  return (
    <div style={{
      height: 640, background: T.bg, borderRadius: 16,
      overflow: "hidden", display: "flex", flexDirection: "column",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      border: `1px solid ${T.border}`, color: T.text,
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(7px)} to{opacity:1;transform:none} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes blink  { 0%,100%{opacity:.15} 50%{opacity:.9} }
        .appear { animation: fadeUp 0.22s ease forwards; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 3px; }
        button { transition: opacity 0.12s, background 0.12s; }
        button:hover:not(:disabled) { opacity: 0.82; }
        textarea, select { outline: none !important; }
        .suggest-btn:hover { background: #1e1e28 !important; color: #aaa !important; }
        .action-btn:hover  { border-color: #4070f4 !important; color: #c0c0d0 !important; }
        pre { margin: 0; white-space: pre-wrap; word-break: break-word; }
      `}</style>

      {/* ── HEADER ──────────────────────────────────────── */}
      <div style={{ padding: "13px 18px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 33, height: 33, borderRadius: 10, flexShrink: 0,
            background: `linear-gradient(135deg, ${T.green}, ${T.blue})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
          }}>✦</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#ebebf3", letterSpacing: -0.3 }}>AI Studio</div>
            <div style={{ fontSize: 11, color: T.muted }}>Chat · Image · Code</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 5, alignItems: "center" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green }}/>
            <span style={{ fontSize: 11, color: T.green, fontWeight: 500 }}>Online</span>
          </div>
        </div>

        {/* 3-tab bar */}
        <div style={{ display: "flex", background: T.surface, borderRadius: 11, padding: 3, gap: 2 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "7px 0", border: "none", borderRadius: 9, cursor: "pointer",
              fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
              background: tab === t.id ? T.card : "transparent",
              color: tab === t.id ? T.text : T.muted,
            }}>
              {t.icon}  {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════ CHAT ════════════════ */}
      {tab === "chat" && <>
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          {msgs.length === 0 && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 30 }}>
              <div style={{ fontSize: 38 }}>✦</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#d0d0da", letterSpacing: -0.3 }}>Ask me anything</div>
              <div style={{ fontSize: 13, color: T.muted, textAlign: "center", maxWidth: 270, lineHeight: 1.55 }}>
                Powered by Claude — coding, writing, analysis, or just chat
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center", marginTop: 6 }}>
                {["How does AI work?","Write me a poem","Explain black holes","Tell me a joke"].map(s => (
                  <button key={s} onClick={() => setChatInput(s)} className="suggest-btn" style={{
                    padding: "5px 13px", borderRadius: 20, border: `1px solid ${T.border}`,
                    background: "transparent", color: "#777", fontSize: 12, cursor: "pointer",
                  }}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className="appear" style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 8 }}>
              {m.role === "assistant" && (
                <div style={{ width: 27, height: 27, borderRadius: 8, flexShrink: 0, marginTop: 2, background: `linear-gradient(135deg,${T.green},${T.blue})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✦</div>
              )}
              <div style={{ maxWidth: "74%", padding: "10px 14px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px", background: m.role === "user" ? T.blue : T.card, color: T.text, fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {m.content}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ width: 27, height: 27, borderRadius: 8, flexShrink: 0, background: `linear-gradient(135deg,${T.green},${T.blue})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✦</div>
              <div style={{ padding: "12px 16px", background: T.card, borderRadius: "4px 16px 16px 16px", display: "flex", gap: 5, alignItems: "center" }}>
                {[0, 0.18, 0.36].map((d, i) => <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#666", display: "inline-block", animation: `blink 1.3s ${d}s infinite` }}/>)}
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>
        <div style={{ padding: "10px 14px 14px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, background: T.surface, borderRadius: 14, padding: "10px 12px", border: `1px solid ${T.border}` }}>
            <textarea value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
              placeholder="Message… (Enter to send)" rows={1}
              style={{ flex: 1, background: "transparent", border: "none", color: T.text, fontSize: 14, resize: "none", lineHeight: 1.5, fontFamily: "inherit", maxHeight: 110, overflowY: "auto" }}
            />
            <button onClick={sendChat} disabled={!chatInput.trim() || chatLoading} style={{ width: 33, height: 33, borderRadius: 10, border: "none", cursor: "pointer", flexShrink: 0, background: chatInput.trim() && !chatLoading ? T.blue : "#1c1c28", color: chatInput.trim() && !chatLoading ? "#fff" : "#444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700 }}>↑</button>
          </div>
          {msgs.length > 0 && <div style={{ textAlign: "right", marginTop: 5 }}><button onClick={() => setMsgs([])} style={{ fontSize: 11, color: "#333348", background: "none", border: "none", cursor: "pointer" }}>Clear conversation</button></div>}
        </div>
      </>}

      {/* ════════════════ IMAGE ════════════════ */}
      {tab === "image" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: T.surface, borderRadius: 13, padding: 16, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, marginBottom: 9, letterSpacing: 0.7, textTransform: "uppercase" }}>Describe your image</div>
            <textarea value={imgPrompt} onChange={e => setImgPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) genImage(); }}
              placeholder={`"a serene mountain lake at golden hour, photorealistic, 8K"…`} rows={3}
              style={{ width: "100%", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 13px", color: T.text, fontSize: 14, resize: "none", lineHeight: 1.6, fontFamily: "inherit", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 11 }}>
              <span style={{ fontSize: 11, color: "#2e2e42" }}>Ctrl+Enter to generate</span>
              <div style={{ display: "flex", gap: 8 }}>
                {currentImg && <button onClick={genImage} disabled={imgLoading} style={{ padding: "8px 14px", borderRadius: 9, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 13, cursor: "pointer" }}>↻ Redo</button>}
                <button onClick={genImage} disabled={!imgPrompt.trim() || imgLoading} style={{ padding: "9px 22px", borderRadius: 9, border: "none", cursor: "pointer", background: imgPrompt.trim() && !imgLoading ? T.blue : "#1c1c28", color: imgPrompt.trim() && !imgLoading ? "#fff" : "#404050", fontSize: 14, fontWeight: 600 }}>
                  {imgLoading ? "Generating…" : "✦ Generate"}
                </button>
              </div>
            </div>
          </div>
          {imgLoading && (
            <div style={{ background: T.surface, borderRadius: 13, height: 240, border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${T.border}`, borderTopColor: T.blue, animation: "spin 0.85s linear infinite" }}/>
              <div style={{ fontSize: 13, color: T.muted }}>Creating your image…</div>
            </div>
          )}
          {currentImg && !imgLoading && (
            <div className="appear" style={{ borderRadius: 13, overflow: "hidden", border: `1px solid ${T.border}` }}>
              <img src={currentImg.url} alt={currentImg.prompt} style={{ width: "100%", display: "block" }}/>
              <div style={{ padding: "11px 15px", background: T.surface, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ flex: 1, fontSize: 12, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentImg.prompt}</span>
                <a href={currentImg.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: T.blue, textDecoration: "none", flexShrink: 0, fontWeight: 500 }}>Open full ↗</a>
              </div>
            </div>
          )}
          {imgHistory.length > 1 && (
            <div>
              <div style={{ fontSize: 11, color: "#2e2e42", fontWeight: 600, marginBottom: 9, letterSpacing: 0.7, textTransform: "uppercase" }}>Recent</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 }}>
                {imgHistory.slice(1).map((item, i) => (
                  <div key={i} onClick={() => { setCurrentImg(item); setImgPrompt(item.prompt); }} title={item.prompt} style={{ borderRadius: 10, overflow: "hidden", cursor: "pointer", aspectRatio: "1", border: `1px solid ${T.border}` }}>
                    <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}/>
                  </div>
                ))}
              </div>
            </div>
          )}
          {imgHistory.length === 0 && !imgLoading && (
            <div>
              <div style={{ fontSize: 11, color: "#2e2e42", fontWeight: 600, marginBottom: 9, letterSpacing: 0.7, textTransform: "uppercase" }}>Try these</div>
              {["a futuristic neon city at night, cinematic, 8K","a cozy cabin in snowy forest, warm lights, golden hour","an ancient dragon on castle ruins, epic fantasy art","cute astronaut cat floating in space, digital painting"].map(s => (
                <button key={s} onClick={() => setImgPrompt(s)} className="suggest-btn" style={{ display: "block", width: "100%", marginBottom: 6, padding: "10px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: "transparent", color: "#666", fontSize: 13, cursor: "pointer", textAlign: "left" }}>🖼  {s}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════ CODE ════════════════ */}
      {tab === "code" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Top row: language + action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: T.surface, borderRadius: 9, padding: "6px 12px", border: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12, color: T.muted }}>Language:</span>
              <select value={codeLang} onChange={e => setCodeLang(e.target.value)} style={{ background: "transparent", border: "none", color: T.text, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {LANGS.map(l => <option key={l} value={l} style={{ background: "#1a1a22" }}>{l}</option>)}
              </select>
            </div>
            <div style={{ fontSize: 12, color: T.muted }}>Action:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ACTION_LIST.map(a => (
                <button key={a.id} onClick={() => setCodeAction(a.id)} className="action-btn" style={{
                  padding: "5px 11px", borderRadius: 8, cursor: "pointer", fontSize: 12,
                  border: `1px solid ${codeAction === a.id ? T.purple : T.border}`,
                  background: codeAction === a.id ? "#1e1828" : "transparent",
                  color: codeAction === a.id ? T.purple : T.muted,
                  fontWeight: codeAction === a.id ? 600 : 400,
                }}>{a.icon} {a.label}</button>
              ))}
            </div>
          </div>

          {/* Custom task input */}
          {codeAction === "custom" && (
            <div className="appear">
              <input value={customTask} onChange={e => setCustomTask(e.target.value)}
                placeholder="Describe what you want Claude to do with your code…"
                style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9, padding: "9px 13px", color: T.text, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>
          )}

          {/* Code editor */}
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", top: 10, right: 12, fontSize: 11, color: T.muted, fontFamily: "monospace", pointerEvents: "none" }}>{codeLang}</div>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={`// Paste or type your ${codeLang} code here…\n// Then pick an action above and click Run`}
              rows={10}
              style={{
                width: "100%", background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 11, padding: "12px 14px", color: "#c9d1d9",
                fontSize: 13, resize: "vertical", lineHeight: 1.7,
                fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                boxSizing: "border-box", minHeight: 180,
              }}
            />
          </div>

          {/* Run button */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#2e2e42" }}>
              {codeLoading ? "Claude is analyzing…" : code ? `${code.split("\n").length} lines` : "Paste code above"}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              {(code || codeOutput) && (
                <button onClick={() => { setCode(""); setCodeOutput(""); }} style={{ padding: "8px 14px", borderRadius: 9, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 13, cursor: "pointer" }}>Clear</button>
              )}
              <button onClick={runCode} disabled={!code.trim() || codeLoading} style={{
                padding: "9px 24px", borderRadius: 9, border: "none", cursor: "pointer",
                background: code.trim() && !codeLoading ? T.purple : "#1c1c28",
                color: code.trim() && !codeLoading ? "#fff" : "#404050",
                fontSize: 14, fontWeight: 600,
              }}>
                {codeLoading ? "Running…" : "▶  Run"}
              </button>
            </div>
          </div>

          {/* Loading */}
          {codeLoading && (
            <div style={{ background: T.surface, borderRadius: 11, padding: 20, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${T.border}`, borderTopColor: T.purple, animation: "spin 0.8s linear infinite", flexShrink: 0 }}/>
              <span style={{ fontSize: 13, color: T.muted }}>Claude is reading your code…</span>
            </div>
          )}

          {/* Output */}
          {codeOutput && !codeLoading && (
            <div className="appear" style={{ background: T.surface, borderRadius: 11, border: `1px solid ${T.border}`, overflow: "hidden" }}>
              <div style={{ padding: "9px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.purple }}/>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.purple }}>Claude's Response</span>
                <button onClick={() => navigator.clipboard?.writeText(codeOutput)} style={{ marginLeft: "auto", fontSize: 11, color: T.muted, background: "none", border: "none", cursor: "pointer" }}>Copy</button>
              </div>
              <div style={{ padding: "14px 16px", fontSize: 13, lineHeight: 1.75, color: T.text, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 320, overflowY: "auto" }}>
                {codeOutput}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!code && !codeOutput && !codeLoading && (
            <div style={{ background: T.surface, borderRadius: 11, padding: 20, border: `1px dashed ${T.border}` }}>
              <div style={{ fontSize: 12, color: "#2e2e42", fontWeight: 600, marginBottom: 10, letterSpacing: 0.6, textTransform: "uppercase" }}>Quick start</div>
              {[
                { label: "🐛  Paste buggy code → Fix Bugs → get it fixed", },
                { label: "📖  Paste any code → Explain → understand it",    },
                { label: "⚡  Paste slow code → Optimize → make it faster", },
                { label: "🧪  Paste a function → Write Tests → get test cases", },
              ].map((h, i) => (
                <div key={i} style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>{h.label}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
