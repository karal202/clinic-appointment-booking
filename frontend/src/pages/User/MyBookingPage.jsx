import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, MapPin, 
  RefreshCw, Loader2, ArrowRight, QrCode,
  X, CreditCard, Banknote, CheckCircle,
  Download, Share2, Smartphone
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AssistantButton from '../../components/AssistantButton';
import { userAPI, isLoggedIn } from '../../utils/api';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

export default function MyBookingPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  // QR Modal
  const [qrModal, setQrModal] = useState(null); // { appointment }
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Payment Popup
  const [payModal, setPayModal] = useState(null); // { appointment }
  const [payProvider, setPayProvider] = useState('VNPAY');
  const [payLoading, setPayLoading] = useState(false);

  const statusColors = {
    PENDING: 'bg-amber-100 text-amber-700 border border-amber-200',
    CONFIRMED: 'bg-blue-100 text-blue-700 border border-blue-200',
    CHECKED_IN: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    COMPLETED: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
    CANCELLED: 'bg-rose-100 text-rose-700 border border-rose-200',
  };

  const statusLabels = {
    PENDING: 'Chờ thanh toán',
    CONFIRMED: 'Đã xác nhận',
    CHECKED_IN: 'Đang xếp hàng khám',
    COMPLETED: 'Đã hoàn thành',
    CANCELLED: 'Đã hủy',
  };

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    document.title = "Lịch khám của tôi - clinic-booking";
    loadBookings();
  }, [navigate]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getMyBookings();
      setBookings(res.data || []);
    } catch {
      toast.error('Không thể tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return;
    try {
      await userAPI.cancelAppointment(id);
      toast.success('Đã hủy lịch hẹn');
      loadBookings();
    } catch {
      toast.error('Lỗi khi hủy lịch');
    }
  };

  // ── Generate QR (JSON payload để staff scanner đọc dễ hơn) ──
  const openQrModal = async (item) => {
    setQrModal(item);
    setQrDataUrl('');
    try {
      // Nhúng nhiều thông tin vào QR để scanner nhận dạng chính xác hơn
      const qrPayload = JSON.stringify({
        appointmentCode: item.appointmentCode,
        patientName: item.patientName,
        doctorName: item.doctor?.fullName,
        date: item.appointmentDate,
        time: item.appointmentTime,
      });
      const url = await QRCode.toDataURL(qrPayload, {
        width: 300,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
        errorCorrectionLevel: 'M', // M thay vì H để QR ít phức tạp hơn khi có nhiều data
      });
      setQrDataUrl(url);
    } catch {
      toast.error('Không tạo được mã QR');
    }
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-checkin-${qrModal?.appointmentCode}.png`;
    a.click();
  };

  // ── Pay Online ───────────────────────────────────────────
  const openPayModal = (item) => {
    setPayModal(item);
    setPayProvider('VNPAY');
  };

  const handlePay = async () => {
    if (!payModal) return;
    setPayLoading(true);
    try {
      // Dùng feeMin của bác sĩ làm amount (hoặc 0 nếu chưa có)
      const amount = payModal.doctor?.feeMin || 0;
      const res = payProvider === 'MOMO'
        ? await userAPI.createMomoPayment(payModal.id, amount)
        : await userAPI.createVnPayPayment(payModal.id, amount);
      if (res?.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        toast.error('Không lấy được đường dẫn thanh toán');
      }
    } catch {
      toast.error('Lỗi khi tạo giao dịch thanh toán');
    } finally {
      setPayLoading(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────
  // CONFIRMED + paymentStatus PAID → show QR (đã thanh toán online)
  const isOnlinePaid = (item) =>
    item.status === 'CONFIRMED' && item.paymentStatus === 'PAID';

  // PENDING → show Pay button
  const isPendingPayment = (item) => item.status === 'PENDING';

  const totalBookings = bookings.length;
  const upcomingCount = bookings.filter(b =>
    ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(b.status)
  ).length;
  const completedCount = bookings.filter(b => b.status === 'COMPLETED').length;
  const cancelledCount = bookings.filter(b =>
    b.status === 'CANCELLED' || b.status === 'NO_SHOW'
  ).length;

  const filteredBookings = bookings.filter(b =>
    filterStatus === 'ALL' ? true : b.status === filterStatus
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 uppercase tracking-tight">Lịch khám của tôi</h1>
          <button onClick={loadBookings}
            className="flex items-center gap-2 text-blue-600 font-bold hover:bg-blue-50 px-4 py-2 rounded-xl transition-all">
            Làm mới <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-20 flex flex-col items-center justify-center border border-slate-100 shadow-sm">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-500">Đang tải danh sách lịch hẹn...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-100 shadow-sm">
            <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-800 mb-2 uppercase">Bạn chưa có lịch khám nào</h3>
            <p className="text-slate-500 mb-8">Đặt lịch khám ngay để được chăm sóc sức khỏe tốt nhất.</p>
            <Link to="/doctors"
              className="inline-flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-extrabold shadow-lg shadow-blue-200 hover:bg-blue-700 transition">
              Tìm bác sĩ ngay <ArrowRight size={20} />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng lịch đặt</p>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-slate-900">{totalBookings}</span>
                  <Calendar size={22} className="text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sắp tới</p>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-slate-900">{upcomingCount}</span>
                  <Clock size={22} className="text-emerald-500" />
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hoàn thành</p>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-slate-900">{completedCount}</span>
                  <CheckCircle size={22} className="text-indigo-500" />
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Đã hủy / vắng</p>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-slate-900">{cancelledCount}</span>
                  <X size={22} className="text-rose-500" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'ALL', label: 'Tất cả' },
                  { key: 'PENDING', label: 'Chờ thanh toán' },
                  { key: 'CONFIRMED', label: 'Đã xác nhận' },
                  { key: 'CHECKED_IN', label: 'Đang khám' },
                  { key: 'COMPLETED', label: 'Đã hoàn thành' },
                  { key: 'CANCELLED', label: 'Đã hủy' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setFilterStatus(opt.key)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border transition-all ${
                      filterStatus === opt.key
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {filterStatus !== 'ALL' && (
                <button
                  onClick={() => setFilterStatus('ALL')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline underline-offset-4"
                >
                  Bỏ lọc
                </button>
              )}
            </div>

            {filteredBookings.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
                <p className="text-sm font-bold text-slate-700 mb-2">Không có lịch nào với bộ lọc hiện tại</p>
                <p className="text-xs text-slate-500 mb-4">
                  Thay đổi trạng thái lọc hoặc bỏ lọc để xem toàn bộ lịch hẹn.
                </p>
                <button
                  onClick={() => setFilterStatus('ALL')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all"
                >
                  Hiển thị tất cả
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredBookings.map(item => (
              <div key={item.id}
                className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-slate-200/40 border border-slate-50 hover:border-blue-200 transition-all flex flex-col md:flex-row gap-8 relative overflow-hidden group">

                {['CONFIRMED', 'COMPLETED'].includes(item.status) && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-[4rem] -mr-8 -mt-8 pointer-events-none" />
                )}

                {/* Left: status + time */}
                <div className="flex flex-col md:w-56 shrink-0 z-10">
                  <div className={`inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest mb-4 w-fit shadow-sm ${statusColors[item.status] || 'bg-slate-100 text-slate-500'}`}>
                    {statusLabels[item.status] || item.status}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-slate-900 font-extrabold text-2xl">
                      <Clock size={22} className="text-blue-600" />
                      {item.appointmentTime}
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 font-bold text-sm bg-slate-50 px-3 py-2 rounded-xl w-fit">
                      <Calendar size={16} className="text-slate-400" />
                      {new Date(item.appointmentDate).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })}
                    </div>
                  </div>

                  {/* QR checkin badge nếu đã thanh toán online */}
                  {isOnlinePaid(item) && (
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg w-fit">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Đã thanh toán online
                    </div>
                  )}
                </div>

                {/* Right: info + actions */}
                <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8 z-10">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
                        {item.doctor?.specialty?.name || 'Chuyên khoa'}
                      </h4>
                      <Link to={`/doctors/${item.doctor?.id}`}
                        className="text-2xl font-extrabold text-slate-900 mb-3 block hover:text-blue-700 transition-colors">
                        BS. {item.doctor?.fullName}
                      </Link>
                      <div className="flex items-start gap-3 mt-4">
                        <MapPin size={18} className="text-rose-500 shrink-0 mt-0.5" />
                        <div className="text-sm text-slate-600 font-medium leading-relaxed">
                          <span className="font-bold text-slate-900 block mb-0.5">{item.hospital?.name || 'clinic-booking Center'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 items-end">
                      {/* 1. QR Check-in: CONFIRMED + PAID online */}
                      {isOnlinePaid(item) && (
                        <button
                          onClick={() => openQrModal(item)}
                          className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-widest bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl transition-all shadow-lg shadow-blue-200 hover:scale-105 active:scale-95"
                        >
                          <QrCode size={16} />
                          Mã QR Check-in
                        </button>
                      )}

                      {/* 2. Thanh toán online: PENDING */}
                      {isPendingPayment(item) && (
                        <button
                          onClick={() => openPayModal(item)}
                          className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-widest bg-amber-500 hover:bg-amber-600 px-5 py-3 rounded-xl transition-all shadow-lg shadow-amber-200 hover:scale-105 active:scale-95"
                        >
                          <CreditCard size={16} />
                          Thanh toán online
                        </button>
                      )}

                      {/* 3. Hủy: PENDING or CONFIRMED */}
                      {(item.status === 'PENDING' || item.status === 'CONFIRMED') && (
                        <button
                          onClick={() => handleCancel(item.id)}
                          className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-widest border border-rose-200 bg-rose-50 px-4 py-2 rounded-xl hover:bg-rose-100 hover:border-rose-300 transition-all shadow-sm"
                        >
                          Hủy lịch
                        </button>
                      )}

                      {/* 4. Đặt lại: COMPLETED */}
                      {item.status === 'COMPLETED' && (
                        <Link to={`/doctors/${item.doctor?.id}`}
                          className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest border border-blue-200 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 hover:border-blue-300 transition-all shadow-sm">
                          Đặt lại
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AssistantButton />
      <Footer />

      {/* ── QR Check-in Modal ────────────────────────────────── */}
      {qrModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => setQrModal(null)} />
          <div className="relative z-10 bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-7 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">Mã QR Check-in</p>
                  <h3 className="text-xl font-black">{qrModal.appointmentCode}</h3>
                </div>
                <button onClick={() => setQrModal(null)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={22} />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-3 text-sm font-semibold text-blue-100">
                <Clock size={14} />
                {qrModal.appointmentTime} — {new Date(qrModal.appointmentDate).toLocaleDateString('vi-VN')}
              </div>
              <div className="mt-1 text-sm font-semibold text-blue-100">
                BS. {qrModal.doctor?.fullName}
              </div>
            </div>

            {/* QR Code */}
            <div className="p-8 flex flex-col items-center gap-6">
              {qrDataUrl ? (
                <div className="p-4 bg-white rounded-2xl shadow-lg border-2 border-slate-100">
                  <img src={qrDataUrl} alt="QR Code" className="w-52 h-52 object-contain" />
                </div>
              ) : (
                <div className="w-52 h-52 flex items-center justify-center bg-slate-50 rounded-2xl border-2 border-slate-100">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                </div>
              )}

              <div className="text-center">
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Xuất trình mã này tại quầy lễ tân để được<br />
                  <span className="font-bold text-slate-700">check-in không cần xếp hàng</span>
                </p>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={downloadQr}
                  disabled={!qrDataUrl}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest py-3.5 rounded-2xl transition-all disabled:opacity-40"
                >
                  <Download size={16} />
                  Lưu ảnh
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(qrModal.appointmentCode);
                    toast.success('Đã sao chép mã lịch hẹn');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-2xl transition-all"
                >
                  <Share2 size={16} />
                  Copy mã
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Pay Online Modal ─────────────────────────────────── */}
      {payModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => !payLoading && setPayModal(null)} />
          <div className="relative z-10 bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-7 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-amber-100 text-[10px] font-black uppercase tracking-widest mb-1">Thanh toán online</p>
                  <h3 className="text-xl font-black">Chọn phương thức</h3>
                </div>
                <button onClick={() => !payLoading && setPayModal(null)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={22} />
                </button>
              </div>
              <div className="mt-3 text-sm font-semibold text-amber-100">
                BS. {payModal.doctor?.fullName} — {payModal.appointmentTime} {new Date(payModal.appointmentDate).toLocaleDateString('vi-VN')}
              </div>
            </div>

            <div className="p-8 space-y-4">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-5">Chọn cổng thanh toán</p>

              {/* VNPay */}
              <button
                onClick={() => setPayProvider('VNPAY')}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
                  payProvider === 'VNPAY'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-slate-50 hover:border-blue-300'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${payProvider === 'VNPAY' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <QrCode size={22} />
                </div>
                <div className="text-left flex-1">
                  <p className="font-black text-slate-900">VNPay</p>
                  <p className="text-xs text-slate-500 mt-0.5">QR, ATM, VISA, Mastercard</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${payProvider === 'VNPAY' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                  {payProvider === 'VNPAY' && <CheckCircle size={12} className="text-white fill-white" />}
                </div>
              </button>

              {/* MoMo */}
              <button
                onClick={() => setPayProvider('MOMO')}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
                  payProvider === 'MOMO'
                    ? 'border-fuchsia-500 bg-fuchsia-50'
                    : 'border-slate-200 bg-slate-50 hover:border-fuchsia-300'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${payProvider === 'MOMO' ? 'bg-fuchsia-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <Smartphone size={22} />
                </div>
                <div className="text-left flex-1">
                  <p className="font-black text-slate-900">MoMo</p>
                  <p className="text-xs text-slate-500 mt-0.5">Ví điện tử, quét QR MoMo</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${payProvider === 'MOMO' ? 'border-fuchsia-500 bg-fuchsia-500' : 'border-slate-300'}`}>
                  {payProvider === 'MOMO' && <CheckCircle size={12} className="text-white fill-white" />}
                </div>
              </button>

              <button
                onClick={handlePay}
                disabled={payLoading}
                className={`w-full py-5 rounded-2xl font-black text-white text-sm uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg mt-2 ${
                  payProvider === 'MOMO'
                    ? 'bg-fuchsia-600 hover:bg-fuchsia-700 shadow-fuchsia-200'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                }`}
              >
                {payLoading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Đang tạo giao dịch...</>
                ) : (
                  <><CreditCard size={18} /> Thanh toán qua {payProvider}</>
                )}
              </button>

              <p className="text-center text-[10px] text-slate-400 font-medium">
                Bạn sẽ được chuyển hướng đến cổng thanh toán an toàn
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
