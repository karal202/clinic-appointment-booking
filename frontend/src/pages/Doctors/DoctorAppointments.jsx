import { useState, useEffect } from 'react';
import { 
    Users, 
    Calendar, 
    CheckCircle, 
    XCircle, 
    Search,
    Clock,
    ClipboardList,
    Filter,
    ChevronRight,
    Loader2,
    Activity
} from 'lucide-react';
import { doctorAPI, getCurrentUser } from '../../utils/api';
import DoctorLayout from '../../layouts/DoctorLayout';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import webSocketService from '../../services/websocket';

export default function DoctorAppointments() {
    const [loading, setLoading] = useState(true); // Initial load only
    const [data, setData] = useState([]);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [doctor, setDoctor] = useState(null);
    const user = getCurrentUser();
    const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            try {
                // Initial load: show loader
                setLoading(true);
                const res = await doctorAPI.getMe();
                console.debug('API GET /doctors/me', res.data);
                setDoctor(res.data);
                await loadAppointments(res.data.id);
            } catch (err) {
                console.error('GET /doctors/me failed', err);
                toast.error('Không thể xác thực thông tin bác sĩ');
            } finally {
                setLoading(false);
            }
        };
        if (user) init();
    }, []);

    useEffect(() => {
        if (!doctor?.id) return;

        // Periodic background refresh: NO loader
        const interval = setInterval(async () => {
            try {
                // Refresh doctor info (room assignment)
                const docRes = await doctorAPI.getMe();
                setDoctor(docRes.data);
                
                // Refresh appointments
                const appRes = await doctorAPI.getAppointments(doctor.id);
                setData(appRes.data);
            } catch (err) {
                console.error('Background refresh failed', err);
            }
        }, 15000); // 15s for smoother feel

        // Realtime: subscribe to doctor / appointment updates so UI updates immediately
        try {
            webSocketService.connect();

            const onDoctorUpdate = (payload) => {
                console.debug('WS doctor update payload', payload);
                // payload comes from backend mapToDTO(Doctor) — use id from payload to avoid closure issues
                if (!payload || !payload.id) return;
                if (payload.id === doctor.id) {
                    // show small toast and refresh
                    if (payload.workingRoom && payload.workingRoom !== doctor?.workingRoom) {
                        toast.success(`Phòng đã được gán: ${payload.workingRoom}`);
                    }
                    setDoctor(payload);
                    loadAppointments(payload.id);
                }
            };

            const onAppointmentUpdate = (payload) => {
                console.debug('WS appointment update payload', payload);
                if (!payload || !payload.doctor || !payload.doctor.id) return;
                if (payload.doctor.id === doctor?.id) {
                    // if assignedRoom changed or status changed, refresh list
                    loadAppointments(payload.doctor.id);
                }
            };

            webSocketService.setDoctorUpdateHandler(onDoctorUpdate);
            webSocketService.setAppointmentUpdateHandler(onAppointmentUpdate);

            // cleanup: unregister handlers and disconnect when doctor changes/unmount
            const cleanup = () => {
                webSocketService.setDoctorUpdateHandler(null);
                webSocketService.setAppointmentUpdateHandler(null);
                try { webSocketService.disconnect(); } catch (e) {}
            };

            return () => {
                clearInterval(interval);
                cleanup();
            };
        } catch (err) {
            return () => clearInterval(interval);
        }
    }, [doctor?.id]);

    const loadAppointments = async (doctorId) => {
        try {
            const res = await doctorAPI.getAppointments(doctorId);
            console.debug('API GET /appointments/doctor/' + doctorId, res.data);
            setData(res.data);
        } catch (err) {
            console.error('Failed loading appointments for doctor', doctorId, err);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await doctorAPI.updateAppointmentStatus(id, status);
            toast.success(`Đã cập nhật trạng thái: ${status}`);
            if (doctor) loadAppointments(doctor.id);
        } catch (err) {
            toast.error('Lỗi khi cập nhật');
        }
    };

    const filteredData = data.filter(item => {
        const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
        const nameToSearch = item.patientName || item.userName || "";
        const matchesSearch = nameToSearch.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             item.appointmentCode?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'CONFIRMED': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'CHECKED_IN': return 'bg-emerald-50 text-emerald-600 border-emerald-200 animate-pulse';
            case 'COMPLETED': return 'bg-slate-900 text-white border-slate-900';
            case 'CANCELLED': return 'bg-rose-50 text-rose-500 border-rose-100';
            default: return 'bg-slate-50 text-slate-400 border-slate-100';
        }
    };

    return (
        <DoctorLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section with Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 justify-between items-center">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input 
                                type="text" 
                                placeholder="Tìm bệnh nhân, mã lịch hẹn..."
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none font-bold transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            <Filter className="text-slate-400 shrink-0" size={18} />
                            {['ALL', 'CHECKED_IN', 'CONFIRMED', 'COMPLETED'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                                        filterStatus === status 
                                        ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]' 
                                        : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'
                                    }`}
                                >
                                    {status === 'ALL' ? 'Tất cả' : status === 'CHECKED_IN' ? 'Chờ khám' : status}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-100">
                        <Activity className="absolute bottom-[-10px] right-[-10px] text-white/10" size={120} />
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Đang trực tại</p>
                        <h4 className="text-3xl font-black mb-2">{doctor?.workingRoom || 'Chưa gán phòng'}</h4>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            <p className="text-xs font-bold">Số bệnh nhân chờ: {data.filter(a => a.status === 'CHECKED_IN').length}</p>
                        </div>
                    </div>
                </div>

                {/* Main List */}
                <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông tin Bệnh nhân</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian đặt</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="px-10 py-24 text-center">
                                            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                                            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Đang tải danh sách lịch hẹn...</p>
                                        </td>
                                    </tr>
                                ) : filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-10 py-24 text-center">
                                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Users className="w-12 h-12 text-slate-200" />
                                            </div>
                                            <h4 className="text-2xl font-black text-slate-900 mb-2">Không tìm thấy dữ liệu</h4>
                                            <p className="font-bold text-slate-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                                        </td>
                                    </tr>
                                ) : filteredData.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-white rounded-2xl flex flex-col items-center justify-center text-indigo-600 font-black border-2 border-slate-50 shadow-sm group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300">
                                                    <span className="text-[8px] uppercase leading-none mb-0.5">STT</span>
                                                    <span className="text-xl leading-none">{item.queueNumber || '--'}</span>
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.patientName || item.userName}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Mã: {item.appointmentCode}</p>
                                                    {item.assignedRoom && (
                                                        <p className="text-xs font-bold text-emerald-600 mt-1">Phòng: {item.assignedRoom}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                                                    <Clock size={14} className="text-indigo-600" />
                                                    {item.appointmentTime?.substring(0, 5)}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    <Calendar size={12} />
                                                    {item.appointmentDate}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex justify-center">
                                                <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${getStatusStyle(item.status)}`}>
                                                    {item.status === 'CHECKED_IN' ? 'Đã Check-in' : item.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                                {(item.status === 'CHECKED_IN' || item.status === 'CONFIRMED') && (
                                                    <button 
                                                        onClick={() => navigate(`/doctor/records/create/${item.id}`)}
                                                        className="flex items-center gap-3 bg-slate-900 text-white px-8 py-3.5 rounded-2xl hover:bg-indigo-600 transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200"
                                                    >
                                                        <ClipboardList size={18} />
                                                        Bắt đầu khám
                                                    </button>
                                                )}
                                                
                                                <button 
                                                    onClick={() => navigate(`/doctor/appointments/${item.id}`)}
                                                    className="p-3.5 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-2xl transition-all border border-slate-100"
                                                >
                                                    <ChevronRight size={20} />
                                                </button>


                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DoctorLayout>
    );
}
