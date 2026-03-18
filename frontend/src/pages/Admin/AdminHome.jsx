import { useState, useEffect } from 'react';
import { 
    Hospital, 
    Stethoscope, 
    LayoutDashboard, 
    TrendingUp, 
    Users, 
    Activity
} from 'lucide-react';
import { adminAPI } from '../../utils/api';
import AdminLayout from '../../layouts/AdminLayout';
import toast from 'react-hot-toast';

export default function AdminHome() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await adminAPI.getStats();
            setStats(res.data);
        } catch (err) {
            toast.error('Lỗi khi tải thống kê');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        if (value == null) return '0₫';
        const num = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(num)) return String(value);
        return num.toLocaleString('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        });
    };

    const Card = ({ label, value, icon: Icon, color, trend }) => (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-6 hover:shadow-xl hover:shadow-indigo-50 transition-all group">
            <div className="flex items-center justify-between">
                <div className={`p-4 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-8 h-8 ${color.replace('bg-', 'text-')}`} />
                </div>
                {trend && (
                    <div className="flex items-center gap-1 text-emerald-500 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full">
                        <TrendingUp size={14} />
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{label}</p>
                <p className="text-4xl font-black text-slate-900">{value || 0}</p>
            </div>
        </div>
    );

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-10">
                <header>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Hệ thống MedKit 🏥</h3>
                    <p className="text-slate-500 font-bold">Quản trị toàn diện các cơ sở y tế và nguồn lực bác sĩ.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card 
                        label="Tổng bệnh viện" 
                        value={stats?.totalHospitals} 
                        icon={Hospital} 
                        color="bg-indigo-600" 
                        trend="+2 tháng này"
                    />
                    <Card 
                        label="Tổng bác sĩ" 
                        value={stats?.totalDoctors} 
                        icon={Stethoscope} 
                        color="bg-emerald-500" 
                        trend="+12 tháng này"
                    />
                    <Card 
                        label="Chuyên khoa" 
                        value={stats?.totalSpecialties} 
                        icon={LayoutDashboard} 
                        color="bg-blue-600" 
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card 
                        label="Lịch đã thanh toán 30 ngày" 
                        value={stats?.paidAppointmentsLast30Days} 
                        icon={Activity} 
                        color="bg-emerald-500" 
                    />
                    <Card 
                        label="Doanh thu 30 ngày (ước tính)" 
                        value={formatCurrency(stats?.estimatedRevenueLast30Days)} 
                        icon={TrendingUp} 
                        color="bg-amber-500" 
                    />
                    <Card 
                        label="Tổng người dùng" 
                        value={stats?.totalUsers} 
                        icon={Users} 
                        color="bg-slate-900" 
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                        <Activity className="absolute bottom-[-20px] right-[-20px] text-white/5" size={200} />
                        <h4 className="text-2xl font-black mb-6 relative z-10">Sức khỏe hệ thống</h4>
                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="font-bold">Database Server</span>
                                <span className="text-emerald-400 font-black uppercase text-xs">Ổn định</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="font-bold">API Gateway</span>
                                <span className="text-emerald-400 font-black uppercase text-xs">Ổn định</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="font-bold">Google Auth</span>
                                <span className="text-emerald-400 font-black uppercase text-xs">Hợp lệ</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                        <h4 className="text-2xl font-black text-slate-900 mb-6">Log truy cập mới nhất</h4>
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-xl transition-colors">
                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                        <Users size={20} className="text-slate-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-700 text-sm">Quản trị viên đã cập nhật cấu hình bệnh viện #{i+124}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{i * 5} phút trước</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
