import { useState, useEffect } from 'react';
import { 
    Users, 
    Calendar, 
    ClipboardList, 
    TrendingUp, 
    Clock, 
    CheckCircle,
    ArrowRight
} from 'lucide-react';
import { doctorAPI, getCurrentUser } from '../../utils/api';
import DoctorLayout from '../../layouts/DoctorLayout';
import { Link } from 'react-router-dom';

export default function DoctorHome() {
    const user = getCurrentUser();
    const [doctor, setDoctor] = useState(null);
    const [stats, setStats] = useState({
        todayAppointments: 0,
        pendingAppointments: 0,
        totalPatients: 0,
        completedToday: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // First get the actual Doctor data (containing the correct doctor ID)
                const docRes = await doctorAPI.getMe();
                const doctorData = docRes.data;
                setDoctor(doctorData);

                // Then load stats using the doctor.id
                const res = await doctorAPI.getAppointments(doctorData.id);
                const appointments = res.data;
                const today = new Date().toISOString().split('T')[0];
                
                setStats({
                    todayAppointments: appointments.filter(a => a.appointmentDate === today).length,
                    pendingAppointments: appointments.filter(a => a.status === 'PENDING').length,
                    totalPatients: new Set(appointments.map(a => a.userId)).size,
                    completedToday: appointments.filter(a => a.appointmentDate === today && a.status === 'COMPLETED').length
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (user) loadInitialData();
    }, []); // Only load once on mount

    const StatCard = ({ label, value, icon: Icon, color, subValue }) => (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-6 hover:shadow-xl hover:shadow-indigo-50/50 transition-all group">
            <div className="flex items-center justify-between">
                <div className={`p-4 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-8 h-8 ${color.replace('bg-', 'text-')}`} />
                </div>
                <TrendingUp className="text-emerald-500 w-6 h-6" />
            </div>
            <div>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">{label}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black text-slate-900">{value}</p>
                    {subValue && <span className="text-slate-400 text-xs font-bold">{subValue}</span>}
                </div>
            </div>
        </div>
    );

    return (
        <DoctorLayout>
            <div className="max-w-7xl mx-auto space-y-12">
                <section>
                    <div className="flex items-end justify-between mb-10">
                        <div>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Xin chào, Bs. {doctor?.fullName?.split(' ').pop()}! 👋</h3>
                            <p className="text-lg font-bold text-slate-400">Hôm nay bạn có {stats.todayAppointments} lịch hẹn cần xử lý.</p>
                        </div>
                        <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                            <Clock className="text-indigo-600" size={20} />
                            <span className="text-sm font-black text-slate-700 uppercase tracking-tight">
                                {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long' })}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <StatCard 
                            label="Lịch hẹn hôm nay" 
                            value={stats.todayAppointments} 
                            icon={Calendar} 
                            color="bg-indigo-600" 
                            subValue="ca khám"
                        />
                        <StatCard 
                            label="Chờ xác nhận" 
                            value={stats.pendingAppointments} 
                            icon={Clock} 
                            color="bg-amber-500" 
                            subValue="yêu cầu"
                        />
                        <StatCard 
                            label="Tổng bệnh nhân" 
                            value={stats.totalPatients} 
                            icon={Users} 
                            color="bg-blue-600" 
                            subValue="người"
                        />
                        <StatCard 
                            label="Hoàn tất hôm nay" 
                            value={stats.completedToday} 
                            icon={CheckCircle} 
                            color="bg-emerald-500" 
                            subValue="ca"
                        />
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Quick Access */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center justify-between">
                            <h4 className="text-2xl font-black text-slate-900 tracking-tight">Thao tác nhanh</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <QuickLink 
                                to="/doctor/appointments" 
                                title="Danh sách lịch hẹn" 
                                desc="Quản lý và cập nhật trạng thái các ca khám."
                                icon={Users}
                                color="text-blue-600"
                                bg="bg-blue-50"
                            />
                            <QuickLink 
                                to="/doctor/schedules" 
                                title="Cấu hình lịch làm" 
                                desc="Thiết lập ngày nghỉ và giờ khám bệnh."
                                icon={Calendar}
                                color="text-indigo-600"
                                bg="bg-indigo-50"
                            />
                            <QuickLink 
                                to="/doctor/records" 
                                title="Lịch sử bệnh án" 
                                desc="Xem lại các hồ sơ đã tư vấn và điều trị."
                                icon={ClipboardList}
                                color="text-emerald-600"
                                bg="bg-emerald-50"
                            />
                        </div>
                    </div>

                    {/* Upcoming simple list or info */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20"></div>
                        <div className="relative z-10">
                            <h4 className="text-2xl font-black mb-6">Thông báo hệ thống</h4>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0"></div>
                                    <p className="text-sm font-bold text-slate-300 leading-relaxed">Cập nhật tính năng quản lý lịch nghỉ phép mới dành cho bác sĩ.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0"></div>
                                    <p className="text-sm font-bold text-slate-300 leading-relaxed">Hệ thống MedKit sắp có phiên bản di động vào tháng tới.</p>
                                </div>
                            </div>
                            <button className="mt-10 w-full bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-sm font-black transition-all border border-white/10">
                                Xem tất cả thông báo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DoctorLayout>
    );
}

function QuickLink({ to, title, desc, icon: Icon, color, bg }) {
    return (
        <Link to={to} className="flex gap-5 p-6 bg-white rounded-3xl border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50/30 transition-all group">
            <div className={`p-4 rounded-2xl ${bg} ${color} shrink-0 group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
            </div>
            <div>
                <h5 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
                    {title}
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h5>
                <p className="text-sm font-bold text-slate-400 leading-snug">{desc}</p>
            </div>
        </Link>
    );
}
