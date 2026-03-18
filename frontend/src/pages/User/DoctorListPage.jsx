import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  Search, Filter, MapPin, Star, User, 
  ArrowRight, Loader2, ChevronRight, Home,
  Stethoscope, Award, Calendar, TrendingUp
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AssistantButton from '../../components/AssistantButton';
import { publicAPI } from '../../utils/api';

export default function DoctorListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';
  const initialSpecialty = searchParams.get('specialty') || '';
  const initialHospital = searchParams.get('hospital') || '';

  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);

  // inputTerm is bound to the input; searchTerm is applied after debounce or explicit search
  const [inputTerm, setInputTerm] = useState(initialQuery);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedSpec, setSelectedSpec] = useState(initialSpecialty);
  const [hospitalFilter, setHospitalFilter] = useState(initialHospital);

  // Sync URL params -> state when user navigates with query params
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const spec = searchParams.get('specialty') || '';
    const hosp = searchParams.get('hospital') || '';
    setInputTerm(q);
    setSearchTerm(q);
    setSelectedSpec(spec);
    setHospitalFilter(hosp);
  }, [searchParams]);

  // Debounce text input to avoid too many requests
  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(inputTerm.trim()), 350);
    return () => clearTimeout(t);
  }, [inputTerm]);

  // apply filters and also update URL so results are shareable
  const handleApplyFilters = () => {
    setSearchParams({ q: inputTerm || '', specialty: selectedSpec || '', hospital: hospitalFilter || '' });
    // setSearchTerm will update automatically via debounced effect; force immediate set for UX
    setSearchTerm(inputTerm.trim());
  };

  useEffect(() => {
    document.title = "Danh sách bác sĩ - clinic-booking";
    const fetchData = async () => {
      setLoading(true);
      try {
        const [docsRes, specsRes] = await Promise.all([
          publicAPI.getDoctors({ 
            q: searchTerm || undefined, 
            specialtyId: selectedSpec || undefined,
            hospitalId: hospitalFilter || undefined
          }),
          publicAPI.getSpecialties()
        ]);
        setDoctors(docsRes.data || []);
        setSpecialties(specsRes.data || []);
      } catch (err) {
        console.error('Lỗi tải danh sách bác sĩ:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchTerm, selectedSpec, hospitalFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
      <Header />
      
      {/* Hero Search Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 pt-12 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex items-center gap-2 text-sm text-blue-100 mb-8">
            <Link to="/" className="hover:text-white transition flex items-center gap-1">
              <Home size={14} /> Trang chủ
            </Link>
            <ChevronRight size={14} />
            <span className="text-white font-semibold">Danh sách bác sĩ</span>
          </nav>

          <div className="max-w-4xl mx-auto text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Tìm bác sĩ phù hợp với bạn
            </h1>
            <p className="text-blue-100 text-lg">
              Hơn {doctors.length} bác sĩ chuyên khoa hàng đầu sẵn sàng phục vụ
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-2 shadow-2xl">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    value={inputTerm}
                    onChange={(e) => setInputTerm(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilters(); }}
                    placeholder="Tìm theo tên bác sĩ, chuyên khoa..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base"
                  />
                </div>

                <select 
                  value={selectedSpec}
                  onChange={(e) => { setSelectedSpec(e.target.value); /* update URL immediately for shareable filter */ setSearchParams({ q: inputTerm || '', specialty: e.target.value || '', hospital: hospitalFilter || '' }); }}
                  className="bg-slate-50 border-0 px-6 py-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-w-[220px] font-medium"
                >
                  <option value="">Tất cả chuyên khoa</option>
                  {specialties.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                <button onClick={() => handleApplyFilters()} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg">
                  <Search size={20} />
                  <span className="hidden md:inline">Tìm kiếm</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Doctors Grid */}
      <section className="py-12 -mt-10">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-14 h-14 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-600 font-semibold text-lg">Đang tìm kiếm bác sĩ...</p>
             </div>
          ) : doctors.length === 0 ? (
             <div className="bg-white rounded-3xl p-16 text-center shadow-lg">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                   <User size={48} className="text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">Không tìm thấy bác sĩ</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-6">
                  Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </p>
                <button 
                  onClick={() => { setInputTerm(''); setSearchTerm(''); setSelectedSpec(''); setSearchParams({}); }}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg"
                >
                  Xóa bộ lọc
                </button>
             </div>
          ) : (
            <>
              {/* Results Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">
                    Kết quả tìm kiếm
                  </h2>
                  <p className="text-slate-500">
                    Tìm thấy <span className="font-bold text-blue-600">{doctors.length}</span> bác sĩ phù hợp
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Filter size={16} className="text-slate-400" />
                  <select className="bg-white border border-slate-200 px-4 py-2 rounded-lg outline-none font-medium">
                    <option>Đánh giá cao nhất</option>
                    <option>Kinh nghiệm nhiều nhất</option>
                    <option>Tên A-Z</option>
                  </select>
                </div>
              </div>

              {/* Doctors Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map(doc => (
                  <div key={doc.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all group">
                    {/* Card Header with gradient */}
                    <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-600 relative">
                      <div className="absolute -bottom-12 left-6">
                        <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg">
                          {doc.avatar ? (
                            <img src={doc.avatar} alt={doc.fullName} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                              <User size={40} />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-1">
                        <Star size={14} className="text-yellow-300 fill-yellow-300" />
                        <span className="text-white font-bold text-sm">{doc.ratingAvg || '5.0'}</span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="pt-16 p-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {doc.fullName.startsWith('BS') ? doc.fullName : `BS. ${doc.fullName}`}
                        </h3>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold">
                            {doc.specialty?.name || 'Đa khoa'}
                          </div>
                          <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                            <Award size={12} />
                            Verified
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                          <MapPin size={16} className="shrink-0 mt-0.5 text-slate-400" />
                          <span className="line-clamp-1">{doc.hospital?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Stethoscope size={16} className="text-slate-400" />
                          <span>{doc.experienceYears || '10+'} năm kinh nghiệm</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <TrendingUp size={16} className="text-slate-400" />
                          <span>{doc.ratingCount || 0} lượt đánh giá</span>
                        </div>
                      </div>

                      <Link 
                        to={`/doctors/${doc.id}`}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl flex items-center justify-center gap-2 font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg group-hover:shadow-xl"
                      >
                        <Calendar size={18} />
                        Đặt lịch ngay
                        <ArrowRight size={18} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <AssistantButton />
      <Footer />
    </div>
  );
}
