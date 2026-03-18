import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw, MessageCircle, Loader2 } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AssistantButton from '../../components/AssistantButton';
import { userAPI } from '../../utils/api';

export default function BookingPaymentFailurePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [cancelling, setCancelling] = useState(false);

  // message & appointmentId từ query (redirect VNPay/Momo) hoặc từ state (navigate từ Confirm)
  const stateMessage = location.state?.message;
  const stateAppointmentId = location.state?.appointmentId;
  const queryMessage = searchParams.get('message');
  const queryAppointmentId = searchParams.get('appointmentId');

  const errorMessage = stateMessage || queryMessage || 'Giao dịch không thành công';
  const appointmentId = stateAppointmentId != null ? String(stateAppointmentId) : queryAppointmentId;

  const handleCancelPayment = useCallback(async () => {
    if (!appointmentId) return;
    setCancelling(true);
    try {
      await userAPI.cancelAppointment(Number(appointmentId));
    } catch (err) {
      console.error('Lỗi hủy lịch:', err);
    } finally {
      setCancelling(false);
    }
  }, [appointmentId]);

  // Tự động hủy lịch và giải phóng slot khi vào trang này (từ redirect VNPay/Momo hoặc từ Confirm)
  useEffect(() => {
    if (appointmentId) {
      handleCancelPayment();
    }
  }, [appointmentId, handleCancelPayment]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
        <div className="w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
            {/* Error Icon */}
            <div className="relative inline-flex mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center">
                <XCircle className="w-16 h-16 text-white" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Thanh toán thất bại
            </h1>

            {cancelling ? (
              <div className="flex items-center justify-center gap-2 text-blue-600 mb-8">
                <Loader2 className="w-5 h-5 animate-spin" />
                <p className="text-lg">Đang giải phóng slot...</p>
              </div>
            ) : (
              <>
                <p className="text-xl text-slate-600 mb-8">
                  Đã có lỗi xảy ra trong quá trình thanh toán
                </p>
              </>
            )}

            {/* Error Message */}
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8">
              <p className="text-sm text-red-700 mb-2">Lý do:</p>
              <p className="text-lg font-semibold text-red-900">
                {errorMessage}
              </p>
            </div>

            {/* Common Issues */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-8 text-left">
              <h3 className="font-bold text-amber-900 mb-3">
                Các nguyên nhân thường gặp:
              </h3>
              <ul className="text-amber-800 space-y-2 text-sm">
                <li>• Số dư tài khoản không đủ</li>
                <li>• Thông tin thẻ không chính xác</li>
                <li>• Hết hạn mức giao dịch</li>
                <li>• Bạn đã hủy giao dịch</li>
                <li>• Lỗi kết nối mạng</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              {appointmentId && (
                <button
                  onClick={() => navigate('/my-bookings')}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 hover:shadow-xl transition flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Xem lịch đặt & đặt lại
                </button>
              )}

              <button
                onClick={() => navigate('/my-bookings')}
                className="w-full border-2 border-slate-300 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Quay lại lịch đặt
              </button>

              <button
                onClick={() => navigate('/')}
                className="w-full text-slate-600 hover:text-slate-900 font-medium transition py-2"
              >
                Về trang chủ
              </button>
            </div>

            {/* Support */}
            <div className="mt-8 pt-8 border-t border-slate-200">
              <p className="text-slate-600 mb-3">Cần hỗ trợ?</p>
              <a
                href="tel:1900000000"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
              >
                <MessageCircle className="w-5 h-5" />
                Hotline: 1900 0000
              </a>
            </div>
          </div>
        </div>
      </div>

      <AssistantButton />
      <Footer />
    </div>
  );
}
