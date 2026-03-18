import { useNavigate } from 'react-router-dom';

export default function ServiceCard({ to, icon, title, desc, onClick }) {
  const navigate = useNavigate();
  
  const handleClick = (e) => {
    if (onClick) return onClick(e);
    if (to) navigate(to);
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-200/40 transition-all cursor-pointer group transform hover:-translate-y-2"
    >
      <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
        {title}
      </h3>
      <p className="text-gray-500 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
