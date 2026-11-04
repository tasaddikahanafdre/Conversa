"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  Loader2,
  GraduationCap,
  MessageSquare,
  Package,
  CheckCircle2,
  RefreshCw,
  Image as ImageIcon,
  X,
  Paperclip,
} from "lucide-react";

interface TestMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
  isTrained?: boolean;
  imageBase64?: string | null;
  mediaUrl?: string | null;
  imageUrls?: string[] | null;
}

interface ProductItem {
  id: string;
  title: string;
  price: number;
  stock_quantity: number;
}

export default function TestArenaPage() {
  const [mode, setMode] = useState<"chat" | "train">("chat");
  const [messages, setMessages] = useState<TestMessage[]>([
    {
      id: "1",
      sender: "bot",
      text: "Assalamu Alaikum! Conversa-te apnake shagotom. Amader smart gadgets, delivery charge ba order somporke jante chaile bolun! 😊",
      time: "Just now",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ base64: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeProducts, setActiveProducts] = useState<ProductItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const customerPrompts = [
    "Magical Garage Key Hanger er price koto?",
    "XO1 Auto Charge Separator er price koto?",
    "Delivery charge koto Dhaka baire?",
    "Super Bass Wireless Earbuds er battery kemon?",
  ];

  const trainingPrompts = [
    "We sell Smart Ring Pro for 2200 taka, 20 pieces in stock",
    "Change Magical Garage Key Hanger price to 1250 taka",
    "Delivery charge inside Dhaka is 70 tk, outside Dhaka is 130 tk",
    "We are closed on Friday, open Sat-Thu 10am to 8pm",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    fetchActiveProducts();
  }, []);

  const fetchActiveProducts = async () => {
    try {
      setLoadingCatalog(true);
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setActiveProducts(data.products || []);
      }
    } catch (err) {
      console.warn("Could not load products for sidebar:", err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAttachedImage({
        base64: result,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if ((!text.trim() && !attachedImage) || isTyping) return;

    const currentImage = attachedImage;
    const userMsg: TestMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: text.trim() || "Ei product-tar details ar dam koto?",
      imageBase64: currentImage?.base64,
      time: "Now",
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInput("");
    setAttachedImage(null);
    setIsTyping(true);

    try {
      if (mode === "train" || /^(teach:|train:|remember:|we sell|we now sell|notun product)/i.test(text.trim())) {
        // Send to Training endpoint
        const trainRes = await fetch("/api/ai/train", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.replace(/^(teach:|train:|remember:)/i, "").trim(),
          }),
        });

        const trainData = await trainRes.json();
        const botReply =
          trainData.reply ||
          (trainData.success
            ? "✅ তথ্যটি সফলভাবে সংরক্ষিত হয়েছে এবং AI ট্রেইন করা হয়েছে!"
            : "Dukhito, training complete hoyni.");

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "bot",
            text: botReply,
            time: "Just now",
            isTrained: true,
          },
        ]);

        // Refresh live products list
        fetchActiveProducts();
      } else {
        // Customer simulation mode with Multimodal Vision support
        const res = await fetch("/api/chat/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              sender: m.sender,
              text: m.text,
              imageBase64: m.imageBase64 || null,
            })),
          }),
        });

        const data = await res.json();
        const botResponse =
          data.text ||
          "Alhamdulillah! Conversa-te apnake shagotom. Kono kichu janar thakle bolun, ami sahajjo korchi!";

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "bot",
            text: botResponse,
            time: "Just now",
            isTrained: data.trained,
            mediaUrl: data.mediaUrl || null,
            imageUrls: data.imageUrls || (data.mediaUrl ? [data.mediaUrl] : null),
          },
        ]);

        if (data.trained) {
          fetchActiveProducts();
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: "Dukhito, connection problem hoyeche. Doya kore abar cheshta korun.",
          time: "Just now",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: "1",
        sender: "bot",
        text:
          mode === "train"
            ? "Assalamu Alaikum! Ami apnar Conversa AI. Notun kono product, dam, delivery policy ba shop details amake shudhu chat kore bolun, ami shonge shonge shob shikhbo! 🧠"
            : "Assalamu Alaikum! Conversa-te apnake shagotom. Amader smart gadgets, delivery charge ba order somporke jante chaile bolun! 😊",
        time: "Just now",
      },
    ]);
  };

  const handleModeChange = (newMode: "chat" | "train") => {
    setMode(newMode);
    if (newMode === "train") {
      setMessages([
        {
          id: Date.now().toString(),
          sender: "bot",
          text: "🧠 AI Training Mode Active: Type anything to teach me new products, prices, or store policies in plain chat! (e.g. 'We now sell X for ৳500')",
          time: "Just now",
          isTrained: true,
        },
      ]);
    } else {
      setMessages([
        {
          id: Date.now().toString(),
          sender: "bot",
          text: "💬 Customer Simulation Mode Active: Ask me any questions just like a customer on Facebook Messenger!",
          time: "Just now",
        },
      ]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Live Test Arena & AI Trainer
            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20">
              Gemini 3.5 Flash
            </span>
          </h1>
          <p className="text-sm text-slate-400">
            Simulate customer chats or train your AI directly by chatting in simple words.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl border border-slate-800 bg-slate-900/80 p-1">
            <button
              onClick={() => handleModeChange("chat")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                mode === "chat"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Customer Chat
            </button>
            <button
              onClick={() => handleModeChange("train")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                mode === "train"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Train AI via Chat
            </button>
          </div>

          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Side: Test Controls, Training Prompts & Active Catalog */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mode Info Box */}
          {mode === "train" ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Interactive AI Training Mode</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Train your AI without touching databases or complex forms! Just type any product, price update, or policy below, and Conversa will immediately learn and save it.
              </p>

              <div className="space-y-2 pt-1">
                <div className="text-xs font-semibold text-emerald-300">Quick Training Examples:</div>
                <div className="flex flex-col gap-2">
                  {trainingPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      disabled={isTyping}
                      className="flex items-center justify-between rounded-xl border border-emerald-900/50 bg-slate-900/80 p-3 text-left text-xs text-slate-200 transition hover:border-emerald-500 hover:text-white disabled:opacity-50"
                    >
                      <span>{prompt}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-emerald-400 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Live Customer Simulation</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Queries your real Google Gemini model with active catalog products, prices, and delivery terms. Ask any question in Bangla, English, or Banglish.
              </p>

              <div className="space-y-2 pt-1">
                <div className="text-xs font-semibold text-slate-300">Quick Customer Prompts:</div>
                <div className="flex flex-col gap-2">
                  {customerPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      disabled={isTyping}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-left text-xs text-slate-300 transition hover:border-blue-500 hover:text-white disabled:opacity-50"
                    >
                      <span>{prompt}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-500 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active Products List Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Products Known to AI ({activeProducts.length})
                </h4>
              </div>
              <button
                onClick={fetchActiveProducts}
                disabled={loadingCatalog}
                className="text-slate-400 hover:text-white transition"
                title="Refresh products"
              >
                <RefreshCw className={`h-3 w-3 ${loadingCatalog ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {activeProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/40 px-3 py-2 text-xs"
                >
                  <span className="font-medium text-slate-200 truncate max-w-[200px]" title={p.title}>
                    {p.title}
                  </span>
                  <span className="font-semibold text-emerald-400 shrink-0 ml-2">
                    ৳{p.price}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 space-y-1">
              <div>• Inside Dhaka Delivery: ৳70 (1-2 days)</div>
              <div>• Outside Dhaka Delivery: ৳130 (2-3 days)</div>
              <div>• Cash on Delivery (COD) supported</div>
            </div>
          </div>
        </div>

        {/* Right Side: Mobile Phone Device Mockup */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-[400px] rounded-[40px] border-4 border-slate-800 bg-slate-950 p-3 shadow-2xl shadow-blue-950/20">
            {/* Phone Bezel Top Notch */}
            <div className="mx-auto h-4 w-32 rounded-b-xl bg-slate-800 mb-2 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-slate-900 mr-2" />
              <div className="h-1.5 w-8 rounded-full bg-slate-900" />
            </div>

            {/* Messenger Screen Area */}
            <div className="flex h-[580px] flex-col rounded-[28px] border border-slate-800/80 bg-slate-900/90 overflow-hidden">
              {/* Messenger Header */}
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-white font-bold text-xs ${
                        mode === "train" ? "bg-emerald-600" : "bg-blue-600"
                      }`}
                    >
                      {mode === "train" ? <GraduationCap className="h-4 w-4" /> : "C"}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-emerald-500" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white leading-tight flex items-center gap-1.5">
                      {mode === "train" ? "Conversa AI Trainer" : "Conversa"}
                      {mode === "train" && (
                        <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[9px] font-semibold text-emerald-400">
                          Teach Mode
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {mode === "train"
                        ? "Chat to teach new products & rules"
                        : "Conversa AI • Typically replies instantly"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Message Bubble Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                        m.sender === "user"
                          ? mode === "train"
                            ? "bg-emerald-600 text-white rounded-br-none"
                            : "bg-blue-600 text-white rounded-br-none"
                          : m.isTrained
                          ? "bg-emerald-950/60 text-emerald-100 rounded-bl-none border border-emerald-700/60 whitespace-pre-wrap"
                          : "bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/60 whitespace-pre-wrap"
                      }`}
                    >
                      {m.isTrained && m.sender === "bot" && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 mb-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>AI Trained & Saved</span>
                        </div>
                      )}
                      {m.imageUrls && m.imageUrls.length > 1 ? (
                        <div className="grid grid-cols-2 gap-1.5 mb-2">
                          {m.imageUrls.map((imgUrl, imgIdx) => (
                            <img
                              key={imgIdx}
                              src={imgUrl}
                              alt={`Product photo ${imgIdx + 1}`}
                              className="h-28 w-full rounded-lg object-cover border border-white/20 bg-slate-900"
                            />
                          ))}
                        </div>
                      ) : (m.imageBase64 || m.mediaUrl) ? (
                        <img
                          src={m.imageBase64 || m.mediaUrl || ""}
                          alt="Customer product photo"
                          className="max-h-44 w-full rounded-xl mb-1.5 object-cover border border-white/20"
                        />
                      ) : null}
                      {m.text}
                      <div
                        className={`text-[9px] mt-1 ${
                          m.sender === "user"
                            ? mode === "train"
                              ? "text-emerald-200 text-right"
                              : "text-blue-200 text-right"
                            : "text-slate-400"
                        }`}
                      >
                        {m.time}
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div
                      className={`rounded-2xl rounded-bl-none border px-3.5 py-2.5 ${
                        mode === "train"
                          ? "border-emerald-700/60 bg-emerald-950/40"
                          : "border-slate-700/60 bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:-0.3s] ${
                            mode === "train" ? "bg-emerald-400" : "bg-blue-400"
                          }`}
                        />
                        <div
                          className={`h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:-0.15s] ${
                            mode === "train" ? "bg-emerald-400" : "bg-blue-400"
                          }`}
                        />
                        <div
                          className={`h-1.5 w-1.5 animate-bounce rounded-full ${
                            mode === "train" ? "bg-emerald-400" : "bg-blue-400"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="border-t border-slate-800 bg-slate-950 p-2.5 space-y-2">
                {attachedImage && (
                  <div className="flex items-center justify-between rounded-xl border border-blue-500/30 bg-blue-950/40 p-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={attachedImage.base64}
                        alt="Attached product"
                        className="h-10 w-10 rounded-lg object-cover border border-blue-500/40"
                      />
                      <div className="text-[11px] text-blue-200">
                        <span className="font-semibold block truncate max-w-[180px]">
                          {attachedImage.name}
                        </span>
                        <span className="text-[10px] text-blue-400">AI will inspect this photo</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedImage(null)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isTyping}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
                    title="Send customer photo of product"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </button>

                  <input
                    type="text"
                    placeholder={
                      mode === "train"
                        ? "Teach: e.g. We sell Smart Ring for 1500 tk..."
                        : attachedImage
                        ? "Ask about this photo (e.g. Price koto?)..."
                        : "Type message or attach product photo..."
                    }
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isTyping}
                    className={`flex-1 rounded-full border bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none ${
                      mode === "train"
                        ? "border-emerald-700 focus:border-emerald-500"
                        : "border-slate-700 focus:border-blue-500"
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={isTyping || (!input.trim() && !attachedImage)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-white transition disabled:opacity-40 shrink-0 ${
                      mode === "train"
                        ? "bg-emerald-600 hover:bg-emerald-500"
                        : "bg-blue-600 hover:bg-blue-500"
                    }`}
                  >
                    {isTyping ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
