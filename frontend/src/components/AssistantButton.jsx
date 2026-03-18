import { MessageCircle } from 'lucide-react';

export default function AssistantButton() {
  return (
    <button 
      onClick={() => window.dispatchEvent(new Event("open-assistant-full"))}
      className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl shadow-blue-400/50 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group"
    >
      <MessageCircle size={32} />
      <span className="absolute right-20 bg-white text-gray-800 px-4 py-2 rounded-xl text-sm font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-100">
        Bạn cần hỗ trợ? 🩺
      </span>
    </button>
  );
}
