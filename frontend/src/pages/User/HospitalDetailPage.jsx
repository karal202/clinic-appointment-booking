import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Building, MapPin, Phone, Globe, Users, 
  ChevronRight, Home, Star, ArrowRight,
  Shield, CheckCircle, Info, Loader2, ArrowLeft,
  Mail, Calendar, Clock, User
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AssistantButton from '../../components/AssistantButton';
import { publicAPI } from '../../utils/api';
import toast from 'react-hot-toast';

export default function HospitalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [hospRes, docsRes] = await Promise.all([
          publicAPI.getHospitalById(id),
          publicAPI.getDoctorsByHospital(id)
        ]);
        setHospital(hospRes.data);
        setDoctors(docsRes.data || []);
        document.title = `${hospRes.data.name} - clinic-booking`;
      } catch (err) {
        console.error('Lỗi tải thông tin bệnh viện:', err);
        toast.error('Không tìm thấy cơ sở y tế');
        navigate('/hospitals');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  if (loading) return (
     <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
     </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Banner Header */}
      <section className="relative h-[400px] overflow-hidden">
         <img 
            src={hospital?.imageUrl || `https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&auto=format&fit=crop&q=80`} 
            alt={hospital?.name} 
            className="w-full h-full object-cover"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
         <div className="absolute inset-0 bg-blue-900/10 backdrop-blur-[2px]"></div>
         
         <div className="absolute bottom-12 left-0 w-full">
            <div className="max-w-7xl mx-auto px-6">
                <nav className="flex items-center gap-2 text-sm text-slate-300 mb-6 opacity-80">
                  <Link to="/" className="hover:text-white transition flex items-center gap-1">
                    <Home size={14} /> Trang chủ
                  </Link>
                  <ChevronRight size={14} />
                  <Link to="/hospitals" className="hover:text-white transition">Cơ sở y tế</Link>
                  <ChevronRight size={14} />
                  <span className="text-white font-medium">{hospital?.name}</span>
                </nav>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                   <div className="flex-1">
                      <div className="inline-flex items-center gap-2 bg-blue-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-lg uppercase tracking-widest mb-4 shadow-xl">
                         Cơ sở đối tác chiến lược
                      </div>
                      <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4 uppercase tracking-tight">
                        {hospital?.name}
                      </h1>
                      <div className="flex flex-wrap items-center gap-6 text-slate-200">
                         <div className="flex items-center gap-2">
                            <MapPin size={18} className="text-blue-400" />
                            <span className="text-sm font-medium">{hospital?.address}</span>
                         </div>
                         <div className="flex items-center gap-2 border-l border-white/20 pl-6 hidden sm:flex">
                            <Users size={18} className="text-blue-400" />
                            <span className="text-sm font-medium">{doctors.length} Bác sĩ chuyên khoa</span>
                         </div>
                      </div>
                   </div>

                   <button 
                      onClick={() => {
                        const el = document.getElementById('doctors-section');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-extrabold hover:bg-blue-50 transition shadow-2xl shadow-black/20 flex items-center gap-3 uppercase tracking-widest text-sm"
                    >
                      Đặt lịch ngay <ArrowRight size={20} className="text-blue-600" />
                   </button>
                </div>
            </div>
         </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-slate-50">
         <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
               {/* Left: General Info */}
               <div className="lg:col-span-2 space-y-12">
                  <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                     <h2 className="text-2xl font-extrabold text-slate-900 mb-8 uppercase tracking-tight flex items-center gap-3">
                        <Info className="text-blue-600" /> Giới thiệu chung
                     </h2>
                     <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-p:text-slate-600">
                        <p>
                           {hospital?.description || "Hệ thống Bệnh viện/Phòng khám là một trong những cơ sở y tế tư nhân hàng đầu Việt Nam, được đầu tư trang thiết bị hiện đại bậc nhất thế giới cùng đội ngũ Giáo sư, Tiến sĩ, Bác sĩ chuyên khoa giàu kinh nghiệm."}
                        </p>
                        <p className="mt-4">
                           Chúng tôi cam kết mang đến dịch vụ chăm sóc sức khỏe toàn diện, lấy bệnh nhân làm trung tâm, kết hợp giữa phác đồ điều trị chuẩn quốc tế và tinh thần phục vụ tận tâm. Cơ sở sở hữu cơ sở hạ tầng đạt chuẩn khách sạn 5 sao, giúp bệnh nhân cảm thấy thoải mái và an tâm trong suốt quá trình thăm khám.
                        </p>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 pt-12 border-t border-slate-100">
                        <div className="flex items-start gap-4">
                           <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                              <Shield size={24} />
                           </div>
                           <div>
                              <h4 className="font-bold text-slate-800">Chất lượng Quốc tế</h4>
                              <p className="text-xs text-slate-500 mt-1">Đạt chứng chỉ JCI uy tín toàn cầu về an toàn người bệnh.</p>
                           </div>
                        </div>
                        <div className="flex items-start gap-4">
                           <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                              <CheckCircle size={24} />
                           </div>
                           <div>
                              <h4 className="font-bold text-slate-800">Dịch vụ 24/7</h4>
                              <p className="text-xs text-slate-500 mt-1">Hệ thống cấp cứu và tư vấn hoạt động xuyên suốt 24h.</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Doctors List Segment */}
                  <div id="doctors-section" className="space-y-8 scroll-mt-28">
                     <div className="flex justify-between items-end">
                        <div>
                           <h2 className="text-2xl font-extrabold text-slate-900 mb-2 uppercase tracking-tight">Đội ngũ Bác sĩ tiêu biểu</h2>
                           <p className="text-slate-500 text-sm">Vui lòng chọn bác sĩ để xem lịch trống và đặt hẹn.</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {doctors.map(doc => (
                           <div key={doc.id} className="bg-white rounded-3xl p-6 border border-slate-100 hover:border-blue-200 hover:shadow-2xl transition-all flex gap-6 group">
                              <div className="w-24 h-24 rounded-2xl bg-slate-100 shrink-0 overflow-hidden border-2 border-white shadow-sm">
                                 {doc.avatar ? (
                                    <img 
                                      src={`/images/doctors/${doc.avatar.substring(doc.avatar.lastIndexOf('-') + 1)}`} 
                                      alt={doc.fullName} 
                                      className="w-full h-full object-cover" 
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = doc.avatar.startsWith('http') ? doc.avatar : `https://clinic-appointment-booking-26x8.onrender.com${doc.avatar}`;
                                      }}
                                    />
                                 ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                       <User size={40} />
                                    </div>
                                 )}
                              </div>
                              <div className="flex-1">
                                 <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">{doc.specialty?.name || 'Khoa Nội'}</p>
                                 <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors uppercase tracking-tight line-clamp-1">
                                   {doc.fullName}
                                 </h3>
                                 <div className="flex items-center gap-1 mb-4">
                                    <Star size={12} className="text-amber-400 fill-amber-400" />
                                    <span className="text-xs font-bold text-slate-700">{doc.ratingAvg || '5.0'}</span>
                                    <div className="h-1 w-1 bg-slate-300 rounded-full mx-2"></div>
                                    <span className="text-xs text-slate-400">BS.CKII - 15 năm KN</span>
                                 </div>
                                 <Link 
                                    to={`/doctors/${doc.id}`}
                                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 border-b-2 border-blue-600 pb-0.5 hover:text-blue-600 transition uppercase tracking-widest"
                                 >
                                    Xem lịch & Đặt khám <ChevronRight size={14} />
                                 </Link>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Right: Contact & Action Sidebar */}
               <div className="space-y-8">
                  <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-28">
                     <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3 uppercase tracking-tight">
                        <Phone size={20} className="text-blue-600" /> Thông tin liên hệ
                     </h3>
                     
                     <div className="space-y-6">
                        <div className="flex items-start gap-4">
                           <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                              <MapPin size={18} />
                           </div>
                           <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Địa chỉ</p>
                              <p className="text-sm font-semibold text-slate-800 leading-relaxed">{hospital?.address}</p>
                           </div>
                        </div>

                        <div className="flex items-start gap-4">
                           <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                              <Phone size={18} />
                           </div>
                           <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Hotline</p>
                              <a href={`tel:${hospital?.phone || '19001000'}`} className="text-lg font-bold text-blue-600 hover:text-blue-700 transition">
                                 {hospital?.phone || '1900 1000'}
                              </a>
                           </div>
                        </div>

                        <div className="flex items-start gap-4">
                           <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                              <Clock size={18} />
                           </div>
                           <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Giờ làm việc</p>
                              <p className="text-sm font-semibold text-slate-800">Thứ 2 - Chủ Nhật</p>
                              <p className="text-xs text-slate-500">Sáng: 07:00 - 12:00 | Chiều: 13:30 - 18:00</p>
                           </div>
                        </div>
                     </div>

                     <div className="mt-10 pt-10 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Kênh hỗ trợ trực tuyến</h4>
                        <div className="grid grid-cols-2 gap-3">
                           <a href="#" className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-colors">
                              <Globe size={20} className="text-blue-500" />
                              <span className="text-[10px] font-bold text-slate-700">Website</span>
                           </a>
                           <a href="#" className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl hover:bg-rose-50 transition-colors">
                              <Mail size={20} className="text-rose-500" />
                              <span className="text-[10px] font-bold text-slate-700">Email</span>
                           </a>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      <AssistantButton />
      <Footer />
    </div>
  );
}
