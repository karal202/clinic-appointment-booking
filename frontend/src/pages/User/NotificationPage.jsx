import { useState, useEffect } from 'react';
import { 
  Bell, CheckCircle, AlertCircle, Info, 
  Trash2, ChevronRight, Home, Loader2,
  Clock, CheckSquare
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AssistantButton from '../../components/AssistantButton';
import { userAPI, isLoggedIn } from '../../utils/api';
import toast from 'react-hot-toast';

export default function NotificationPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    document.title = "Thông báo - clinic-booking";
    loadNotifications();
  }, [navigate]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getMyNotifications();
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Lỗi tải thông báo:', err);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await userAPI.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Lỗi đánh dấu đã đọc:', err);
    }
  };

  const markAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.isRead);
      await Promise.all(unread.map(n => userAPI.markNotificationRead(n.id)));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc!');
    } catch (err) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-6 h-6 text-emerald-500" />;
      case 'warning': return <AlertCircle className="w-6 h-6 text-amber-500" />;
      default: return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
          <Link to="/" className="hover:text-blue-600 transition flex items-center gap-1">
            <Home size={14} /> Trang chủ
          </Link>
          <ChevronRight size={14} />
          <span className="text-slate-600 font-medium">Thông báo</span>
        </nav>

        <div className="flex items-center justify-between mb-10">
           <div>
              <h1 className="text-4xl font-extrabold text-slate-900 uppercase tracking-tight">Thông báo nâng cao</h1>
              <p className="text-slate-500 mt-1">Cập nhật những thông tin mới nhất về sức khỏe và lịch hẹn của bạn.</p>
           </div>
           {notifications.some(n => !n.isRead) && (
              <button 
                onClick={markAllRead}
                className="flex items-center gap-2 text-blue-600 font-bold hover:gap-3 transition-all text-sm"
              >
                 <CheckSquare size={18} /> Đọc tất cả
              </button>
           )}
        </div>

        {loading ? (
           <div className="bg-white rounded-[2.5rem] p-20 flex flex-col items-center justify-center border border-slate-100 shadow-sm">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className="text-slate-500">Đang đồng bộ thông báo...</p>
           </div>
        ) : notifications.length === 0 ? (
           <div className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-100 shadow-sm">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-white shadow-inner">
                 <Bell className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2 uppercase">Hộp thư trống</h3>
              <p className="text-slate-500">Bạn chưa nhận được bất kỳ thông báo nào.</p>
           </div>
        ) : (
           <div className="space-y-4">
              {notifications.map(n => (
                 <div 
                   key={n.id}
                   onClick={() => !n.isRead && markRead(n.id)}
                   className={`bg-white rounded-3xl p-6 border-2 transition-all cursor-pointer group shadow-sm hover:shadow-md ${n.isRead ? 'border-transparent' : 'border-blue-100 shadow-blue-50 bg-blue-50/20'}`}
                 >
                    <div className="flex gap-6">
                       <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center shadow-sm ${n.isRead ? 'bg-slate-50' : 'bg-white'}`}>
                          {getIcon(n.type)}
                       </div>
                       <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-2">
                             <h4 className={`text-lg font-bold uppercase tracking-tight ${n.isRead ? 'text-slate-700' : 'text-blue-900'}`}>{n.title}</h4>
                             {!n.isRead && <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-extrabold rounded-md uppercase tracking-widest animate-pulse">Mới</span>}
                          </div>
                          <p className={`text-sm leading-relaxed mb-4 ${n.isRead ? 'text-slate-500' : 'text-slate-700 font-medium'}`}>{n.message}</p>
                          <div className="flex items-center gap-4">
                             <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                <Clock size={14} />
                                {formatTime(n.createdAt)}
                             </div>
                             {n.isRead && (
                                <button className="text-[11px] font-bold text-rose-400 hover:text-rose-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                   <Trash2 size={12} /> Xóa
                                </button>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        )}
      </div>

      <AssistantButton />
      <Footer />
    </div>
  );
}
