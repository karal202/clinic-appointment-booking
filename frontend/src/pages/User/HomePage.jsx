import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Heart, Calendar, Bell, Clock, Phone, Shield, 
  Activity, CheckCircle, AlertCircle, ArrowRight, Star,
  MapPin, User
} from 'lucide-react';
import toast from 'react-hot-toast';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ServiceCard from '../../components/ServiceCard';
import FacilitySection from '../../components/FacilitySection';
import SpecialtyItem from '../../components/SpecialtyItem';
import DoctorBookingSection from '../../components/DoctorBookingSection';
import AssistantButton from '../../components/AssistantButton';
import ListNews from '../../components/ListNews';

import { 
  getCurrentUser,    
  isLoggedIn,
  publicAPI,
  userAPI 
} from '../../utils/api';

export default function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [specs, setSpecs] = useState([]);
  const [loadingSpecs, setLoadingSpecs] = useState(true);
  const [expandedSpecs, setExpandedSpecs] = useState(false);
  const [loadingAuthData, setLoadingAuthData] = useState(false);

  useEffect(() => {
    document.title = "clinic-booking - Hệ thống đặt lịch y tế thông minh";
    const currentUser = getCurrentUser();
    setUser(currentUser);

    const loadData = async () => {
      // Load specialties for everyone
      publicAPI.getSpecialties()
        .then(res => setSpecs(Array.isArray(res.data) ? res.data : []))
        .catch(() => setSpecs([]))
        .finally(() => setLoadingSpecs(false));

      // Load user data if logged in
      if (isLoggedIn()) {
        setLoadingAuthData(true);
        try {
          const [bookingsRes, notifRes] = await Promise.all([
            userAPI.getMyBookings(),
            userAPI.getMyNotifications()
          ]);
          setBookings(bookingsRes.data || []);
          setNotifications(notifRes.data?.filter(n => !n.isRead) || []);
        } catch (err) {
          console.error('Lỗi tải dữ liệu người dùng:', err);
        } finally {
          setLoadingAuthData(false);
        }
      }
    };

    loadData();
  }, []);

  const getBookingStartISO = (b) => {
    if (!b) return null;
    if (b.startTime) return b.startTime;
    if (b.appointmentDate && b.appointmentTime) return `${b.appointmentDate}T${b.appointmentTime}`;
    if (b.appointmentDate) return b.appointmentDate;
    return null;
  };

  const upcomingBooking = bookings
    .filter(b => ['PENDING', 'CONFIRMED'].includes(b.status))
    .sort((a, b) => {
      const ta = new Date(getBookingStartISO(a) || 0).getTime();
      const tb = new Date(getBookingStartISO(b) || 0).getTime();
      return ta - tb;
    })[0];

  const handleCancelBooking = async () => {
    if (!upcomingBooking) return;
    if (!window.confirm("Bạn có chắc chắn muốn hủy lịch hẹn này không?")) return;

    try {
      await userAPI.cancelAppointment(upcomingBooking.id);
      toast.success("Hủy lịch hẹn thành công!");
      // Refresh data
      const bookingsRes = await userAPI.getMyBookings();
      setBookings(bookingsRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi hủy lịch hẹn!");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* HERO SECTION - Medical Blue Background */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-blue-500">
        <div className="relative max-w-7xl mx-auto px-6 text-center lg:text-left">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 px-5 py-2.5 rounded-full shadow-sm">
                <CheckCircle className="w-4 h-4 text-white" />
                <span className="text-xs font-semibold text-white tracking-wide">
                  Nền tảng Y tế Số 1 Việt Nam
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                {user 
                  ? `Xin chào, ${user.fullName?.split(' ')[0]}!` 
                  : 'Kết nối Y tế thông minh cho Gia đình bạn'
                }
              </h1>
              
              <p className="text-lg sm:text-xl text-blue-50 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Đặt lịch khám nhanh chóng, lấy số thứ tự trực tuyến, và quản lý hồ sơ sức khỏe chỉ trong vài lần chạm.
              </p>
              <div className="flex flex-wrap gap-6 justify-center lg:justify-start pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                    <CheckCircle size={22} />
                  </div>
                  <span className="text-sm font-medium text-white">Đặt khám nhanh</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                    <Clock size={22} />
                  </div>
                  <span className="text-sm font-medium text-white">Chọn giờ theo ý</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                    <Shield size={22} />
                  </div>
                  <span className="text-sm font-medium text-white">Bảo mật thông tin</span>
                </div>
              </div>
            </div>

            <div className="flex-1 relative hidden lg:block">
               <div className="relative z-10 bg-white p-8 rounded-3xl shadow-xl border border-blue-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Heart className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">Thông tin Y khoa</h3>
                      <p className="text-sm text-slate-500">Cập nhật mới nhất 2026</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="group flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer">
                      <span className="font-medium text-slate-700">Khám tổng quát định kỳ</span>
                      <ArrowRight className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                    <div className="group flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer">
                      <span className="font-medium text-slate-700">Tư vấn dinh dưỡng nhi khoa</span>
                      <ArrowRight className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                    <div className="group flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer">
                      <span className="font-medium text-slate-700">Gói tầm soát tim mạch</span>
                      <ArrowRight className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </div>
               </div>
               
               {/* Decorative dots */}
               <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
               <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION - Improved */}
      {user && (
        <section className="py-16 -mt-4 relative z-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-md hover:border-blue-300 transition-all">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Lịch đã đặt</p>
                  <h4 className="text-3xl font-bold text-blue-600">{bookings.length}</h4>
                </div>
                <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                  <Calendar size={28} />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-md hover:border-amber-300 transition-all">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Thông báo</p>
                  <h4 className="text-3xl font-bold text-amber-600">{notifications.length}</h4>
                </div>
                <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                  <Bell size={28} />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-md hover:border-emerald-300 transition-all">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Hoàn thành</p>
                  <h4 className="text-3xl font-bold text-emerald-600">
                    {bookings.length > 0 ? Math.round((bookings.filter(b => b.status === 'COMPLETED').length / bookings.length) * 100) : 0}%
                  </h4>
                </div>
                <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                  <Activity size={28} />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* MAIN FEATURES GRID */}
      <section className="py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ServiceCard 
              to="/hospitals" 
              icon="🏥" 
              title="Đặt lịch tại cơ sở" 
              desc="Hệ thống bệnh viện uy tín, quy trình tinh gọn, lấy số tự động." 
            />
            <ServiceCard 
              to="/doctors" 
              icon="🩺" 
              title="Đặt lịch bác sĩ" 
              desc="Chọn bác sĩ theo chuyên khoa và kinh nghiệm mong muốn." 
            />
            <ServiceCard 
              to={isLoggedIn() ? "/me" : "/login"} 
              icon="👤" 
              title="Hồ sơ cá nhân" 
              desc="Theo dõi lịch sử khám bệnh và quản lý thông tin gia đình." 
            />
          </div>
        </div>
      </section>

      {/* UPCOMING BOOKING REMINDER - Improved */}
      {upcomingBooking && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 lg:p-12 text-white relative overflow-hidden">
              {/* Decorative circle */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
              
              <div className="flex flex-col lg:flex-row gap-10 items-center relative z-10">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-lg mb-5">
                    <AlertCircle size={16} />
                    <span className="text-xs font-semibold">Lịch khám sắp tới</span>
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-bold mb-3">Sắp đến lịch hẹn!</h2>
                  <p className="text-slate-300 text-base mb-6 max-w-lg leading-relaxed">
                    Vui lòng có mặt trước 15 phút để thực hiện thủ tục check-in tại quầy tiếp đón.
                  </p>
                  
                  <div className="flex gap-4">
                    <Link to="/me" className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg">
                      Chi tiết <ArrowRight size={18} />
                    </Link>
                    <button 
                      onClick={handleCancelBooking}
                      className="inline-flex items-center gap-2 bg-red-500/20 backdrop-blur-md text-red-100 border border-red-500/50 px-6 py-3 rounded-xl font-semibold hover:bg-red-500/40 transition-all shadow-lg"
                    >
                      Hủy lịch
                    </button>
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center gap-5 mb-6 pb-6 border-b border-white/10">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                         <User size={32} />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold">{upcomingBooking.doctor?.fullName || 'Bác sĩ chuyên khoa'}</h4>
                        <p className="text-blue-300 font-medium text-sm mt-1">
                          {upcomingBooking.doctor?.specialty?.name || 'Khoa Nội'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          {(() => {
                            const iso = getBookingStartISO(upcomingBooking);
                            const d = iso ? new Date(iso) : null;
                            if (d && !isNaN(d.getTime())) {
                              return (
                                <>
                                  <p className="font-semibold text-base">{d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                  <p className="text-slate-400 text-sm">Thời gian: {d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                                </>
                              );
                            }
                            // fallback to appointmentDate/appointmentTime strings
                            return (
                              <>
                                <p className="font-semibold text-base">{upcomingBooking.appointmentDate || 'Ngày chưa xác định'}</p>
                                <p className="text-slate-400 text-sm">Thời gian: {upcomingBooking.appointmentTime || '—'}</p>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-base">{upcomingBooking.hospital?.name || 'Cơ sở Y tế'}</p>
                          <p className="text-slate-400 text-sm line-clamp-1">{upcomingBooking.hospital?.address || 'Địa chỉ bệnh viện'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* DOCTORS SECTION */}
      <DoctorBookingSection />

      {/* FACILITIES SECTION */}
      <FacilitySection />

      {/* SPECIALTIES SECTION - Improved */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Chuyên khoa</h2>
              <p className="text-slate-600">Đầy đủ các chuyên khoa đáp ứng mọi nhu cầu chăm sóc sức khỏe.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {loadingSpecs
              ? Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-slate-100 rounded-2xl animate-pulse"></div>
                ))
              : (expandedSpecs ? specs : specs.slice(0, 12)).map((it) => (
                  <SpecialtyItem key={it.id} item={it} />
                ))}
          </div>

          {!loadingSpecs && specs.length > 12 && (
            <div className="mt-12 text-center">
              <button
                type="button"
                className="inline-flex items-center gap-2 bg-slate-900 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg"
                onClick={() => setExpandedSpecs((v) => !v)}
              >
                {expandedSpecs ? "Thu gọn danh sách ▲" : "Xem tất cả chuyên khoa ▼"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* NEWS SECTION */}
      <ListNews />

      <AssistantButton />
      
      <Footer />
    </div>
  );
}
