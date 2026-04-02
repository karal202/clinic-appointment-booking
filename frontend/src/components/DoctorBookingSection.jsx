import { useState, useEffect } from 'react';
import { User, Star, ArrowRight } from 'lucide-react';
import { publicAPI } from '../utils/api';
import { BASE_URL } from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function DoctorBookingSection() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicAPI.getDoctors({ limit: 4 })
      .then(res => setDoctors(res.data.slice(0, 4)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Bác sĩ nổi bật</h2>
            <p className="text-gray-500 max-w-lg">Đặt lịch khám với các chuyên gia hàng đầu, giàu kinh nghiệm.</p>
          </div>
          <Link to="/doctors" className="flex items-center gap-2 text-blue-600 font-bold hover:gap-3 transition-all">
            Tìm bác sĩ <ArrowRight size={20} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-slate-50 rounded-[2rem] h-80 animate-pulse"></div>
            ))
          ) : (
            doctors.map(doc => (
              <div key={doc.id} className="bg-slate-50 rounded-[2rem] p-6 border border-white hover:border-blue-100 hover:shadow-2xl hover:bg-white transition-all group">
                <div className="relative mb-6">
                  <div className="w-24 h-24 mx-auto rounded-3xl bg-blue-100 overflow-hidden">
                    {doc.avatar ? (
                      <img 
                        src={`/images/doctors/${doc.avatar.substring(doc.avatar.lastIndexOf('-') + 1)}`} 
                        alt={doc.fullName} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = doc.avatar.startsWith('http') ? doc.avatar : `${BASE_URL}${doc.avatar}`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-blue-400">
                        <User size={40} />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 right-1/2 translate-x-12 bg-white px-2 py-1 rounded-lg shadow-md flex items-center gap-1">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-gray-700">{doc.ratingAvg || '5.0'}</span>
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{doc.fullName}</h3>
                  <p className="text-xs text-blue-500 font-bold uppercase tracking-widest mb-4 opacity-70">
                    {doc.specialty?.name || 'Đa khoa'}
                  </p>
                  
                  <Link 
                    to={`/doctors/${doc.id}`} 
                    className="inline-block w-full py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:bg-blue-600 hover:text-white hover:border-transparent transition-all shadow-sm"
                  >
                    Đặt lịch khám
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
