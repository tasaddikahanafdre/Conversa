"use client";

import { useState, useRef, useEffect } from "react";
import {
  Smartphone,
  Send,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  Share2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

interface TestMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
}

export default function TestArenaPage() {
  const [messages, setMessages] = useState<TestMessage[]>([
    {
      id: "1",
      sender: "bot",
      text: "Assalamu Alaikum! Conversa Fashion e apnake shagotom. Ajke apnake kivabe shahajjo korte pari?",
      time: "Just now",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    "Cotton T-shirt er price koto?",
    "Delivery charge koto Dhaka baire?",
    "Size fit na hole ki exchange kora jabe?",
    "Ami 1ta Panjabi order korte chai",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg: TestMessage = {
      id: Date.now().toString(),
      sender: "user",
      text,
      time: "Now",
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    // Simulate Conversa AI Engine response
    setTimeout(() => {
      let botResponse = "Ji, amader product and delivery details shomporke janate pari. Apnar kisu janar thakle bolun!";

      const lower = text.toLowerCase();
      if (lower.includes("price") || lower.includes("koto") || lower.includes("dam") || lower.includes("t-shirt") || lower.includes("shirt")) {
        botResponse = "Amader Premium Heavyweight Cotton T-Shirt er dam matro ৳ 750! Stock e size M, L, XL available ache. Apnar kon size ta lagbe?";
      } else if (lower.includes("delivery") || lower.includes("charge")) {
        botResponse = "Amader delivery charge Dhaka city te ৳ 70 ebong Dhaka baire ৳ 130. 2-3 diner moddhe cash on delivery te delivery peye jaben.";
      } else if (lower.includes("exchange") || lower.includes("return")) {
        botResponse = "Haa, oboshoy! Product pawar 7 diner moddhe size ba kono defect thakle amra bina sholpe exchange kore dei.";
      } else if (lower.includes("order") || lower.includes("panjabi")) {
        botResponse = "Order confirm korte apnar (1) Shompurno Naam, (2) Mobile Number, (3) Delivery Address ar (4) Panjabi Size ta janaben please. Amra cash on delivery te pathiye dibo!";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: botResponse,
          time: "Just now",
        },
      ]);
      setIsTyping(false);
    }, 1200);
  };

  const handleClear = () => {
    setMessages([
      {
        id: "1",
        sender: "bot",
        text: "Assalamu Alaikum! Conversa Fashion e apnake shagotom. Ajke apnake kivabe shahajjo korte pari?",
        time: "Just now",
      },
    ]);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Live Test Arena
            </h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
              Interactive Simulator
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Test how your AI agent talks to your customers before activating live Facebook automation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Chat
          </button>
        </div>
      </div>

      {/* Main Split Layout: Prompt Suggestions & Info on Left, Phone on Right */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Left Column: Quick Test Prompts & Agent Status */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Suggested Test Inquiries</h3>
            </div>
            <p className="text-xs text-slate-400">
              Click any sample prompt below to simulate a real Bangladeshi buyer chatting with your page:
            </p>

            <div className="space-y-2">
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="w-full text-left rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs text-slate-300 transition hover:border-blue-500/50 hover:bg-slate-900 hover:text-white flex items-center justify-between group"
                >
                  <span>&ldquo;{prompt}&rdquo;</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-400 transition" />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
              Active Knowledge Loaded
            </div>
            <ul className="text-xs text-slate-400 space-y-1.5 pl-1">
              <li>• Delivery Dhaka: ৳ 70 | Outside: ৳ 130</li>
              <li>• Products: Cotton T-Shirt (৳ 750), Panjabi (৳ 1,850)</li>
              <li>• Style: Banglish (Conversational)</li>
              <li>• Model: Gemini 1.5 Flash (Latency ~0.8s)</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Simulated Mobile Phone Frame */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="relative w-full max-w-[380px] rounded-[44px] border-[8px] border-slate-800 bg-slate-950 p-2 shadow-2xl shadow-blue-900/10">
            {/* Phone Top Notch / Speaker */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 h-4 w-28 rounded-full bg-slate-800 z-10" />

            {/* Phone Screen */}
            <div className="flex h-[580px] flex-col rounded-[34px] bg-slate-900 overflow-hidden">
              {/* Phone Header */}
              <div className="border-b border-slate-800 bg-slate-950 px-4 pt-8 pb-3 flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Maya • Conversa Bot</div>
                  <div className="text-[10px] text-emerald-400">Typically replies instantly</div>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        m.sender === "user"
                          ? "bg-blue-600 text-white rounded-br-xs"
                          : "bg-slate-800 text-slate-200 rounded-bl-xs border border-slate-700/60"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-slate-800 px-4 py-2 text-xs text-slate-400 border border-slate-700/60 flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" />
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]" />
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Phone Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="border-t border-slate-800 bg-slate-950 p-2.5 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message as customer..."
                  className="flex-1 rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-500 disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
