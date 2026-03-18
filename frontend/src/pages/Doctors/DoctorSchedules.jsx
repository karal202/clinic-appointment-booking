import { useState, useEffect } from 'react';
import { 
    Calendar, 
    Plus, 
    Trash2, 
    Clock, 
    MapPin, 
    Users,
    X,
    Save,
    CalendarOff,
    Loader2,
    Filter,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { doctorAPI, getCurrentUser } from '../../utils/api';
import DoctorLayout from '../../layouts/DoctorLayout';
import toast from 'react-hot-toast';

export default function DoctorSchedules() {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [doctor, setDoctor] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    
    const user = getCurrentUser();

    const [form, setForm] = useState({
        workDate: new Date().toISOString().split('T')[0],
        session: 'morning',
        startTime: '',
        endTime: '',
        maxPatients: 10,
        isAvailable: true,
        room: '',
        capacity: 1
    });

    useEffect(() => {
        const init = async () => {
            try {
                const res = await doctorAPI.getMe();
                setDoctor(res.data);
                loadData(res.data.id);
            } catch (err) {
                toast.error('Lỗi xác thực bác sĩ');
            }
        };
        if (user) init();
    }, []);

    const loadData = async (doctorId) => {
        setLoading(true);
        try {
            const res = await doctorAPI.getSchedules(doctorId);
            setSchedules(res.data.sort((a, b) => new Date(b.workDate) - new Date(a.workDate)));
        } catch (err) {
            toast.error('Lỗi khi tải lịch làm việc');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...form,
                doctorId: doctor.id,
                startTime: `${form.workDate}T${form.startTime}:00`,
                endTime: `${form.workDate}T${form.endTime}:00`,
                slotMinutes: 60,
                isAvailable: true
            };
            await doctorAPI.createSchedule(data);
            toast.success('Đã thêm lịch làm việc mới');
            setShowModal(false);
            loadData(doctor.id);
        } catch (err) {
            toast.error('Lỗi khi thêm lịch');
        }
    };

    const toggleAvailability = async (schedule) => {
        try {
            await doctorAPI.updateSchedule(schedule.id, {
                ...schedule,
                isAvailable: !schedule.isAvailable
            });
            toast.success(schedule.isAvailable ? 'Đã tạm ẩn (Nghỉ)' : 'Đã mở lại lịch');
            loadData(doctor.id);
        } catch (err) {
            toast.error('Lỗi khi cập nhật trạng thái');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa lịch này?')) return;
        try {
            await doctorAPI.deleteSchedule(id);
            toast.success('Đã xóa lịch làm việc');
            loadData(doctor.id);
        } catch (err) {
            toast.error('Lỗi khi xóa lịch');
        }
    };

    const filteredSchedules = schedules.filter(s => {
        const d = new Date(s.workDate);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const months = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    const changeMonth = (offset) => {
        let newMonth = selectedMonth + offset;
        let newYear = selectedYear;
        if (newMonth < 0) {
            newMonth = 11;
            newYear--;
        } else if (newMonth > 11) {
            newMonth = 0;
            newYear++;
        }
        setSelectedMonth(newMonth);
        setSelectedYear(newYear);
    };

    return (
        <DoctorLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Simplified Cleaner Header */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                            <Calendar size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Lịch trình làm việc</h3>
                            <p className="text-slate-400 font-bold text-sm">Quản lý thời gian khám bệnh của bạn</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white hover:text-indigo-600 rounded-xl transition-all text-slate-400">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="px-4 text-sm font-black text-slate-900 min-w-[140px] text-center uppercase tracking-widest">
                            {months[selectedMonth]} {selectedYear}
                        </div>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white hover:text-indigo-600 rounded-xl transition-all text-slate-400">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <button 
                        onClick={() => setShowModal(true)}
                        className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 flex items-center gap-3 uppercase text-xs tracking-widest"
                    >
                        <Plus size={18} />
                        Tạo lịch mới
                    </button>
                </div>

                {/* Schedule List */}
                {loading ? (
                    <div className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-100">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Đang đồng bộ dữ liệu...</p>
                    </div>
                ) : filteredSchedules.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-24 text-center border border-slate-100 border-dashed">
                        <CalendarOff className="w-20 h-20 text-slate-100 mx-auto mb-6" />
                        <h4 className="text-2xl font-black text-slate-900 mb-2">Không có lịch trong tháng này</h4>
                        <p className="text-slate-400 font-bold mb-8 max-w-sm mx-auto">Bạn chưa thiết lập lịch làm việc cho khoảng thời gian này. Hãy tạo lịch mới để bệnh nhân có thể đặt chỗ.</p>
                        <button 
                            onClick={() => setShowModal(true)}
                            className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                        >
                            Thiết lập ngay
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSchedules.map((s) => (
                            <div key={s.id} className={`bg-white rounded-[2.5rem] p-8 shadow-sm border transition-all duration-300 group relative ${s.isAvailable ? 'border-slate-100' : 'border-rose-100 bg-rose-50/10'}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-16 h-16 bg-slate-50 rounded-3xl flex flex-col items-center justify-center border border-slate-100 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                        <span className="text-2xl font-black">{new Date(s.workDate).getDate()}</span>
                                        <span className="text-[10px] font-black uppercase opacity-60">{new Date(s.workDate).toLocaleDateString('vi-VN', { weekday: 'short' })}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => toggleAvailability(s)}
                                            className={`p-3 rounded-2xl transition-all ${
                                                s.isAvailable 
                                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' 
                                                : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'
                                            }`}
                                            title={s.isAvailable ? 'Đang mở - Nhấn để ẩn' : 'Đang nghỉ - Nhấn để mở'}
                                        >
                                            <Calendar size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(s.id)}
                                            className="p-3 bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                                            <Clock size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Thời gian</p>
                                            <p className="text-sm font-black text-slate-700">{s.startTime?.split('T')[1]?.substring(0, 5)} - {s.endTime?.split('T')[1]?.substring(0, 5)}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                                            <MapPin size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Địa điểm</p>
                                            <p className="text-sm font-black text-slate-700">{s.room || 'Phòng khám đa năng'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-2">
                                            <Users size={14} className="text-slate-300" />
                                            <span className="text-xs font-bold text-slate-500">{s.maxPatients} lượt khám</span>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${s.isAvailable ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {s.isAvailable ? 'Đang hiển thị' : 'Đã ẩn'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal Thêm Lịch */}
                {showModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                                <h4 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Thiết lập lịch khám mới</h4>
                                <button onClick={() => setShowModal(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400">
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleCreate} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2 col-span-2 md:col-span-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Ngày tháng</label>
                                        <input 
                                            type="date" 
                                            required
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
                                            value={form.workDate}
                                            onChange={e => setForm({...form, workDate: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2 md:col-span-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Phòng khám</label>
                                        <input 
                                            type="text" 
                                            placeholder="Tên phòng..."
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
                                            value={form.room}
                                            onChange={e => setForm({...form, room: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Bắt đầu</label>
                                        <input 
                                            type="time" 
                                            required
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
                                            value={form.startTime}
                                            onChange={e => setForm({...form, startTime: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Kết thúc</label>
                                        <input 
                                            type="time" 
                                            required
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
                                            value={form.endTime}
                                            onChange={e => setForm({...form, endTime: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Bệnh nhân tối đa</label>
                                        <input 
                                            type="number" 
                                            required
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
                                            value={form.maxPatients}
                                            onChange={e => setForm({...form, maxPatients: parseInt(e.target.value)})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Buổi</label>
                                        <select 
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all appearance-none shadow-inner"
                                            value={form.session}
                                            onChange={e => setForm({...form, session: e.target.value})}
                                        >
                                            <option value="morning">Sáng</option>
                                            <option value="afternoon">Chiều</option>
                                            <option value="evening">Tối</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button 
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-8 py-5 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black hover:bg-slate-200 transition uppercase text-xs tracking-widest"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 px-8 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
                                    >
                                        <Save size={18} />
                                        Xác nhận tạo
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DoctorLayout>
    );
}
