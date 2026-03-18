import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User, Bot, Loader2, Sparkles, MessageCircle } from 'lucide-react';
import { publicAPI } from '../utils/api';
import ReactMarkdown from 'react-markdown';

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Xin chào! Tôi là trợ lý y tế thông minh của clinic-booking. Tôi có thể giúp gì cho bạn hôm nay?' }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-assistant-full', handleOpen);
    return () => window.removeEventListener('open-assistant-full', handleOpen);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const userMessage = message;
    setMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await publicAPI.askAssistant({
        message: userMessage,
        history: chatHistory.slice(-10)
      });

      setChatHistory(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Xin lỗi, tôi đang gặp chút sự cố kết nối. Vui lòng thử lại sau.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-8 w-[400px] h-[600px] bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden border border-blue-100 transition-all animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-5 text-white flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
            <Sparkles size={22} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Trợ lý AI</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="text-xs text-blue-100 font-medium tracking-wide">Đang trực tuyến</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="p-2 hover:bg-white/20 rounded-xl transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/50"
      >
        {chatHistory.map((item, index) => (
          <div 
            key={index} 
            className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`flex gap-3 max-w-[85%] ${item.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center shadow-sm ${
                item.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-100'
              }`}>
                {item.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                item.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
              }`}>
                <div className="markdown-content">
                  <ReactMarkdown>
                    {item.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-9 h-9 rounded-xl bg-white text-blue-600 border border-blue-100 flex items-center justify-center shadow-sm">
                <Bot size={18} />
              </div>
              <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-blue-300 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-blue-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-blue-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100">
        <style>{`
          .markdown-content p { margin-bottom: 0.5rem; }
          .markdown-content p:last-child { margin-bottom: 0; }
          .markdown-content strong { font-weight: 700; color: inherit; }
          .markdown-content a { color: #3b82f6; text-decoration: underline; font-weight: 600; }
          .markdown-content ul, .markdown-content ol { margin-left: 1.25rem; margin-bottom: 0.5rem; }
          .markdown-content li { list-style-type: disc; }
        `}</style>
        <div className="relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Bạn cần tư vấn bác sĩ hay chuyên khoa?"
            className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!message.trim() || loading}
            className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">
          Tư vấn của AI chỉ mang tính chất tham khảo.
        </p>
      </form>
    </div>
  );
}
