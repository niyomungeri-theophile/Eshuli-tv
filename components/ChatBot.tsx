
import React, { useState, useRef, useEffect } from 'react';
import { getGeminiResponse } from '../services/gemini';
import { Message } from '../types';
import { translations } from '../translations';

interface ChatBotProps {
  lang?: 'en' | 'rw';
}

const ChatBot: React.FC<ChatBotProps> = ({ lang = 'en' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const t = translations[lang];
  
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: lang === 'rw' ? "Muraho! Ndi AI ya Eshuli. Ngufashe iki uyu munsi?" : "Hello! I'm your Eshuli AI Assistant. How can I help you today?", timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const response = await getGeminiResponse(input);
    const aiMessage: Message = { role: 'model', text: response || 'Sorry, I failed to respond.', timestamp: new Date() };
    
    setMessages(prev => [...prev, aiMessage]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-[#111] border border-[#A3E635]/20 rounded-2xl w-80 md:w-96 shadow-2xl flex flex-col h-[500px] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#1a1a1a] p-4 flex justify-between items-center border-b border-[#A3E635]/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#A3E635] rounded-full flex items-center justify-center shadow-lg shadow-[#A3E635]/20">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm">{(t as any).ai_assistant}</h3>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setMessages([{ role: 'model', text: lang === 'rw' ? "Muraho! Ndi AI ya Eshuli. Ngufashe iki uyu munsi?" : "Hello! I'm your Eshuli AI Assistant. How can I help you today?", timestamp: new Date() }])}
                className="p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                title={(t as any).clear_chat}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
                </svg>
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-2 text-gray-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-all group"
                title={(t as any).close}
              >
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                  ? 'bg-[#A3E635] text-black rounded-tr-none shadow-lg shadow-[#A3E635]/10' 
                  : 'bg-[#1a1a1a] text-gray-200 border border-gray-800 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a1a] p-3 rounded-2xl rounded-tl-none border border-gray-800">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-[#A3E635] rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-[#A3E635] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-[#A3E635] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-[#A3E635]/10 bg-[#0a0a0a]">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={(t as any).ask_ai}
                className="flex-1 bg-[#111] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#A3E635]/50 transition-all placeholder:text-gray-600"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-[#A3E635] text-black p-2 rounded-xl hover:bg-[#bef264] transition-all disabled:opacity-50 shadow-lg shadow-[#A3E635]/10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-[#A3E635] text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-300 group relative"
        >
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black animate-pulse"></div>
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ChatBot;
