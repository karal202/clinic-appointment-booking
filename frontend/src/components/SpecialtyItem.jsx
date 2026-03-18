import { useNavigate } from 'react-router-dom';

export default function SpecialtyItem({ item }) {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/doctors?specialty=${item.id}`)}
      className="flex flex-col items-center bg-white p-6 rounded-3xl border border-gray-50 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/50 transition-all cursor-pointer group"
    >
      <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
        <span className="text-3xl filter group-hover:invert transition-all">
          {item.icon || '🩺'}
        </span>
      </div>
      <h4 className="text-sm font-bold text-gray-700 text-center group-hover:text-blue-600 transition-colors">
        {item.name}
      </h4>
    </div>
  );
}
