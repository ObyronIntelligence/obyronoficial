"use client";

import React, { useState } from "react";
import { Send } from "lucide-react";

export function NeuralTerminal() {
  const [messages, setMessages] = useState<{role: "user" | "system", content: string}[]>([
    { role: "system", content: "Sistema Obyron Neural Inicializado. Aguardando input..." }
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    
    const userMsg = { role: "user" as const, content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsProcessing(true);
    
    try {
      // Endpoint que conecta com ObyronOrchestrator e ObsidianMemory (Fase A e B)
      const res = await fetch("/api/neural", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMsg.content })
      });
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: "system", content: data.reply || "Ação concluída." }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "system", content: "ERRO DE CONEXÃO CORE." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[500px] w-96 flex-col rounded-xl border border-white/20 bg-black/90 shadow-[0_0_30px_rgba(138,43,226,0.15)] backdrop-blur-md">
      
      {/* Header */}
      <div className="p-4 border-b border-white/20 text-white font-bold tracking-widest flex items-center gap-2">
         <span className="text-[#8A2BE2] text-xl">~</span> Obyron Terminal
      </div>
      
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`text-sm leading-relaxed ${m.role === "user" ? "text-white/70" : "text-white"}`}>
            <span className="text-[#8A2BE2] mr-2 font-bold">{m.role === "user" ? ">" : "Obyron:"}</span>
            {m.content}
          </div>
        ))}
        {isProcessing && (
          <div className="text-sm text-white/50 animate-pulse">
            <span className="text-[#8A2BE2] mr-2 font-bold">Obyron:</span> Processando na rede neural...
          </div>
        )}
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-white/20 flex gap-2 items-center">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isProcessing}
          className="flex-1 bg-transparent text-white outline-none placeholder-white/30 text-sm"
          placeholder="Execute comando ou pergunte..."
        />
        <button 
          onClick={handleSend} 
          disabled={isProcessing || !input.trim()}
          className="text-white/50 hover:text-white transition-colors disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
