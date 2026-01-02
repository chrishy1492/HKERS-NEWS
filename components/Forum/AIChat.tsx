
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Bot, Loader2, Info } from 'lucide-react';
import { generateLionRockInsight } from '../../services/gemini';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

const AIChat: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Hello! I am the Lion Rock Assistant. How can I help you today? I can provide migration advice, explain HK culture, or just chat! 🦁' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    const botResponse = await generateLionRockInsight(userMsg);
    setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
    setIsTyping(false);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col p-4">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-t-3xl text-white shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Lion Rock Assistant</h2>
            <div className="flex items-center space-x-2 text-blue-100 text-xs">
              <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="font-semibold uppercase tracking-wider">Powered by Gemini 3 Pro</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 bg-white border-x border-slate-200 overflow-y-auto p-6 space-y-6"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-blue-600 ml-3' : 'bg-slate-100 mr-3'}`}>
                {m.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-slate-600" />}
              </div>
              <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none'}`}>
                {m.text}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3">
                <Loader2 size={16} className="text-slate-400 animate-spin" />
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex space-x-1">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 border border-t-0 border-slate-200 rounded-b-3xl shadow-lg">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input 
            type="text"
            className="w-full bg-slate-100 border-none rounded-2xl px-6 py-4 pr-16 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
            placeholder="Ask about migration, community info, or just say hi..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-300 transition-all shadow-md active:scale-95"
          >
            <Send size={20} />
          </button>
        </form>
        <p className="text-[10px] text-center text-slate-400 mt-2 uppercase tracking-widest font-bold">
          AI may provide inaccurate info. Double check important advice.
        </p>
      </div>
    </div>
  );
};

export default AIChat;
