import { useState, useEffect } from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import { publicAPI } from '../utils/api';
import { Link } from 'react-router-dom';

export default function FacilitySection() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicAPI.getCenters()
      .then(res => setFacilities(res.data.slice(0, 4)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Cơ sở y tế liên kết</h2>
            <p className="text-gray-500 max-w-lg">Hệ thống bệnh viện và phòng khám đạt chuẩn, phủ khắp các tỉnh thành.</p>
          </div>
          <Link to="/hospitals" className="flex items-center gap-2 text-blue-600 font-bold hover:gap-3 transition-all">
            Xem tất cả <ArrowRight size={20} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[2rem] h-64 animate-pulse"></div>
            ))
          ) : (
            facilities.map(item => (
              <Link 
                key={item.id} 
                to={`/hospitals/${item.id}`}
                className="bg-white rounded-[2rem] overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all group block"
              >
                <div className="h-40 overflow-hidden relative">
                  <img 
                    src={item.imageUrl || `https://images.unsplash.com/photo-1586773860418-d319a221982?auto=format&fit=crop&q=80&w=1000`} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest bg-blue-600 px-2 py-0.5 rounded-full mb-1">
                      <MapPin size={10} /> {item.city || 'Việt Nam'}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-gray-800 mb-2 line-clamp-1">{item.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{item.address}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
