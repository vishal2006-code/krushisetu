import { useEffect, useMemo, useRef, useState } from "react";
import api, { getErrorMessage } from "../lib/api";
import { useAuth } from "../context/useAuth";

const QUICK_PROMPTS = [
  "What vegetables are available today?",
  "Show me current seasonal vegetables",
  "How do orders work in KrushiSetu?",
  "What can a farmer do here?"
];

function Chatbot() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am your KrushiSetu assistant. Ask me about vegetables, seasonal produce, orders, payments, farmer tools, reviews, favorites, or notifications."
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const placeholder = useMemo(() => {
    if (user?.role === "farmer") {
      return "Ask about orders, crops, analytics, or farmer features";
    }

    return "Ask about vegetables, orders, payments, or seasonal produce";
  }, [user?.role]);

  const sendMessage = async (prefilledMessage) => {
    const outgoing = String(prefilledMessage ?? message).trim();

    if (!outgoing || loading) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: outgoing
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/chat", {
        message: outgoing,
        role: user?.role || "customer",
        userName: user?.name || "User",
        history: nextMessages.slice(-6).map((entry) => ({
          role: entry.role,
          content: entry.content
        }))
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.data?.reply || "I could not generate a reply just now."
        }
      ]);
    } catch (err) {
      const errorMessage = getErrorMessage(err, "Chat assistant is unavailable right now.");
      setError(errorMessage);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: "I hit a problem while answering that. Please try again in a moment."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendMessage();
  };

  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await sendMessage();
    }
  };

  return (
    <section className="glass-card h-full p-0">
      <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">Smart Assistant</p>
            <h3 className="mt-2 text-2xl font-black text-slate-900">KrushiSetu Chatbot</h3>
            <p className="mt-2 text-sm text-slate-500">
              Context-aware help for marketplace actions, produce, orders, and platform features.
            </p>
          </div>
          <div className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
            {user?.role || "guest"}
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="mb-4 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendMessage(prompt)}
              disabled={loading}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-60"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="max-h-[26rem] min-h-[20rem] space-y-3 overflow-y-auto rounded-[24px] border border-slate-100 bg-slate-50/80 p-4">
          {messages.map((entry) => (
            <div
              key={entry.id}
              className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={[
                  "max-w-[85%] rounded-[22px] px-4 py-3 text-sm leading-6 shadow-sm",
                  entry.role === "user"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                ].join(" ")}
              >
                <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] opacity-70">
                  {entry.role === "user" ? "You" : "Assistant"}
                </p>
                <p className="whitespace-pre-wrap">{entry.content}</p>
              </div>
            </div>
          ))}

          {loading ? (
            <div className="flex justify-start">
              <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Assistant</p>
                Thinking...
              </div>
            </div>
          ) : null}

          <div ref={messagesEndRef} />
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder={placeholder}
            className="w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-slate-500">
              Tip: press Enter to send, Shift+Enter for a new line.
            </p>
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default Chatbot;

