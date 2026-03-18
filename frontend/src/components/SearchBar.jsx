import { Search } from 'lucide-react';

export default function SearchBar({ onSearch }) {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <input
        type="text"
        placeholder="Tìm chuyên khoa, bác sĩ, bệnh viện..."
        className="w-full pl-14 pr-6 py-5 bg-white rounded-2xl shadow-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all text-lg text-gray-700 placeholder-gray-400 border border-gray-100"
        onChange={(e) => onSearch?.(e.target.value)}
      />
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500">
        <Search size={28} />
      </div>
    </div>
  );
}
