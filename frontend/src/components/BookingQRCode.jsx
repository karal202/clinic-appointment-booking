// src/components/BookingQRCode.js
import { useState, useEffect } from 'react';
import {
  QrCode, Download, Share2, X, Loader2,
  CheckCircle, AlertCircle, Calendar, Clock, RefreshCw, Info, Syringe
} from 'lucide-react';
import { userAPI } from '../utils/api';

export default function BookingQRCode({ booking, onClose }) {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadQRCode(); }, [booking?.id]);

  const loadQRCode = async () => {
    setLoading(true); setError('');
    try {
      const response = await userAPI.getBookingQR(booking.id);
      setQrData(response.data);
    } catch (err) {
      if (err.response?.data?.code === 'PAYMENT_REQUIRED') {
        setError('Vui lòng hoàn tất thanh toán trước khi xem QR code');
      } else {
        setError(err.message || 'Lỗi tải QR');
      }
    } finally { setLoading(false); }
  };

  const handleDownload = () => {
    if (!qrData?.qrCode) return;
    const link = document.createElement('a');
    link.href = qrData.qrCode;
    link.download = `QR_${booking.bookingCode}.png`;
    link.click();
  };

  const handleShare = async () => {
    if (!qrData?.qrCode) return;
    try {
      const res = await fetch(qrData.qrCode);
      const blob = await res.blob();
      const file = new File([blob], `QR_${booking.bookingCode}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: 'Mã QR Check-in', text: `Lịch ${booking.bookingCode}`, files: [file] });
      } else {
        alert('Thiết bị không hỗ trợ chia sẻ, vui lòng tải xuống.');
      }
    } catch (err) { console.error('Share error:', err); }
  };

  // Trạng thái hiển thị
  const STATUS = {
    confirmed:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  icon: CheckCircle, label: 'Đã xác nhận' },
    checked_in: { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   icon: CheckCircle, label: 'Đã check-in' },
    completed:  { bg: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-700',icon: CheckCircle, label: 'Hoàn thành' },
    paid_pending:{ bg: 'bg-blue-50',  border: 'border-blue-200',   text: 'text-blue-700',   icon: Clock,       label: 'Chờ xác nhận' },
  };

  const statusCfg = STATUS[qrData?.status] || STATUS[booking?.status];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <QrCode className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Mã QR Check-in</h2>
              <p className="text-xs text-gray-500">Xuất trình tại quầy lễ tân</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* ── Booking info ── */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <Syringe className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{booking.childName}</p>
                <p className="text-xs font-mono text-blue-600 mb-2">{booking.bookingCode}</p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    {new Date(booking.slotDate).toLocaleDateString('vi-VN')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    {booking.slotTime?.slice(0, 5)}
                  </span>
                  {booking.vaccineName && (
                    <span className="text-green-600 font-medium">{booking.vaccineName} · Mũi {booking.doseNumber}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Status badge ── */}
          {statusCfg && (
            <div className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border font-semibold text-sm ${statusCfg.bg} ${statusCfg.border} ${statusCfg.text}`}>
              <statusCfg.icon className="w-4 h-4" />
              {statusCfg.label}
            </div>
          )}

          {/* ── QR Content ── */}
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-600 mb-3" />
              <p className="text-gray-500 text-sm">Đang tải mã QR...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <button onClick={loadQRCode}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
                <RefreshCw className="w-4 h-4" />Thử lại
              </button>
            </div>
          ) : (
            <>
              {/* Thông báo paid_pending */}
              {qrData?.status === 'paid_pending' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 text-sm mb-0.5">QR đã sẵn sàng</p>
                    <p className="text-xs text-blue-700">
                      Bạn có thể lưu QR này ngay. Khi trung tâm xác nhận, QR vẫn có hiệu lực để check-in.
                    </p>
                  </div>
                </div>
              )}

              {/* QR Image */}
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6 flex items-center justify-center">
                <img
                  src={qrData.qrCode}
                  alt="QR Code Check-in"
                  className="w-52 h-52 object-contain"
                />
              </div>

              {/* Valid until */}
              {qrData.validUntil && (
                <p className="text-center text-xs text-gray-500">
                  Hiệu lực đến:{' '}
                  <span className="font-semibold text-gray-700">
                    {new Date(qrData.validUntil).toLocaleString('vi-VN', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </p>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleDownload}
                  className="py-3 bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition font-semibold text-sm">
                  <Download className="w-4 h-4" />Tải xuống
                </button>
                <button onClick={handleShare}
                  className="py-3 bg-gray-100 text-gray-700 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition font-semibold text-sm">
                  <Share2 className="w-4 h-4" />Chia sẻ
                </button>
              </div>

              {/* Note */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-blue-700">
                  💡 {qrData?.note || 'Xuất trình mã QR này tại quầy lễ tân để check-in nhanh chóng'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}