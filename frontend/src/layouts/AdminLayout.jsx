import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Hospital,
    Users,
    Stethoscope, 
    Settings,
    LogOut, 
    Bell,
    ChevronLeft,
    User,
    ShieldCheck
} from 'lucide-react';
import { logout, getCurrentUser } from '../utils/api';
import toast from 'react-hot-toast';

export default function AdminLayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const admin = getCurrentUser();

    const menuItems = [
        { path: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
        { path: '/admin/hospitals', label: 'Bệnh viện', icon: Hospital },
        { path: '/admin/doctors', label: 'Bác sĩ', icon: Stethoscope },
        { path: '/admin/specialties', label: 'Chuyên khoa', icon: ShieldCheck },
        { path: '/admin/users', label: 'Người dùng', icon: Users },
        { path: '/admin/staff', label: 'Nhân viên', icon: Users },
        { path: '/admin/settings', label: 'Cài đặt', icon: Settings },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
        toast.success('Đã đăng xuất');
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-20">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                            <ShieldCheck className="text-slate-900 w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">MedKit</h1>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Admin Portal</p>
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-4 mb-8 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-indigo-500/20 shadow-lg">
                                {admin?.fullName?.charAt(0) || 'A'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-white truncate">{admin?.fullName}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quản trị viên</p>
                            </div>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-5 py-4 rounded-xl text-sm font-bold transition-all duration-200 ${
                                location.pathname === item.path
                                    ? 'bg-white text-slate-900 shadow-xl translate-x-1'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-6 mt-auto">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-5 py-4 rounded-xl text-sm font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                        <LogOut size={20} />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-10 shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">
                            {menuItems.find(item => item.path === location.pathname)?.label || 'Quản lý'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative p-2.5 bg-slate-50 rounded-xl text-slate-500 hover:bg-slate-100 transition-all">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="h-8 w-px bg-slate-200"></div>
                        <div className="flex items-center gap-3 group">
                            <span className="text-sm font-bold text-slate-600">Admin</span>
                            <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold transition-all">
                                <User size={20} />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-10 bg-slate-50/50">
                    {children}
                </main>
            </div>
        </div>
    );
}
