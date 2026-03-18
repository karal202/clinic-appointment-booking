import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import authService from '../services/authService';
import ForgotPasswordModal from '../components/ForgotPassWordModal';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // ĐĂNG NHẬP - backend nhận email và password
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // ĐĂNG KÝ
  const [signupData, setSignupData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Xử lý input
  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSignupChange = (e) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
    setError('');
  };

  // ==================== ĐĂNG NHẬP ====================
  const handleLogin = async () => {
    setError('');
    setSuccess('');

    if (!loginData.email || !loginData.password) {
      return setError('Vui lòng nhập email và mật khẩu');
    }

    setLoading(true);
    try {
      const response = await authService.login(loginData);
      
      setSuccess('Đăng nhập thành công! Đang chuyển trang...');
      setTimeout(() => {
        const role = response.user.role;
        if (role === 'ADMIN') {
          navigate('/admin');
        } else if (role === 'DOCTOR') {
          navigate('/doctor');
        } else if (role === 'STAFF') {
          navigate('/staff');
        } else {
          navigate('/');
        }
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Sai email hoặc mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  // ==================== ĐĂNG KÝ ====================
  const handleSignup = async () => {
    setError('');
    setSuccess('');

    if (!signupData.fullName || !signupData.phoneNumber || !signupData.email || !signupData.password) {
      return setError('Vui lòng điền đầy đủ thông tin');
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      return setError('Mật khẩu xác nhận không khớp');
    }
    
    if (signupData.password.length < 6) {
      return setError('Mật khẩu phải từ 6 ký tự trở lên');
    }
    
    // Validate số điện thoại Việt Nam
    const cleanPhone = signupData.phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (!/^(0[3|5|7|8|9]|84[3|5|7|8|9])[0-9]{8}$/.test(cleanPhone)) {
      return setError('Số điện thoại không hợp lệ');
    }
    
    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(signupData.email)) {
      return setError('Email không hợp lệ');
    }

    setLoading(true);
    try {
      const response = await authService.register({
        fullName: signupData.fullName,
        phoneNumber: signupData.phoneNumber,
        email: signupData.email,
        password: signupData.password
      });

      setSuccess('Đăng ký thành công! Chào mừng bạn đến với Clinic Booking System');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  // ==================== GOOGLE LOGIN ====================
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const response = await authService.googleLogin(credentialResponse.credential);
      
      setSuccess('Đăng nhập Google thành công!');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError('Đăng nhập Google thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Đăng nhập Google thất bại');
  };

  // Nhấn Enter để submit
  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter' && !loading) action();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4 overflow-hidden">
      {/* FORGOT PASSWORD MODAL */}
      <ForgotPasswordModal 
        isOpen={showForgotPassword} 
        onClose={() => setShowForgotPassword(false)} 
      />

      {/* CARD CHÍNH */}
      <div className="relative w-full max-w-5xl h-[680px] bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden">

        {/* 2 FORM ĐỨNG YÊN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full z-10 relative">

          {/* === FORM ĐĂNG NHẬP === */}
          <div className="p-8 lg:p-16 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full space-y-6">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-gray-800 mb-3">Chào mừng trở lại!</h2>
                <p className="text-gray-600">Đăng nhập để đặt lịch khám bệnh</p>
              </div>

              {error && isLogin && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-center text-sm">
                  {error}
                </div>
              )}
              {success && isLogin && (
                <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-center text-sm">
                  {success}
                </div>
              )}

              <div className="space-y-4">
                <input
                  type="email"
                  name="email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  onKeyPress={(e) => handleKeyPress(e, handleLogin)}
                  disabled={loading}
                  placeholder="Email"
                  className="w-full px-5 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all"
                />
                <input
                  type="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  onKeyPress={(e) => handleKeyPress(e, handleLogin)}
                  disabled={loading}
                  placeholder="Mật khẩu"
                  className="w-full px-5 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
              </button>

              {/* FORGOT PASSWORD LINK */}
              <div className="text-center">
                <button
                  onClick={() => setShowForgotPassword(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline transition-colors"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* GOOGLE LOGIN */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Hoặc</span>
                </div>
              </div>

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                />
              </div>
            </div>
          </div>

          {/* === FORM ĐĂNG KÝ === */}
          <div className="p-8 lg:p-12 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full space-y-6">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-gray-800 mb-3">Tạo tài khoản mới</h2>
                <p className="text-gray-600">Miễn phí 100% – Chỉ 30 giây</p>
              </div>

              {error && !isLogin && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-center text-sm">
                  {error}
                </div>
              )}
              {success && !isLogin && (
                <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-center text-sm">
                  {success}
                </div>
              )}

              <div className="space-y-4">
                <input 
                  type="text" 
                  name="fullName" 
                  value={signupData.fullName} 
                  onChange={handleSignupChange} 
                  disabled={loading}
                  placeholder="Họ và tên" 
                  className="w-full px-5 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all" 
                />
                <input 
                  type="tel" 
                  name="phoneNumber" 
                  value={signupData.phoneNumber} 
                  onChange={handleSignupChange} 
                  disabled={loading}
                  placeholder="Số điện thoại" 
                  className="w-full px-5 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all" 
                />
                <input 
                  type="email" 
                  name="email" 
                  value={signupData.email} 
                  onChange={handleSignupChange} 
                  disabled={loading}
                  placeholder="Email" 
                  className="w-full px-5 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all" 
                />
                <input 
                  type="password" 
                  name="password" 
                  value={signupData.password} 
                  onChange={handleSignupChange} 
                  disabled={loading}
                  placeholder="Mật khẩu (tối thiểu 6 ký tự)" 
                  className="w-full px-5 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all" 
                />
                <input
                  type="password"
                  name="confirmPassword"
                  value={signupData.confirmPassword}
                  onChange={handleSignupChange}
                  onKeyPress={(e) => handleKeyPress(e, handleSignup)}
                  disabled={loading}
                  placeholder="Xác nhận mật khẩu"
                  className="w-full px-5 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all"
                />
              </div>

              <button
                onClick={handleSignup}
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-70 shadow-lg"
              >
                {loading ? 'Đang tạo tài khoản...' : 'Đăng Ký Ngay'}
              </button>
            </div>
          </div>
        </div>

        {/* PANEL TRƯỢT */}
        <div className={`absolute top-0 left-0 h-full w-full lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700
          flex items-center justify-center transition-transform duration-700 ease-in-out 
          ${isLogin ? 'translate-x-full' : 'translate-x-0'}
          rounded-3xl shadow-2xl pointer-events-none z-20`}>

          <div className="text-center text-white px-12 relative z-10 max-w-md">
            {isLogin ? (
              <>
                <div className="mb-8">
                  <div className="w-20 h-20 mx-auto mb-6 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-xl">
                    <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h2 className="text-4xl font-extrabold mb-4 drop-shadow-2xl">
                    Chào mừng bạn!
                  </h2>
                  <p className="text-lg opacity-95 leading-relaxed mb-2">
                    Chưa có tài khoản?
                  </p>
                  <p className="text-base opacity-90 leading-relaxed">
                    Đăng ký ngay để bắt đầu đặt lịch<br />khám bệnh trực tuyến
                  </p>
                </div>
                <button
                  onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
                  className="px-10 py-3 bg-white text-blue-600 font-bold rounded-full hover:bg-blue-50 hover:scale-105 transform transition-all shadow-2xl pointer-events-auto"
                >
                  Tạo tài khoản mới
                </button>
              </>
            ) : (
              <>
                <div className="mb-8">
                  <div className="w-20 h-20 mx-auto mb-6 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-xl">
                    <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <h2 className="text-4xl font-extrabold mb-4 drop-shadow-2xl">
                    Chào bạn!
                  </h2>
                  <p className="text-lg opacity-95 leading-relaxed mb-2">
                    Đã có tài khoản?
                  </p>
                  <p className="text-base opacity-90 leading-relaxed">
                    Đăng nhập để tiếp tục quản lý<br />lịch khám bệnh của bạn
                  </p>
                </div>
                <button
                  onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
                  className="px-10 py-3 bg-white text-blue-600 font-bold rounded-full hover:bg-blue-50 hover:scale-105 transform transition-all shadow-2xl pointer-events-auto"
                >
                  Đăng nhập ngay
                </button>
              </>
            )}
          </div>

          {/* Hiệu ứng bong bóng */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            <div className="absolute top-10 left-10 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse animation-delay-1000" />
          </div>
        </div>

      </div>
    </div>
  );
}