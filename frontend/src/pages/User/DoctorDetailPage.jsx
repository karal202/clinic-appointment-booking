import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  User, MapPin, Star, Calendar, Clock, 
  ChevronRight, Home, Shield, Award, 
  Loader2, ArrowLeft,
  CheckCircle, AlertCircle, XCircle, Phone, Mail,
  Briefcase, GraduationCap, Building2, X
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AssistantButton from '../../components/AssistantButton';
import { publicAPI, userAPI, isLoggedIn, getCurrentUser } from '../../utils/api';
import { BASE_URL } from '../../services/api';
import toast from 'react-hot-toast';
import webSocketService from '../../services/websocket';

export default function DoctorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(false);
  const [availableDates, setAvailableDates] = useState(new Set());
  const [showFullCalendar, setShowFullCalendar] = useState(false);

  // Load bác sĩ
  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true);
      try {
        const res = await publicAPI.getDoctorById(id);
        setDoctor(res.data);
      } catch (err) {
        console.error('Lỗi tải thông tin bác sĩ:', err);
        toast.error('Không tìm thấy bác sĩ');
        navigate('/doctors');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id, navigate]);

  // Load danh sách ngày có lịch khám trong 30 ngày tới
  useEffect(() => {
    const fetchAvailableDates = async () => {
      if (!id) return;
      try {
        const dates = new Set();
        const promises = [];
        
        for (let i = 0; i < 30; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          promises.push(
            publicAPI.getSlots(id, dateStr)
              .then(res => {
                if (res.data && res.data.length > 0) {
                  dates.add(dateStr);
                }
              })
              .catch(() => {})
          );
        }
        
        await Promise.all(promises);
        setAvailableDates(dates);
      } catch (err) {
        console.error('Lỗi tải danh sách ngày khám:', err);
      }
    };
    
    fetchAvailableDates();
  }, [id]);

  const fetchSlots = useCallback(async () => {
    if (!id || !selectedDate) return;
    setLoadingSlots(true);
    try {
      const res = await publicAPI.getSlots(id, selectedDate);
      setSlots(res.data || []);
    } catch (err) {
      console.error('Lỗi tải lịch khám:', err);
    } finally {
      setLoadingSlots(false);
    }
  }, [id, selectedDate]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  useEffect(() => {
    webSocketService.connect();
    webSocketService.setSlotUpdateHandler((scheduleId) => {
      fetchSlots(); 
    });

    const handleBeforeUnload = () => {
       const user = getCurrentUser();
       if (user) {
          // Use sendBeacon for reliability on page unload (refresh/close tab)
          // Note: URL must match your backend API exactly
          const url = `${BASE_URL}/slots/unlock/user/${user.id}`;
          navigator.sendBeacon(url);
       }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      webSocketService.disconnect();
      
      // Also unlock when component unmounts (navigation within SPA)
      const user = getCurrentUser();
      if (user) {
         // Using the API utility for SPA navigation cleanup
         publicAPI.unlockSlotsForUser(user.id).catch(err => console.error("Unlock failed on unmount:", err));
      }
    };
  }, [fetchSlots]);

  useEffect(() => {
    if (!selectedSlot) return;
    const slotDate = selectedSlot.start?.split('T')[0];
    if (slotDate && slotDate !== selectedDate) {
      const user = getCurrentUser();
      if (user) {
        publicAPI.unlockSlotsForUser(user.id).catch(err => console.error('Unlock on date change failed', err));
      }
      setSelectedSlot(null);
    }
  }, [selectedDate, selectedSlot]);

  const handleSlotClick = async (slot) => {
    if (!slot.available) return;
    
    // Optimistic update
    const prevSelected = selectedSlot;
    setSelectedSlot(slot);

    const user = getCurrentUser();
    if (user && slot.id) {
      try {
        await publicAPI.lockSlot(slot.id, user.id);
      } catch (err) {
        console.error('Không thể khóa khung giờ:', err);
        // Revert selection if failed
        setSelectedSlot(prevSelected);
        
        if (err.response && err.response.status === 409) {
          toast.error('Khung giờ này vừa có người chọn. Vui lòng chọn giờ khác!');
        } else {
          toast.error('Có lỗi xảy ra khi chọn giờ. Vui lòng thử lại.');
        }
        
        // Refresh slots to get latest status
        fetchSlots();
      }
    }
  };

  const handleBooking = () => {
    if (!isLoggedIn()) {
      toast.error('Vui lòng đăng nhập để đặt lịch');
      navigate('/login');
      return;
    }

    if (!selectedSlot) {
      toast.error('Vui lòng chọn giờ khám');
      return;
    }

    navigate('/booking/confirm', {
      state: {
        doctorId: id,
        doctorName: doctor?.fullName,
        hospitalName: doctor?.hospital?.name,
        specialtyName: doctor?.specialty?.name,
        slot: selectedSlot,
        date: selectedDate,
        price: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(doctor?.feeMin || 500000)
      }
    });
  };

  if (loading) return (
     <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
     </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link to="/" className="hover:text-blue-600 transition flex items-center gap-1">
            <Home size={16} /> Trang chủ
          </Link>
          <ChevronRight size={16} />
          <Link to="/doctors" className="hover:text-blue-600 transition">Bác sĩ</Link>
          <ChevronRight size={16} />
          <span className="text-slate-700 font-semibold">{doctor?.fullName}</span>
        </nav>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Doctor Profile Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-slate-200/50">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Avatar & Quick Stats */}
              <div className="flex flex-col items-center lg:items-start">
                <div className="relative">
                  <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-3xl bg-gradient-to-br from-blue-100 to-blue-50 overflow-hidden border-4 border-white shadow-xl">
                    {doctor?.avatar ? (
                      <img 
                        src={`/images/doctors/${doctor.avatar.substring(doctor.avatar.lastIndexOf('-') + 1)}`} 
                        alt={doctor.fullName} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = doctor.avatar.startsWith('http') ? doctor.avatar : `${BASE_URL}${doctor.avatar}`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-blue-300">
                        <User size={80} />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-3 -right-3 bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-2 rounded-2xl shadow-lg flex items-center gap-2">
                     <Star size={18} className="text-white fill-white" />
                     <span className="font-bold text-white text-lg">{doctor?.ratingAvg || '5.0'}</span>
                  </div>
                </div>
                
                {/* Quick Contact */}
                <div className="mt-6 w-full max-w-[200px] space-y-2">
                  <button className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all">
                    <Phone size={18} />
                    <span>Gọi ngay</span>
                  </button>
                  <button onClick={() => navigate(`/chat?doctor=${doctor?.id}`)} className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all">
                    <span>Nhắn tin</span>
                  </button>
                </div>
              </div>

              {/* Doctor Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full">
                    {doctor?.specialty?.name || 'Nhi khoa'}
                  </span>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1">
                    <CheckCircle size={14} />
                    Xác thực
                  </span>
                </div>
                
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                  {doctor?.fullName.startsWith('BS') ? doctor?.fullName : `BS. ${doctor?.fullName}`}
                </h1>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Building2 size={20} className="text-blue-500 shrink-0" />
                    <span className="font-medium">{doctor?.hospital?.name || 'Bệnh viện Chợ Rẫy'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <MapPin size={20} className="text-red-500 shrink-0" />
                    <span>123 Đường ABC, Quận 1, TP.HCM</span>
                  </div>
                </div>

                <p className="text-slate-600 leading-relaxed mb-6">
                  {doctor?.bio || "Bác sĩ chưa cập nhật thông tin giới thiệu."}
                </p>

                {/* Stats & Education Grid - 2 rows */}
                <div className="space-y-4">
                  {/* Stats Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                     <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-3 rounded-xl text-center border border-blue-200/50">
                        <Briefcase size={20} className="text-blue-600 mx-auto mb-1" />
                        <p className="text-[10px] font-semibold text-slate-500 mb-0.5">Kinh nghiệm</p>
                        <p className="font-bold text-slate-900">{doctor?.experienceYears || '5+'} Năm</p>
                     </div>
                     <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-3 rounded-xl text-center border border-emerald-200/50">
                        <User size={20} className="text-emerald-600 mx-auto mb-1" />
                        <p className="text-[10px] font-semibold text-slate-500 mb-0.5">Lượt đánh giá</p>
                        <p className="font-bold text-slate-900">{doctor?.ratingCount || 0}</p>
                     </div>
                     <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-3 rounded-xl text-center border border-amber-200/50">
                        <GraduationCap size={20} className="text-amber-600 mx-auto mb-1" />
                        <p className="text-[10px] font-semibold text-slate-500 mb-0.5">Chức danh</p>
                        <p className="font-bold text-slate-900">Bác sĩ</p>
                     </div>
                     <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-3 rounded-xl text-center border border-purple-200/50">
                        <Star size={20} className="text-purple-600 mx-auto mb-1" />
                        <p className="text-[10px] font-semibold text-slate-500 mb-0.5">Đánh giá</p>
                        <p className="font-bold text-slate-900">4.9/5</p>
                     </div>
                  </div>

                  {/* Education Timeline - Compact */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Award className="text-blue-600" size={18} /> 
                      Học vấn & Công tác
                    </h3>
                    <div className="space-y-2 relative before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-0.5 before:bg-slate-300">
                      <div className="relative pl-6">
                        <div className="absolute left-0 top-0.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-full"></div>
                        <div className="bg-white border border-slate-200 rounded-lg p-2">
                          <p className="text-xs font-bold text-slate-900">2010 - 2016: ĐH Y Dược TP.HCM</p>
                          <p className="text-[10px] text-slate-500">Bác sĩ Đa khoa</p>
                        </div>
                      </div>
                      <div className="relative pl-6">
                        <div className="absolute left-0 top-0.5 w-3 h-3 bg-white border-2 border-slate-300 rounded-full"></div>
                        <div className="bg-white border border-slate-200 rounded-lg p-2">
                          <p className="text-xs font-bold text-slate-900">2016 - 2018: BV Chợ Rẫy</p>
                          <p className="text-[10px] text-slate-500">Nội trú CK II</p>
                        </div>
                      </div>
                      <div className="relative pl-6">
                        <div className="absolute left-0 top-0.5 w-3 h-3 bg-white border-2 border-slate-300 rounded-full"></div>
                        <div className="bg-white border border-slate-200 rounded-lg p-2">
                          <p className="text-xs font-bold text-slate-900">2019 - Nay: clinic-booking</p>
                          <p className="text-[10px] text-slate-500">Trưởng khoa Nội tim mạch</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Section - Full Width */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-slate-200/50">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Calendar className="text-blue-600" size={32} />
                Đặt lịch khám bệnh
              </h2>
              <div className="bg-blue-50 px-4 py-2 rounded-xl">
                <p className="text-sm font-semibold text-blue-600">Phí khám: <span className="text-xl">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(doctor?.feeMin || 500000)}
                </span></p>
              </div>
            </div>

            {/* Date Selection - 2 hàng x 7 ngày */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-5">
                <label className="text-lg font-bold text-slate-700 flex items-center gap-2">
                  <Calendar size={20} className="text-blue-600" />
                  Chọn ngày khám
                </label>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-slate-600">Có lịch</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <span className="text-slate-600">Nghỉ</span>
                  </div>
                </div>
              </div>
              
              {/* First Row - 7 days */}
              <div className="grid grid-cols-7 gap-3 mb-3">
                {Array.from({ length: 7 }).map((_, index) => {
                  const date = new Date();
                  date.setDate(date.getDate() + index);
                  const dateStr = date.toISOString().split('T')[0];
                  const isSelected = selectedDate === dateStr;
                  const isToday = index === 0;
                  const hasSlots = availableDates.has(dateStr);

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      disabled={!hasSlots}
                      className={`relative flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all
                        ${!hasSlots 
                          ? 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed' 
                          : isSelected 
                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-600 text-white shadow-xl shadow-blue-200 scale-105' 
                            : 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300 text-emerald-700 hover:border-emerald-400 hover:shadow-lg hover:scale-105'
                        }`}
                    >
                      <div className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-1 shadow-md">
                        {hasSlots ? (
                          <CheckCircle size={14} className="text-emerald-500" />
                        ) : (
                          <XCircle size={14} className="text-red-500" />
                        )}
                      </div>
                      
                      <span className={`text-xs font-bold mb-2 uppercase ${
                        !hasSlots ? 'text-red-400' : isSelected ? 'text-blue-100' : 'text-emerald-600'
                      }`}>
                        {isToday ? 'Hôm nay' : date.toLocaleDateString('vi-VN', { weekday: 'short' })}
                      </span>
                      <span className="text-2xl font-bold leading-none mb-1">
                        {date.getDate()}
                      </span>
                      <span className={`text-xs font-semibold ${
                        !hasSlots ? 'text-red-400' : isSelected ? 'text-blue-200' : 'text-emerald-600'
                      }`}>
                        Tháng {date.getMonth() + 1}
                      </span>
                      {!hasSlots && (
                        <span className="absolute bottom-1 text-[10px] font-bold text-red-500">NGHỈ</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Second Row - 7 days */}
              <div className="grid grid-cols-7 gap-3 mb-4">
                {Array.from({ length: 7 }).map((_, index) => {
                  const offset = index + 7;
                  const date = new Date();
                  date.setDate(date.getDate() + offset);
                  const dateStr = date.toISOString().split('T')[0];
                  const isSelected = selectedDate === dateStr;
                  const hasSlots = availableDates.has(dateStr);

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      disabled={!hasSlots}
                      className={`relative flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all
                        ${!hasSlots 
                          ? 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed' 
                          : isSelected 
                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-600 text-white shadow-xl shadow-blue-200 scale-105' 
                            : 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300 text-emerald-700 hover:border-emerald-400 hover:shadow-lg hover:scale-105'
                        }`}
                    >
                      <div className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-1 shadow-md">
                        {hasSlots ? (
                          <CheckCircle size={14} className="text-emerald-500" />
                        ) : (
                          <XCircle size={14} className="text-red-500" />
                        )}
                      </div>
                      
                      <span className={`text-xs font-bold mb-2 uppercase ${
                        !hasSlots ? 'text-red-400' : isSelected ? 'text-blue-100' : 'text-emerald-600'
                      }`}>
                        {date.toLocaleDateString('vi-VN', { weekday: 'short' })}
                      </span>
                      <span className="text-2xl font-bold leading-none mb-1">
                        {date.getDate()}
                      </span>
                      <span className={`text-xs font-semibold ${
                        !hasSlots ? 'text-red-400' : isSelected ? 'text-blue-200' : 'text-emerald-600'
                      }`}>
                        Tháng {date.getMonth() + 1}
                      </span>
                      {!hasSlots && (
                        <span className="absolute bottom-1 text-[10px] font-bold text-red-500">NGHỈ</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Button chọn ngày khác */}
              <button
                onClick={() => setShowFullCalendar(true)}
                className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-semibold text-base"
              >
                <Calendar size={20} />
                Chọn ngày khác (xem đầy đủ 30 ngày)
              </button>

              {/* Selected Date Display */}
              {selectedDate && (
                <div className="mt-5 bg-blue-50 border border-blue-200 rounded-2xl p-5">
                  <p className="text-sm font-semibold text-blue-600 mb-1">Ngày đã chọn:</p>
                  <p className="text-xl font-bold text-blue-900">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('vi-VN', { 
                      weekday: 'long', 
                      year: 'numeric',
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Time Slots */}
            <div className="mb-8">
              <label className="text-lg font-bold text-slate-700 flex items-center gap-2 mb-5">
                <Clock size={20} className="text-blue-600" />
                Chọn giờ khám
              </label>
              
              {loadingSlots ? (
                <div className="py-16 flex flex-col items-center justify-center">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                  <p className="text-slate-500 font-medium">Đang tải lịch khám...</p>
                </div>
              ) : slots.length === 0 ? (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
                   <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                   <p className="text-lg font-bold text-red-600 mb-2">Bác sĩ nghỉ trong ngày này</p>
                   <p className="text-sm text-red-500">Vui lòng chọn ngày khác có dấu ✓ màu xanh</p>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3 mb-6">
                    {slots.map((slot, idx) => (
                      <button
                        key={idx}
                        disabled={!slot.available && !(selectedSlot && slot.id === selectedSlot.id)}
                        onClick={() => handleSlotClick(slot)}
                        className={`py-4 rounded-xl font-bold flex flex-col items-center justify-center transition-all border-2 
                          ${(!slot.available && !(selectedSlot && slot.id === selectedSlot.id))
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60' 
                            : (selectedSlot && slot.id && selectedSlot.id === slot.id)
                               ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-600 text-white shadow-xl shadow-blue-200 scale-105'
                               : 'bg-white border-slate-300 text-slate-700 hover:border-blue-500 hover:text-blue-600 hover:shadow-lg hover:scale-105'
                          }`}
                      >
                        <Clock size={16} className="mb-1" />
                        <span className="text-sm font-bold">
                          {new Date(slot.start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                        {!slot.available && (
                          <span className="text-[10px] mt-1">Hết</span>
                        )}
                      </button>
                    ))}
                  </div>

                  {selectedSlot && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                      <p className="text-sm font-semibold text-emerald-600 mb-1">Giờ đã chọn:</p>
                      <p className="text-2xl font-bold text-emerald-900">
                        {new Date(selectedSlot.start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Booking Summary & Action */}
            <div className="pt-8 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Summary */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Thông tin đặt lịch</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium">Bác sĩ:</span>
                      <span className="font-bold text-slate-900">{doctor?.fullName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium">Ngày khám:</span>
                      <span className="font-bold text-slate-900">
                        {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('vi-VN') : '--'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium">Giờ khám:</span>
                      <span className="font-bold text-slate-900">
                        {selectedSlot ? new Date(selectedSlot.start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--'}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-slate-300 flex justify-between items-center">
                      <span className="text-slate-600 font-bold">Tổng phí:</span>
                      <span className="font-bold text-blue-600 text-2xl">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(doctor?.feeMin || 500000)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex flex-col justify-center">
                  <button 
                    onClick={handleBooking}
                    disabled={!selectedSlot || booking}
                    className="w-full py-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-200 hover:from-blue-700 hover:to-blue-800 transition-all active:scale-95 disabled:opacity-50 disabled:bg-slate-400 disabled:shadow-none flex items-center justify-center gap-3 mb-4"
                  >
                    {booking ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" /> Đang xử lý...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-6 h-6" />
                        Xác nhận đặt lịch ngay
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-slate-500">
                    <Shield size={16} className="text-emerald-500" />
                    <span className="text-sm font-semibold">Thanh toán bảo mật • Hoàn tiền 100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Calendar Modal */}
      {showFullCalendar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Calendar className="text-blue-600" size={32} />
                Lịch khám 30 ngày tới
              </h3>
              <button
                onClick={() => setShowFullCalendar(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={28} className="text-slate-400" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-6 mb-8 text-sm font-semibold">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                <span className="text-slate-600">Có lịch khám</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-400"></div>
                <span className="text-slate-600">Ngày nghỉ</span>
              </div>
            </div>

            {/* 30 days grid - 7 columns */}
            <div className="grid grid-cols-7 gap-4">
              {Array.from({ length: 30 }).map((_, index) => {
                const date = new Date();
                date.setDate(date.getDate() + index);
                const dateStr = date.toISOString().split('T')[0];
                const isSelected = selectedDate === dateStr;
                const isToday = index === 0;
                const hasSlots = availableDates.has(dateStr);

                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setShowFullCalendar(false);
                    }}
                    disabled={!hasSlots}
                    className={`relative flex flex-col items-center justify-center py-5 rounded-2xl border-2 transition-all
                      ${!hasSlots 
                        ? 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed' 
                        : isSelected 
                          ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-600 text-white shadow-xl scale-105' 
                          : 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300 text-emerald-700 hover:border-emerald-400 hover:shadow-lg hover:scale-105'
                      }`}
                  >
                    <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md">
                      {hasSlots ? (
                        <CheckCircle size={16} className="text-emerald-500" />
                      ) : (
                        <XCircle size={16} className="text-red-500" />
                      )}
                    </div>
                    
                    <span className={`text-xs font-bold mb-2 uppercase ${
                      !hasSlots ? 'text-red-400' : isSelected ? 'text-blue-100' : 'text-emerald-600'
                    }`}>
                      {isToday ? 'Hôm nay' : date.toLocaleDateString('vi-VN', { weekday: 'short' })}
                    </span>
                    <span className="text-2xl font-bold leading-none mb-1">
                      {date.getDate()}
                    </span>
                    <span className={`text-xs font-semibold ${
                      !hasSlots ? 'text-red-400' : isSelected ? 'text-blue-200' : 'text-emerald-600'
                    }`}>
                      Th{date.getMonth() + 1}
                    </span>
                    {!hasSlots && (
                      <span className="absolute bottom-1 text-[10px] font-bold text-red-500">NGHỈ</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <AssistantButton />
      <Footer />
    </div>
  );
}
