import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  User, Calendar, MapPin,
  Shield, CheckCircle, ArrowLeft, Loader2,
  FileText, Phone, Mail, CreditCard, AlertCircle,
  Banknote, QrCode, ChevronRight
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AssistantButton from '../../components/AssistantButton';
import { userAPI, getCurrentUser } from '../../utils/api';
import toast from 'react-hot-toast';

export default function BookingConfirmPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingData = location.state;

  const [user, setUser] = useState(getCurrentUser());
  const [patientName, setPatientName] = useState(getCurrentUser()?.fullName || '');
  const [patientPhone, setPatientPhone] = useState(getCurrentUser()?.phoneNumber || '');
  const [patientAddress, setPatientAddress] = useState(getCurrentUser()?.address || '');
  const [symptomsNote, setSymptomsNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [payProvider, setPayProvider] = useState('CASH'); // freeze provider while paying

  const pollingRef = useRef(null);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (!bookingData) {
      toast.error('Không tìm thấy thông tin đặt lịch');
      navigate('/doctors');
      return;
    }
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await userAPI.getProfile();
        setUser(res.data);
        setPatientName(res.data?.fullName || '');
        setPatientPhone(res.data?.phoneNumber || '');
        setPatientAddress(res.data?.address || '');
      } catch (err) {
        console.error('Lỗi tải thông tin cá nhân:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [bookingData, navigate]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleConfirmBooking = async () => {
    if (!patientName.trim() || !patientPhone.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc (Họ và tên, Số điện thoại)');
      return;
    }

    if (paymentMethod === 'VNPAY' || paymentMethod === 'MOMO') return handleConfirmAndPay(paymentMethod);

    setIsSubmitting(true);
    try {
      const appointmentTime = bookingData.slot.start.split('T')[1].substring(0, 8);
      const res = await userAPI.createAppointment({
        doctorId: Number(bookingData.doctorId),
        slotId: Number(bookingData.slot.id),
        appointmentDate: bookingData.date,
        appointmentTime: appointmentTime,
        symptomsNote: symptomsNote,
        patientName: patientName,
        patientPhone: patientPhone,
        patientAddress: patientAddress,
        paymentMethod: paymentMethod
      });
      toast.success('Đặt lịch thành công!');
      navigate('/booking/success', {
        state: {
          appointment: res.data,
          doctorName: bookingData.doctorName,
          hospitalName: bookingData.hospitalName,
          price: bookingData.price
        }
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmAndPay = async (provider) => {
    setIsSubmitting(true);
    setIsPaying(true);
    setPayProvider(provider);
    let appointment = null;
    try {
      const appointmentTime = bookingData.slot.start.split('T')[1].substring(0, 8);
      const res = await userAPI.createAppointment({
        doctorId: Number(bookingData.doctorId),
        slotId: Number(bookingData.slot.id),
        appointmentDate: bookingData.date,
        appointmentTime: appointmentTime,
        symptomsNote: symptomsNote,
        patientName: patientName,
        patientPhone: patientPhone,
        patientAddress: patientAddress,
        paymentMethod: provider
      });
      appointment = res.data;
      const rawAmount = String(bookingData.price || appointment.amount || 0);
      // Chỉ giữ lại chữ số để tránh JS hiểu nhầm "600.000" thành 600
      const amount = Number(rawAmount.toString().replace(/[^\d]/g, '')) || 0;
      const payRes = provider === 'MOMO'
        ? await userAPI.createMomoPayment(appointment.id, amount)
        : await userAPI.createVnPayPayment(appointment.id, amount);
      if (payRes?.data?.paymentUrl) {
        // Chuyển thẳng sang cổng thanh toán trong cùng tab (không hiện modal)
        window.location.href = payRes.data.paymentUrl;
        return;
      }
      pollingRef.current = setInterval(async () => {
        try {
          const statusRes = await userAPI.getPaymentStatus(payRes.data.txRef);
          if (statusRes.data.status === 'COMPLETED') {
            clearInterval(pollingRef.current);
            toast.success('Thanh toán thành công — Cảm ơn bạn!');
            try {
              const myRes = await userAPI.getMyBookings();
              const updated = myRes.data.find(b => b.id === appointment.id) || appointment;
              navigate('/booking/success', { state: { appointment: updated, doctorName: bookingData.doctorName, hospitalName: bookingData.hospitalName, price: bookingData.price } });
            } catch (e) {
              navigate('/booking/success', { state: { appointment, doctorName: bookingData.doctorName, hospitalName: bookingData.hospitalName, price: bookingData.price } });
            }
          }
        } catch (e) { console.error('Payment status poll error', e); }
      }, 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi khi tạo giao dịch/đặt lịch. Vui lòng thử lại.';
      toast.error(msg);
      navigate('/booking/failure', {
        state: { message: msg, bookingData, appointmentId: appointment?.id }
      });
    } finally {
      setIsSubmitting(false);
      setIsPaying(false);
    }
  };

  if (!bookingData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Header />

      <div className="max-w-6xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition mb-8 font-semibold group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Quay lại</span>
        </button>

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Xác nhận đặt lịch khám</h1>
          <p className="text-lg text-slate-600">Vui lòng kiểm tra kỹ thông tin trước khi hoàn tất.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Info */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <User size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Thông tin bệnh nhân</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Họ và tên</label>
                  <input value={patientName} onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Tên người được khám"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Số điện thoại</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="Số điện thoại liên hệ"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 font-semibold text-slate-900 outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Email</label>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-900 flex items-center gap-2">
                    <Mail size={16} className="text-slate-400" />
                    {user?.email || '---'}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
                    Địa chỉ <span className="text-slate-400 normal-case font-normal">(tùy chọn)</span>
                  </label>
                  <input value={patientAddress} onChange={(e) => setPatientAddress(e.target.value)}
                    placeholder="Địa chỉ liên hệ"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200 flex gap-3">
                <Shield size={20} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 leading-relaxed">
                  Thông tin của bạn được bảo mật tuyệt đối. Nếu cần cập nhật, vui lòng truy cập{' '}
                  <span className="font-bold underline cursor-pointer hover:text-blue-600" onClick={() => navigate('/me')}>trang hồ sơ</span>.
                </p>
              </div>
            </div>

            {/* Symptoms Note */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <FileText size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Thông tin bổ sung</h3>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-3">
                  Triệu chứng hoặc lý do khám <span className="text-slate-400 normal-case font-normal">(không bắt buộc)</span>
                </label>
                <textarea value={symptomsNote} onChange={(e) => setSymptomsNote(e.target.value)}
                  placeholder="Ví dụ: Đau đầu kéo dài 3 ngày, muốn kiểm tra sức khỏe tổng quát..."
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all min-h-[140px] resize-none" />
                <p className="text-xs text-slate-500 mt-2">Cung cấp thông tin giúp bác sĩ chuẩn bị tốt hơn cho buổi khám</p>
              </div>
            </div>

            {/* ===== PAYMENT METHOD - BIG CARDS ===== */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Phương thức thanh toán</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Chọn cách thanh toán phù hợp với bạn</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* CARD: Thanh toán tại quầy */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`relative w-full text-left rounded-2xl border-2 p-6 transition-all duration-200 group
                    ${paymentMethod === 'CASH'
                      ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100'
                      : 'border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-md'
                    }`}
                >
                  {/* Selected indicator */}
                  <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                    ${paymentMethod === 'CASH' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white'}`}>
                    {paymentMethod === 'CASH' && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors
                    ${paymentMethod === 'CASH' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}>
                    <Banknote size={28} />
                  </div>

                  <p className="text-lg font-black text-slate-900 mb-1">Thanh toán tại quầy</p>
                  <p className="text-sm text-slate-500 leading-relaxed">Trả tiền mặt hoặc chuyển khoản khi đến khám tại bệnh viện</p>

                  <div className={`mt-4 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full
                    ${paymentMethod === 'CASH' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <CheckCircle size={12} />
                    Xác nhận ngay
                  </div>
                </button>

                {/* CARD: VNPay */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('VNPAY')}
                  className={`relative w-full text-left rounded-2xl border-2 p-6 transition-all duration-200 group
                    ${paymentMethod === 'VNPAY'
                      ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100'
                      : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-md'
                    }`}
                >
                  {/* Selected indicator */}
                  <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                    ${paymentMethod === 'VNPAY' ? 'border-blue-500 bg-blue-500' : 'border-slate-300 bg-white'}`}>
                    {paymentMethod === 'VNPAY' && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* VNPay Logo / Icon */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors
                    ${paymentMethod === 'VNPAY' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                    <QrCode size={28} />
                  </div>

                  <p className="text-lg font-black text-slate-900 mb-1">Thanh toán VNPay</p>
                  <p className="text-sm text-slate-500 leading-relaxed">Quét QR hoặc thẻ ATM/VISA/Mastercard qua cổng VNPay</p>

                  <div className={`mt-4 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full
                    ${paymentMethod === 'VNPAY' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <QrCode size={12} />
                    Thanh toán online
                  </div>
                </button>

                {/* CARD: MoMo */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('MOMO')}
                  className={`relative w-full text-left rounded-2xl border-2 p-6 transition-all duration-200 group sm:col-span-2
                    ${paymentMethod === 'MOMO'
                      ? 'border-fuchsia-500 bg-fuchsia-50 shadow-lg shadow-fuchsia-100'
                      : 'border-slate-200 bg-slate-50 hover:border-fuchsia-300 hover:bg-fuchsia-50/40 hover:shadow-md'
                    }`}
                >
                  {/* Selected indicator */}
                  <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                    ${paymentMethod === 'MOMO' ? 'border-fuchsia-500 bg-fuchsia-500' : 'border-slate-300 bg-white'}`}>
                    {paymentMethod === 'MOMO' && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors
                    ${paymentMethod === 'MOMO' ? 'bg-fuchsia-500 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-fuchsia-100 group-hover:text-fuchsia-700'}`}>
                    <QrCode size={28} />
                  </div>

                  <p className="text-lg font-black text-slate-900 mb-1">Thanh toán MoMo</p>
                  <p className="text-sm text-slate-500 leading-relaxed">Thanh toán nhanh bằng ví MoMo (QR / app)</p>

                  <div className={`mt-4 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full
                    ${paymentMethod === 'MOMO' ? 'bg-fuchsia-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <QrCode size={12} />
                    Thanh toán online
                  </div>
                </button>
              </div>

              {/* Note dưới card */}
              {paymentMethod === 'CASH' && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                  <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-800">
                    Sau khi xác nhận, bạn sẽ nhận email xác nhận lịch hẹn. Vui lòng thanh toán khi đến khám.
                  </p>
                </div>
              )}
              {paymentMethod === 'VNPAY' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                  <QrCode size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    Bạn sẽ được chuyển đến cổng VNPay ngay sau khi xác nhận. Hỗ trợ QR, ATM, VISA, Mastercard, ví điện tử.
                  </p>
                </div>
              )}
              {paymentMethod === 'MOMO' && (
                <div className="mt-4 p-4 bg-fuchsia-50 border border-fuchsia-200 rounded-xl flex items-start gap-3">
                  <QrCode size={18} className="text-fuchsia-700 shrink-0 mt-0.5" />
                  <p className="text-sm text-fuchsia-900">
                    Bạn sẽ được chuyển đến MoMo ngay sau khi xác nhận. Hoàn tất thanh toán và hệ thống sẽ tự cập nhật trạng thái.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200 sticky top-24">
              <h3 className="text-lg font-bold text-slate-900 mb-6 pb-4 border-b border-slate-200">
                Chi tiết lịch khám
              </h3>

              <div className="space-y-5 mb-6">
                <div className="flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <User size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Bác sĩ</p>
                    <p className="font-bold text-slate-900 text-base leading-tight">
                      {bookingData.doctorName.startsWith('BS') ? bookingData.doctorName : `BS. ${bookingData.doctorName}`}
                    </p>
                    <p className="text-xs text-blue-600 font-semibold mt-1">{bookingData.specialtyName}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Địa điểm</p>
                    <p className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2">{bookingData.hospitalName}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Ngày & Giờ</p>
                    <p className="font-bold text-slate-900 text-base">
                      {new Date(bookingData.slot.start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </p>
                    <p className="text-sm text-slate-600 font-medium">
                      {new Date(bookingData.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="border-t-2 border-dashed border-slate-200 pt-6 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-600 font-medium">Chi phí khám</span>
                  <span className="font-bold text-slate-900">{bookingData.price}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-900 font-bold text-sm">Tổng cộng</span>
                  <span className="text-2xl font-bold text-blue-600">{bookingData.price}</span>
                </div>
              </div>

              {/* Phương thức đang chọn - Summary */}
              <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 border
                ${paymentMethod === 'VNPAY'
                  ? 'bg-blue-50 border-blue-200'
                  : paymentMethod === 'MOMO'
                    ? 'bg-fuchsia-50 border-fuchsia-200'
                    : 'bg-emerald-50 border-emerald-200'
                }`}>
                {paymentMethod === 'VNPAY' ? (
                  <QrCode size={20} className="text-blue-600 shrink-0" />
                ) : paymentMethod === 'MOMO' ? (
                  <QrCode size={20} className="text-fuchsia-700 shrink-0" />
                ) : (
                  <Banknote size={20} className="text-emerald-600 shrink-0" />
                )}
                <div>
                  <p className={`text-xs font-black uppercase ${paymentMethod === 'VNPAY' ? 'text-blue-900' : paymentMethod === 'MOMO' ? 'text-fuchsia-900' : 'text-emerald-900'
                    }`}>
                    {paymentMethod === 'VNPAY' ? 'VNPay — Online' : paymentMethod === 'MOMO' ? 'MoMo — Online' : 'Thanh toán tại quầy'}
                  </p>
                  <p className={`text-xs mt-0.5 ${paymentMethod === 'VNPAY' ? 'text-blue-700' : paymentMethod === 'MOMO' ? 'text-fuchsia-800' : 'text-emerald-700'
                    }`}>
                    {paymentMethod === 'VNPAY'
                      ? 'Sẽ chuyển sang cổng VNPay'
                      : paymentMethod === 'MOMO'
                        ? 'Sẽ chuyển sang MoMo'
                        : 'Trả khi đến khám'
                    }
                  </p>
                </div>
              </div>

              {/* SINGLE CONFIRM BUTTON */}
              <button
                onClick={handleConfirmBooking}
                disabled={isSubmitting || isPaying}
                className={`w-full py-5 rounded-xl font-black text-white text-base shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
                  ${paymentMethod === 'VNPAY'
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                    : paymentMethod === 'MOMO'
                      ? 'bg-fuchsia-600 hover:bg-fuchsia-700 shadow-fuchsia-200'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                  }`}
              >
                {isSubmitting || isPaying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isPaying ? 'Đang tạo giao dịch...' : 'Đang xử lý...'}
                  </>
                ) : paymentMethod === 'VNPAY' ? (
                  <>
                    <QrCode size={20} />
                    Xác nhận & Thanh toán VNPay
                    <ChevronRight size={18} />
                  </>
                ) : paymentMethod === 'MOMO' ? (
                  <>
                    <QrCode size={20} />
                    Xác nhận & Thanh toán MoMo
                    <ChevronRight size={18} />
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Xác nhận đặt lịch
                    <ChevronRight size={18} />
                  </>
                )}
              </button>

              <div className="mt-5 p-4 bg-slate-50 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertCircle size={15} className="text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Bằng việc xác nhận, bạn đồng ý với{' '}
                    <span className="font-semibold text-slate-700">điều khoản sử dụng</span> và{' '}
                    <span className="font-semibold text-slate-700">chính sách bảo mật</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AssistantButton />
      <Footer />
    </div>
  );
}