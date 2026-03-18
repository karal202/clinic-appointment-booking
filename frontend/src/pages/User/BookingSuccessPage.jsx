import { useLocation, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { userAPI } from '../../utils/api';
import {
  CheckCircle, Calendar, Clock, User,
  MapPin, ArrowRight, Home, List,
  ShieldCheck, Phone, Mail, Loader2,
  QrCode, Baby, Syringe, CreditCard, Info
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

function formatPrice(value) {
  if (value == null) return '—';
  const n = Number(value);
  if (isNaN(n)) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

export default function BookingSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stateSummary = location.state;

  const [summary, setSummary] = useState(stateSummary || null);
  const [loading, setLoading] = useState(!stateSummary && !!searchParams.get('appointmentId'));
  const [showQr, setShowQr] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const pollingRef = useRef(null);

  // Khi redirect từ VNPay/Momo: có ?appointmentId=xxx, không có state → fetch thông tin lịch
  useEffect(() => {
    if (stateSummary || !searchParams.get('appointmentId')) return;
    const appointmentId = searchParams.get('appointmentId');
    let cancelled = false;
    setLoading(true);
    userAPI.getMyBookings()
      .then((res) => {
        if (cancelled) return;
        const list = res.data || [];
        // Ưu tiên tìm theo id, fallback bookingId
        const apt = list.find(
          (a) => String(a.id) === String(appointmentId) || String(a.bookingId) === String(appointmentId)
        );
        if (apt) setSummary({ appointment: apt });
      })
      .catch(() => { if (!cancelled) setSummary(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [stateSummary, searchParams]);

  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current); }, []);

  const startQrPayment = async (appointmentId, amount) => {
    if (!appointmentId) return;
    try {
      const res = await userAPI.createVnPayPayment(appointmentId, amount);
      setPaymentUrl(res.data.paymentUrl);
      setShowQr(true);
      if (res?.data?.paymentUrl) window.location.href = res.data.paymentUrl;

      pollingRef.current = setInterval(async () => {
        try {
          const statusRes = await userAPI.getPaymentStatus(res.data.txRef);
          if (statusRes.data.status === 'COMPLETED') {
            clearInterval(pollingRef.current);
            setShowQr(false);
            toast.success('Thanh toán thành công!');
            navigate('/my-bookings');
          }
        } catch (e) { console.error('poll error', e); }
      }, 3000);
    } catch (err) {
      toast.error('Không tạo được giao dịch. Vui lòng thử lại.');
    }
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center w-full">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Đang tải thông tin lịch hẹn...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ─── Không có thông tin ────────────────────────────────────────────────────
  if (!summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center w-full">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Thanh toán thành công!</h1>
            <p className="text-lg text-slate-600 mb-8">
              Lịch hẹn đã được xác nhận. Xem chi tiết tại trang quản lý lịch đặt.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/my-bookings" className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                <List className="w-5 h-5" />Quản lý lịch đặt
              </Link>
              <Link to="/" className="flex-1 px-6 py-4 border-2 border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition flex items-center justify-center gap-2">
                <Home className="w-5 h-5" />Trang chủ
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ─── Lấy dữ liệu từ summary ────────────────────────────────────────────────
  // Hỗ trợ cả 2 cấu trúc: booking tiêm chủng (childName, vaccineName...) và booking bác sĩ (doctorName, hospitalName...)
  const apt = summary.appointment || summary;
  const isVaccineBooking = !!apt.childName;

  const displayCode    = apt.bookingCode || apt.appointmentCode || ('#' + (apt.id || ''));
  const displayDate    = apt.slotDate || apt.appointmentDate;
  const displayTime    = apt.slotTime ? apt.slotTime.slice(0,5) : (apt.appointmentTime ? String(apt.appointmentTime).slice(0,5) : '—');
  const displayCenter  = apt.centerName || summary.hospitalName || apt.hospital?.name || '—';
  const displayDoctor  = summary.doctorName || apt.doctor?.fullName;
  const displayVaccine = apt.vaccineName;
  const displayDose    = apt.doseNumber;
  const displayChild   = apt.childName;
  const displayParent  = apt.parentName;
  const displayPhone   = apt.parentPhone;
  const displayAmount  = summary.price || apt.amount;
  const isPending      = apt.paymentStatus === 'UNPAID' || apt.paymentStatus === 'pending' || apt.status === 'pending';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
        <div className="w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">

            {/* ── Icon + Tiêu đề ── */}
            <div className="relative inline-flex mb-6 mx-auto flex justify-center w-full">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-200">
                <CheckCircle className="w-14 h-14 text-white" />
              </div>
              <div className="absolute top-0 right-[calc(50%-3.5rem)] w-10 h-10 rounded-full bg-white border-4 border-emerald-50 flex items-center justify-center text-emerald-600 shadow">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
                {isPending ? 'Đặt lịch thành công!' : 'Thanh toán thành công!'}
              </h1>
              <p className="text-lg text-slate-600">
                {isPending
                  ? 'Lịch đã được ghi nhận. Vui lòng hoàn tất thanh toán để xác nhận.'
                  : 'Lịch hẹn đã được xác nhận. Kiểm tra thông tin bên dưới.'}
              </p>
            </div>

            {/* ── Thông tin lịch ── */}
            <div className="bg-slate-50 rounded-2xl p-6 mb-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Thông tin lịch hẹn</h3>

              {/* Mã đặt lịch */}
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mã đặt lịch</p>
                  <p className="font-bold text-blue-600 text-lg font-mono">{displayCode}</p>
                </div>
              </div>

              {/* Bé / Bệnh nhân */}
              {displayChild && (
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 shrink-0">
                    <Baby className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bé</p>
                    <p className="font-bold text-slate-900">{displayChild}</p>
                    {displayParent && <p className="text-sm text-slate-500">Phụ huynh: {displayParent} {displayPhone && `• ${displayPhone}`}</p>}
                  </div>
                </div>
              )}

              {/* Bác sĩ (nếu có) */}
              {displayDoctor && (
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bác sĩ</p>
                    <p className="font-bold text-slate-900">{displayDoctor.startsWith('BS') ? displayDoctor : `BS. ${displayDoctor}`}</p>
                  </div>
                </div>
              )}

              {/* Vắc-xin (nếu có) */}
              {displayVaccine && (
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                    <Syringe className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Vắc-xin</p>
                    <p className="font-bold text-slate-900">{displayVaccine}</p>
                    {displayDose && <p className="text-sm text-slate-500">Mũi {displayDose}</p>}
                  </div>
                </div>
              )}

              {/* Thời gian */}
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ngày & Giờ</p>
                  <p className="font-bold text-slate-900">
                    {displayDate
                      ? new Date(displayDate + (displayDate.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </p>
                  <p className="text-sm text-orange-600 font-semibold flex items-center gap-1">
                    <Clock className="w-4 h-4" />{displayTime}
                  </p>
                </div>
              </div>

              {/* Cơ sở */}
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Địa điểm</p>
                  <p className="font-bold text-slate-900">{displayCenter}</p>
                </div>
              </div>

              {/* Chi phí */}
              {displayAmount && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <span className="text-slate-600 font-medium">Chi phí</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {typeof displayAmount === 'string' ? displayAmount : formatPrice(displayAmount)}
                  </span>
                </div>
              )}
            </div>

            {/* ── Lưu ý ── */}
            <div className="bg-amber-50 border-l-4 border-amber-500 rounded-2xl p-5 mb-6">
              <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />Lưu ý quan trọng
              </h4>
              <ul className="space-y-1.5 text-sm text-amber-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Có mặt trước <strong>15 phút</strong> để làm thủ tục check-in</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Mang theo CMND/CCCD {isVaccineBooking && 'và sổ tiêm chủng'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Xuất trình mã đặt lịch <strong>{displayCode}</strong> tại quầy lễ tân</span>
                </li>
                {!isPending && (
                  <li className="flex items-start gap-2">
                    <QrCode className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>QR code của bạn đã sẵn sàng trong mục <strong>Quản lý lịch đặt</strong></span>
                  </li>
                )}
              </ul>
            </div>

            {/* ── Nút hành động ── */}
            <div className="space-y-3">
              {/* Thanh toán ngay nếu còn pending */}
              {isPending && (
                <button
                  onClick={() => startQrPayment(apt.id, displayAmount)}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 hover:shadow-xl transition flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Thanh toán ngay (VNPay)
                </button>
              )}

              <Link
                to="/my-bookings"
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 group"
              >
                <List className="w-5 h-5" />
                <span>Quản lý lịch đặt</span>
                <ArrowRight className="w-5 h-5 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
              </Link>

              <Link
                to="/"
                className="w-full border-2 border-slate-200 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition flex items-center justify-center gap-2 text-slate-700"
              >
                <Home className="w-5 h-5" />
                Về trang chủ
              </Link>
            </div>

            {/* ── Hỗ trợ ── */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500 mb-3">Cần hỗ trợ?</p>
              <div className="flex flex-wrap justify-center gap-6">
                <a href="tel:1900000000" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm">
                  <Phone className="w-4 h-4" />1900 0000
                </a>
                <a href="mailto:support@example.com" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm">
                  <Mail className="w-4 h-4" />support@example.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── QR Payment Modal ── */}
      {showQr && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-[420px] max-w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Thanh toán VNPay</h3>
              <button onClick={() => { setShowQr(false); if (pollingRef.current) clearInterval(pollingRef.current); }} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="flex flex-col items-center gap-4 text-center">
              {paymentUrl ? (
                <>
                  <p className="text-sm text-slate-600">Bạn sẽ được chuyển đến trang VNPay. Hoàn tất giao dịch và trang sẽ tự cập nhật.</p>
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => window.location.href = paymentUrl} className="px-5 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition">Mở VNPay</button>
                    <button onClick={() => { navigator.clipboard.writeText(paymentUrl); toast.success('Đã sao chép!'); }} className="px-4 py-3 bg-slate-100 rounded-xl font-medium hover:bg-slate-200 transition">Sao chép link</button>
                  </div>
                </>
              ) : (
                <div className="py-8 flex items-center gap-3 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin" />Đang tạo giao dịch...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}