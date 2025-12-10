"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Send, X, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

const BUBBLE_DELAY_MS = 15000; // 15 seconds
const MAX_MESSAGES_PER_MINUTE = 5;

const QUICK_QUESTIONS = [
  "How unique is my fingerprint?",
  "What is canvas fingerprinting?",
  "How can I protect my privacy?",
  "Explain the Three-Lock system",
];

export function FingerprintAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Hi! I'm your fingerprint analysis assistant. Ask me anything about browser fingerprinting, privacy, or your scan results!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [timestamps, setTimestamps] = useState<number[]>([]);
  const [error, setError] = useState("");
  const bubbleTimer = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Show bubble after 15 seconds
  useEffect(() => {
    bubbleTimer.current = setTimeout(() => setShowBubble(true), BUBBLE_DELAY_MS);
    return () => {
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Rate limiting check
  const canSend = useMemo(() => {
    const now = Date.now();
    return (
      timestamps.filter((ts) => now - ts < 60_000).length < MAX_MESSAGES_PER_MINUTE
    );
  }, [timestamps]);

  const pushMessage = useCallback((role: "assistant" | "user", content: string) => {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role, content }]);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      if (!canSend) {
        setError("Rate limit: Maximum 5 messages per minute");
        return;
      }

      setError("");
      pushMessage("user", trimmed);
      setInput("");
      setIsThinking(true);
      setTimestamps((prev) => {
        const now = Date.now();
        const recent = prev.filter((ts) => now - ts < 60_000);
        return [...recent, now];
      });

      try {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: trimmed,
          }),
        });

        if (!response.ok) throw new Error("Request failed");

        const data = await response.json();
        pushMessage("assistant", data.message.content);
      } catch (error) {
        console.error(error);
        pushMessage(
          "assistant",
          "Sorry, I encountered an error. Please try again later."
        );
      } finally {
        setIsThinking(false);
      }
    },
    [canSend, pushMessage]
  );

  const handleToggle = () => {
    setIsOpen((current) => !current);
    setShowBubble(false);
  };

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
          onClick={handleToggle}
          aria-hidden="true"
        />
      )}

      {/* Chat container */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
        {/* Bubble tip */}
        {showBubble && !isOpen && (
          <div className="pointer-events-auto max-w-xs animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="group relative overflow-hidden rounded-2xl border border-indigo-200/50 bg-gradient-to-br from-white/95 via-indigo-50/90 to-purple-50/80 p-4 shadow-2xl backdrop-blur-xl dark:border-indigo-500/30 dark:from-slate-800/95 dark:via-indigo-900/40 dark:to-purple-900/30">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-400/20 to-purple-400/20 blur-2xl transition-transform duration-500 group-hover:scale-110" />
              <div className="relative">
                <div className="mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Need help with your fingerprint?
                  </p>
                </div>
                <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
                  I can explain your results and suggest privacy improvements!
                </p>
                <button
                  onClick={handleToggle}
                  className="group/btn flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 transition hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Start Chat
                  <Sparkles className="h-3 w-3 transition-transform duration-300 group-hover/btn:rotate-12" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat window */}
        {isOpen && (
          <div className="pointer-events-auto fixed inset-x-4 top-[10vh] z-50 mx-auto max-h-[80vh] w-full max-w-2xl animate-in zoom-in-95 fade-in duration-300 sm:inset-x-auto sm:right-6 sm:left-auto sm:top-[15vh] sm:max-h-[70vh] sm:w-[600px]">
            <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-indigo-200/50 bg-gradient-to-br from-white/98 via-indigo-50/95 to-purple-50/90 shadow-2xl backdrop-blur-xl dark:border-indigo-500/30 dark:from-slate-900/98 dark:via-indigo-950/95 dark:to-purple-950/90">
              {/* Header */}
              <div className="relative border-b border-indigo-200/50 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-6 py-4 dark:border-indigo-500/30">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        AI Assistant
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Fingerprint Analysis
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggle}
                    className="group rounded-full p-2 text-slate-400 transition hover:bg-white/50 hover:text-slate-900 dark:hover:bg-slate-800/50 dark:hover:text-white"
                    aria-label="Close chat"
                  >
                    <X className="h-5 w-5 transition-transform duration-200 group-hover:rotate-90" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.role === "assistant"
                        ? "animate-in slide-in-from-left-4 fade-in duration-300"
                        : "animate-in slide-in-from-right-4 fade-in duration-300 ml-auto max-w-[85%]"
                    }
                  >
                    <div
                      className={
                        message.role === "assistant"
                          ? "rounded-2xl rounded-tl-sm border border-indigo-200/50 bg-gradient-to-br from-white/90 to-indigo-50/80 p-4 shadow-sm backdrop-blur-sm dark:border-indigo-500/30 dark:from-slate-800/90 dark:to-indigo-900/40"
                          : "rounded-2xl rounded-tr-sm border border-purple-200/50 bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white shadow-lg"
                      }
                    >
                      {message.role === "assistant" && (
                        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          <Shield className="h-3 w-3" />
                          Assistant
                        </div>
                      )}
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {formatMessage(message.content)}
                      </div>
                    </div>
                  </div>
                ))}
                {isThinking && (
                  <div className="flex items-center gap-2 px-4 text-sm text-slate-500 dark:text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="border-t border-indigo-200/50 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 p-4 dark:border-indigo-500/30">
                <div className="space-y-3">
                  {/* Quick questions */}
                  <div className="flex flex-wrap gap-2">
                    {QUICK_QUESTIONS.map((question) => (
                      <button
                        key={question}
                        onClick={() => sendMessage(question)}
                        disabled={isThinking}
                        className="group rounded-full border border-indigo-200 bg-white/50 px-3 py-1.5 text-xs text-slate-700 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50 dark:border-indigo-500/30 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-indigo-400 dark:hover:bg-indigo-900/50 dark:hover:text-indigo-300"
                      >
                        {question}
                      </button>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage(input);
                        }
                      }}
                      placeholder="Ask about your fingerprint..."
                      disabled={isThinking}
                      className="flex-1 rounded-full border-indigo-200 bg-white/80 backdrop-blur-sm focus:border-indigo-400 focus:ring-indigo-400 dark:border-indigo-500/30 dark:bg-slate-800/80"
                    />
                    <Button
                      onClick={() => sendMessage(input)}
                      disabled={isThinking || !input.trim()}
                      size="icon"
                      className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg transition hover:shadow-xl disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  {error && (
                    <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating button */}
        <button
          onClick={handleToggle}
          className={`pointer-events-auto group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-indigo-500/50 ${
            !isOpen && "animate-pulse"
          }`}
          aria-label={isOpen ? "Close chat" : "Open chat"}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/0 via-white/20 to-purple-400/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <Sparkles className="relative h-6 w-6 transition-transform duration-300 group-hover:rotate-12" />
        </button>
      </div>
    </>
  );
}

function formatMessage(content: string): React.ReactNode {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      elements.push(<br key={`br-${i}`} />);
      continue;
    }

    // Check for bullet points
    if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
      elements.push(
        <div key={`bullet-${i}`} className="my-1 flex gap-2">
          <span className="shrink-0 font-bold">•</span>
          <span>{line.replace(/^[•-]\s*/, "")}</span>
        </div>
      );
      continue;
    }

    // Check for numbered lists
    const listMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (listMatch) {
      const [, num, text] = listMatch;
      elements.push(
        <div key={`list-${i}`} className="my-1 flex gap-2">
          <span className="shrink-0 font-semibold">{num}.</span>
          <span>{text}</span>
        </div>
      );
      continue;
    }

    // Check for bold sections (text between **)
    if (line.includes("**")) {
      const parts = line.split(/\*\*(.+?)\*\*/g);
      elements.push(
        <p key={`p-${i}`} className="my-1">
          {parts.map((part, j) =>
            j % 2 === 0 ? part : <strong key={`bold-${i}-${j}`}>{part}</strong>
          )}
        </p>
      );
      continue;
    }

    // Regular line
    elements.push(
      <p key={`p-${i}`} className="my-1">
        {line}
      </p>
    );
  }

  return <>{elements}</>;
}
