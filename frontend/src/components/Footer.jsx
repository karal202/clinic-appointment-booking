import { Link } from 'react-router-dom';
import { 
  Shield, 
  Phone, 
  MapPin, 
  Heart, 
  Mail,
  Clock,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  ChevronRight,
  Calendar,
  FileText,
  HelpCircle,
  Building
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Cột 1: Về chúng tôi */}
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">clinic-booking</h3>
                <p className="text-xs text-blue-300">Hệ thống Y tế thông minh</p>
              </div>
            </div>
            <p className="text-gray-300 mb-5 leading-relaxed text-sm">
              Hệ thống đặt lịch khám bệnh trực tuyến hàng đầu Việt Nam, 
              mang đến dịch vụ chăm sóc sức khỏe tốt nhất cho gia đình bạn.
            </p>
            <div className="flex gap-2.5">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/10 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all hover:scale-105"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/10 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all hover:scale-105"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/10 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all hover:scale-105"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/10 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all hover:scale-105"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Cột 2: Liên kết nhanh */}
          <div>
            <h4 className="text-base font-bold mb-5 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-blue-400" />
              Liên kết nhanh
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link 
                  to="/" 
                  className="text-gray-300 hover:text-blue-400 transition flex items-center gap-2 group text-sm"
                >
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link 
                  to="/doctors" 
                  className="text-gray-300 hover:text-blue-400 transition flex items-center gap-2 group text-sm"
                >
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                  Đặt lịch khám
                </Link>
              </li>
              <li>
                <Link 
                  to="/me" 
                  className="text-gray-300 hover:text-blue-400 transition flex items-center gap-2 group text-sm"
                >
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                  Lịch của tôi
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Hỗ trợ */}
          <div>
            <h4 className="text-base font-bold mb-5 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              Hỗ trợ
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link 
                  to="/faq" 
                  className="text-gray-300 hover:text-blue-400 transition flex items-center gap-2 group text-sm"
                >
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link 
                  to="/guide" 
                  className="text-gray-300 hover:text-blue-400 transition flex items-center gap-2 group text-sm"
                >
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                  Hướng dẫn sử dụng
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  className="text-gray-300 hover:text-blue-400 transition flex items-center gap-2 group text-sm"
                >
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link 
                  to="/privacy" 
                  className="text-gray-300 hover:text-blue-400 transition flex items-center gap-2 group text-sm"
                >
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-gray-300 hover:text-blue-400 transition flex items-center gap-2 group text-sm"
                >
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Thông tin liên hệ */}
          <div>
            <h4 className="text-base font-bold mb-5 flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-400" />
              Liên hệ
            </h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3 group">
                <div className="w-9 h-9 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Hotline 24/7</p>
                  <a 
                    href="tel:19009999" 
                    className="font-bold text-base hover:text-blue-400 transition"
                  >
                    1900 9999
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 group">
                <div className="w-9 h-9 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Email</p>
                  <a 
                    href="mailto:support@tvnmedkit.vn" 
                    className="font-semibold hover:text-blue-400 transition break-all text-sm"
                  >
                    support@tvnmedkit.vn
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 group">
                <div className="w-9 h-9 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Giờ làm việc</p>
                  <p className="font-semibold text-sm">Thứ 2 - Chủ nhật</p>
                  <p className="text-xs text-gray-300">7:00 - 18:00</p>
                </div>
              </div>

              <div className="flex items-start gap-3 group">
                <div className="w-9 h-9 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Trụ sở chính</p>
                  <p className="font-semibold text-sm">
                    123 Nguyễn Huệ, Q.1, TP.HCM
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>© {currentYear} clinic-booking.</span>
              <span className="hidden sm:inline">Bản quyền thuộc về</span>
              <span className="font-semibold text-blue-400">clinic-booking Co., Ltd</span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 text-red-500" />
              <span>in Việt Nam</span>
              <span className="ml-2 px-2.5 py-1 bg-blue-600/20 rounded-full text-blue-400 font-semibold">
                v1.0.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
