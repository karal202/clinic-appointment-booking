import { useState } from 'react';
import authService from '../services/authService';

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1); // 1: nhập email, 2: nhập OTP + password mới
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Reset khi đóng modal
  const handleClose = () => {
    setStep(1);
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    onClose();
  };

  // Bước 1: Gửi OTP
  const handleSendOTP = async () => {
    setError('');
    setSuccess('');

    if (!email) {
      return setError('Vui lòng nhập email');
    }
    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      return setError('Email không hợp lệ');
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSuccess('Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư!');
      setTimeout(() => {
        setStep(2);
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gửi OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Đặt lại mật khẩu
  const handleResetPassword = async () => {
    setError('');
    setSuccess('');

    if (!otp || !newPassword || !confirmPassword) {
      return setError('Vui lòng điền đầy đủ thông tin');
    }
    if (otp.length !== 6) {
      return setError('Mã OTP phải có 6 chữ số');
    }
    if (newPassword.length < 6) {
      return setError('Mật khẩu phải từ 6 ký tự trở lên');
    }
    if (newPassword !== confirmPassword) {
      return setError('Mật khẩu xác nhận không khớp');
    }

    setLoading(true);
    try {
      await authService.resetPassword({
        email,
        otp,
        newPassword
      });
      setSuccess('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.');
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra mã OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Nhấn Enter
  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter' && !loading) action();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
        {/* Nút đóng */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* BƯỚC 1: NHẬP EMAIL */}
        {step === 1 && (
          <>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Quên mật khẩu</h2>
            <p className="text-gray-600 mb-6">
              Nhập email của bạn để nhận mã OTP đặt lại mật khẩu
            </p>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl mb-4 text-sm">
                {success}
              </div>
            )}

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleSendOTP)}
              disabled={loading}
              placeholder="Nhập email của bạn"
              className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all mb-4"
            />

            <button
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
            </button>
          </>
        )}

        {/* BƯỚC 2: NHẬP OTP VÀ MẬT KHẨU MỚI */}
        {step === 2 && (
          <>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Đặt lại mật khẩu</h2>
            <p className="text-gray-600 mb-6">
              Nhập mã OTP đã gửi đến <span className="font-semibold text-blue-600">{email}</span>
            </p>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl mb-4 text-sm">
                {success}
              </div>
            )}

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  Mã OTP (6 số)
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={loading}
                  maxLength="6"
                  placeholder="000000"
                  className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center text-2xl tracking-widest font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleResetPassword)}
                  disabled={loading}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 hover:shadow-lg transition-all disabled:opacity-70"
              >
                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </button>

              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all disabled:opacity-70"
              >
                Gửi lại mã OTP
              </button>

              <button
                onClick={() => setStep(1)}
                disabled={loading}
                className="w-full text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                ← Quay lại nhập email
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}