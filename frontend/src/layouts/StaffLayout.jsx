import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Users, 
    ClipboardCheck, 
    MapPin,
    LogOut, 
    Bell,
    ChevronLeft,
    User,
    MonitorSmartphone
} from 'lucide-react';
import { logout, getCurrentUser } from '../utils/api';
import toast from 'react-hot-toast';

export default function StaffLayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const staff = getCurrentUser();

    const menuItems = [
        { path: '/staff', label: 'Tiếp nhận bệnh nhân', icon: Users },
        { path: '/staff/queue', label: 'Điều phối hàng chờ', icon: ClipboardCheck },
        { path: '/staff/rooms', label: 'Sắp xếp phòng bác sĩ', icon: MapPin },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
        toast.success('Đã đăng xuất');
    };

    return (
        <div className="flex h-screen bg-emerald-50/30 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-emerald-100 flex flex-col shadow-xl z-20">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                            <MonitorSmartphone className="text-white w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">MedKit</h1>
                            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Receptionist</p>
                        </div>
                    </div>

                    <div className="bg-emerald-50 rounded-2xl p-4 mb-8 border border-emerald-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-emerald-200 shadow-sm text-emerald-600 font-bold">
                                {staff?.fullName?.charAt(0) || 'S'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">{staff?.fullName}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nhân viên tiếp đón</p>
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
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 translate-x-1'
                                    : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
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
                        className="w-full flex items-center gap-3 px-5 py-4 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                        <LogOut size={20} />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-emerald-100 flex items-center justify-between px-10 shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-emerald-50 rounded-xl transition-colors text-slate-500"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">
                            {menuItems.find(item => item.path === location.pathname)?.label || 'Tiếp nhận'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative p-2.5 bg-emerald-50 rounded-xl text-emerald-600 hover:bg-emerald-100 transition-all">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="h-8 w-px bg-emerald-100"></div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-slate-600">Quầy tiếp đón</span>
                            <div className="w-10 h-10 bg-emerald-900 rounded-full flex items-center justify-center text-white font-bold transition-all">
                                <User size={20} />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-10">
                    {children}
                </main>
            </div>
        </div>
    );
}
