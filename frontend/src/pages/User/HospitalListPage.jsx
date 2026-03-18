import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Building, MapPin, Search, ArrowRight, 
  Loader2, ChevronRight, Home, Phone, Globe
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AssistantButton from '../../components/AssistantButton';
import { publicAPI } from '../../utils/api';

export default function HospitalListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';

  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputTerm, setInputTerm] = useState(initialQ);
  const [searchTerm, setSearchTerm] = useState(initialQ);

  useEffect(() => {
    document.title = "Cơ sở y tế liên kết - clinic-booking";
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await publicAPI.getCenters();
        setHospitals(res.data || []);
      } catch (err) {
        console.error('Lỗi tải danh sách bệnh viện:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Debounce inputTerm -> searchTerm for client-side filter
  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(inputTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [inputTerm]);

  // sync URL param -> input
  useEffect(() => {
    const q = searchParams.get('q') || '';
    setInputTerm(q);
    setSearchTerm(q);
  }, [searchParams]);

  const filteredHospitals = hospitals.filter(h => {
    const q = searchTerm.toLowerCase();
    return (
      (h.name || '').toLowerCase().includes(q) ||
      (h.address || '').toLowerCase().includes(q) ||
      (h.phone || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Search Header */}
      <section className="bg-slate-900 text-white pt-12 pb-24 relative overflow-hidden">
        {/* Animated circle */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] -mr-48 -mt-48"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
            <Link to="/" className="hover:text-blue-400 transition flex items-center gap-1">
              <Home size={14} /> Trang chủ
            </Link>
            <ChevronRight size={14} />
            <span className="text-white font-medium">Cơ sở y tế</span>
          </nav>

          <h1 className="text-4xl lg:text-5xl font-extrabold mb-6 uppercase tracking-tight">Hệ thống cơ sở y tế</h1>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl leading-relaxed">
            Kết nối với các bệnh viện và phòng khám uy tín trên toàn quốc, đảm bảo chất lượng phục vụ và quy trình chuyên nghiệp.
          </p>

          <div className="max-w-2xl relative">
            <input 
              type="text" 
              value={inputTerm}
              onChange={(e) => setInputTerm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setSearchParams({ q: inputTerm || '' }); }}
              placeholder="Tìm tên bệnh viện hoặc khu vực..."
              className="w-full pl-14 pr-6 py-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/30 transition-all text-lg text-white placeholder-slate-500"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
            <button onClick={() => setSearchParams({ q: inputTerm || '' })} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 px-4 py-2 rounded-lg text-white font-semibold hover:bg-white/20 transition">Tìm</button>
          </div>
        </div>
      </section>

      {/* Hospital List */}
      <section className="py-20 -mt-10 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Đang tải danh sách cơ sở...</p>
             </div>
          ) : filteredHospitals.length === 0 ? (
             <div className="bg-white rounded-3xl p-20 text-center border border-slate-200 shadow-xl shadow-slate-100/50">
                <Building className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Không tìm thấy cơ sở phù hợp</h3>
                <p className="text-slate-500">Vui lòng thử lại với từ khóa khác.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredHospitals.map(item => (
                <div key={item.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40 border border-slate-50 flex flex-col group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                  <div className="h-56 relative overflow-hidden">
                    <img 
                      src={item.imageUrl || `https://images.unsplash.com/photo-1586773860418-d319a221982?auto=format&fit=crop&q=80&w=1000`} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6">
                       <span className="inline-block px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg mb-2 shadow-lg">
                         Hợp tác chính thức
                       </span>
                       <h3 className="text-xl font-extrabold text-white uppercase tracking-tight">{item.name}</h3>
                    </div>
                  </div>
                  
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="space-y-4 mb-8">
                       <div className="flex items-start gap-3">
                         <MapPin size={18} className="text-blue-500 shrink-0 mt-0.5" />
                         <p className="text-slate-600 text-sm leading-relaxed">{item.address}</p>
                       </div>
                       <div className="flex items-center gap-3">
                         <Phone size={18} className="text-slate-400 shrink-0" />
                         <p className="text-slate-600 text-sm font-medium">{item.phone || '1900 1000'}</p>
                       </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50">
                       <Link 
                          to={`/hospitals/${item.id}`} 
                          className="text-slate-900 font-bold flex items-center gap-2 hover:text-blue-600 transition"
                        >
                          Chi tiết <ArrowRight size={18} />
                       </Link>
                       <Link 
                          to={`/doctors?hospital=${item.id}`} 
                          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                       >
                          Đặt lịch ngay
                       </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <AssistantButton />
      <Footer />
    </div>
  );
}
