import { useState, useEffect } from 'react';
import { 
    ClipboardCheck, 
    ArrowUp, 
    ArrowDown, 
    Clock, 
    User,
    CheckCircle2,
    Search,
    Loader2,
    Star,
    Stethoscope,
    Hospital
} from 'lucide-react';
import { staffAPI } from '../../utils/api';
import StaffLayout from '../../layouts/StaffLayout';
import toast from 'react-hot-toast';

export default function QueueManagement() {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await staffAPI.getAllAppointments();
            // Lọc ra những người đã check-in (Đang chờ khám)
            const checkedIn = res.data.filter(a => a.status === 'CHECKED_IN');
            // Sắp xếp theo STT (queueNumber)
            const sortedBySTT = checkedIn.sort((a, b) => (a.queueNumber || 0) - (b.queueNumber || 0));
            setQueue(sortedBySTT.map(a => ({ ...a, isPriority: false })));
        } catch (err) {
            toast.error('Lỗi khi tải danh sách hàng chờ');
        } finally {
            setLoading(false);
        }
    };

    const togglePriority = (id) => {
        setQueue(prev => {
            const item = prev.find(p => p.id === id);
            if (!item) return prev;
            return prev.map(p => p.id === id ? { ...p, isPriority: !p.isPriority } : p);
        });
        toast.success('Đã thay đổi trạng thái ưu tiên');
    };

    const moveUp = (index) => {
        if (index === 0) return;
        const newQueue = [...queue];
        [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
        setQueue(newQueue);
    };

    const moveDown = (index) => {
        if (index === queue.length - 1) return;
        const newQueue = [...queue];
        [newQueue[index + 1], newQueue[index]] = [newQueue[index], newQueue[index + 1]];
        setQueue(newQueue);
    };

    const sortedQueue = [...queue].sort((a, b) => {
        if (a.isPriority && !b.isPriority) return -1;
        if (!a.isPriority && b.isPriority) return 1;
        return 0; // Maintain current order otherwise
    });

    return (
        <StaffLayout>
            <div className="max-w-7xl mx-auto space-y-10">
                <header>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Hàng chờ Khám bệnh 📋</h3>
                    <p className="text-slate-500 font-bold text-sm">Sắp xếp thứ tự ưu tiên cho bệnh nhân đã có mặt tại quầy.</p>
                </header>

                <div className="grid grid-cols-1 gap-6">
                    {loading ? (
                        <div className="bg-white rounded-[3rem] p-20 text-center border border-emerald-50">
                            <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-sm text-emerald-800">Đang sắp xếp hàng chờ...</p>
                        </div>
                    ) : sortedQueue.length === 0 ? (
                        <div className="bg-white rounded-[3rem] p-20 text-center border border-emerald-50">
                            <ClipboardCheck className="w-16 h-16 text-emerald-100 mx-auto mb-6" />
                            <h4 className="text-2xl font-black text-slate-900 mb-2">Hàng chờ trống</h4>
                            <p className="text-slate-400 font-bold">Chưa có bệnh nhân nào thực hiện Check-in tại quầy.</p>
                        </div>
                    ) : (
                        sortedQueue.map((patient, index) => (
                            <div 
                                key={patient.id} 
                                className={`bg-white rounded-[2.5rem] p-8 border shadow-sm transition-all duration-300 flex items-center gap-8 group ${patient.isPriority ? 'border-amber-200 bg-amber-50/20' : 'border-slate-100 hover:border-emerald-200'}`}
                            >
                                <div className={`w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center border shadow-inner ${patient.isPriority ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                                    <span className="text-[10px] font-black uppercase tracking-tighter leading-none mb-1">STT</span>
                                    <span className="text-3xl font-black leading-none">{patient.queueNumber || index + 1}</span>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h5 className="text-xl font-black text-slate-900 uppercase tracking-tight">{patient.patientName}</h5>
                                        <span className="text-xs font-bold text-slate-400">({patient.appointmentCode})</span>
                                        {patient.isPriority && (
                                            <span className="flex items-center gap-1 bg-amber-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
                                                <Star size={10} fill="white" /> Ưu tiên khám sớm
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-slate-500 text-sm font-bold">
                                        <span className="flex items-center gap-2">
                                            <Clock size={16} className="text-emerald-600" />
                                            Tiếp nhận: {patient.appointmentTime?.substring(0, 5)}
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <Stethoscope size={16} className="text-emerald-600" />
                                            Bác sĩ: {patient.doctor?.fullName}
                                        </span>
                                        {patient.assignedRoom && (
                                            <span className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">
                                                <Hospital size={16} />
                                                Phòng: {patient.assignedRoom}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => togglePriority(patient.id)}
                                        className={`p-4 rounded-2xl transition-all ${patient.isPriority ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-400 hover:bg-amber-100 hover:text-amber-600'}`}
                                        title="Đánh dấu ưu tiên"
                                    >
                                        <Star size={20} fill={patient.isPriority ? "white" : "none"} />
                                    </button>
                                    <div className="h-10 w-px bg-slate-100 mx-2"></div>
                                    <div className="flex flex-col gap-2">
                                        <button 
                                            onClick={() => moveUp(index)}
                                            className="p-2.5 bg-slate-50 text-slate-400 hover:bg-emerald-600 hover:text-white rounded-xl transition-all"
                                        >
                                            <ArrowUp size={18} />
                                        </button>
                                        <button 
                                            onClick={() => moveDown(index)}
                                            className="p-2.5 bg-slate-50 text-slate-400 hover:bg-emerald-600 hover:text-white rounded-xl transition-all"
                                        >
                                            <ArrowDown size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </StaffLayout>
    );
}
