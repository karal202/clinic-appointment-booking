import { useState, useEffect } from 'react';
import { 
    Users, 
    Search, 
    CheckCircle2, 
    Clock, 
    Calendar,
    Stethoscope,
    Hospital,
    Loader2,
    CreditCard,
    PlusCircle,
    X,
    UserPlus,
    Phone,
    User,
    ScanLine
} from 'lucide-react';
import { staffAPI } from '../../utils/api';
import StaffLayout from '../../layouts/StaffLayout';
import toast from 'react-hot-toast';
import webSocketService from '../../services/websocket';
import QrCheckInScanner from '../../components/QrCheckInScanner';

export default function StaffHome() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [doctors, setDoctors] = useState([]);
    const [showWalkInModal, setShowWalkInModal] = useState(false);
    const [showQrScanner, setShowQrScanner] = useState(false);
    const [walkInForm, setWalkInForm] = useState({
        fullName: '',
        phoneNumber: '',
        gender: 'MALE',
        doctorId: '',
        symptomsNote: ''
    });

    useEffect(() => {
        loadData();
        loadDoctors();
    }, []);

    useEffect(() => {
        try {
            webSocketService.connect();
            const onAppointmentUpdate = () => loadData();
            webSocketService.setAppointmentUpdateHandler(onAppointmentUpdate);
            return () => {
                webSocketService.setAppointmentUpdateHandler(null);
                try { webSocketService.disconnect(); } catch (e) {}
            };
        } catch (err) {
            console.error('WebSocket init failed in StaffHome', err);
        }
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await staffAPI.getAllAppointments();
            setAppointments(res.data);
        } catch (err) {
            toast.error('Lỗi khi tải danh sách lịch hẹn');
        } finally {
            setLoading(false);
        }
    };

    const loadDoctors = async () => {
        try {
            const res = await staffAPI.getDoctors();
            setDoctors(res.data);
        } catch (err) {
            console.error('Lỗi tải danh sách bác sĩ');
        }
    };

    const handleWalkInSubmit = async (e) => {
        e.preventDefault();
        if (!walkInForm.doctorId) { toast.error("Vui lòng chọn bác sĩ"); return; }
        const payload = {
            fullName: walkInForm.fullName,
            phoneNumber: walkInForm.phoneNumber,
            gender: walkInForm.gender,
            doctorId: Number(walkInForm.doctorId),
            symptomsNote: walkInForm.symptomsNote || ''
        };
        try {
            await staffAPI.createWalkIn(payload);
            toast.success("Đã đăng ký và tiếp nhận thành công!");
            setShowWalkInModal(false);
            setWalkInForm({ fullName: '', phoneNumber: '', gender: 'MALE', doctorId: '', symptomsNote: '' });
            loadData();
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Lỗi khi đăng ký trực tiếp';
            toast.error(`Lỗi ${err.response?.status || ''}: ${errorMsg}`);
        }
    };

    const handleCheckIn = async (id) => {
        try {
            await staffAPI.checkIn(id);
            toast.success('Đã tiếp nhận bệnh nhân. Vui lòng hướng dẫn bệnh nhân vào phòng chờ.');
            loadData();
        } catch (err) {
            toast.error('Lỗi khi tiếp nhận');
        }
    };

    const handleConfirmPayment = async (id) => {
        try {
            await staffAPI.confirmPayment(id);
            toast.success('Đã xác nhận thanh toán. Vui lòng thực hiện tiếp nhận bệnh nhân.');
            loadData();
        } catch (err) {
            toast.error('Lỗi khi xác nhận thanh toán');
        }
    };

    const filtered = appointments.filter(a => 
        (a.appointmentCode?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.patientName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.patientPhone?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'CONFIRMED': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'CHECKED_IN': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'COMPLETED': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'PENDING': return 'Chờ thanh toán';
            case 'CONFIRMED': return 'Đã xác nhận';
            case 'CHECKED_IN': return 'Đang chờ khám';
            case 'COMPLETED': return 'Đã khám xong';
            case 'CANCELLED': return 'Đã hủy';
            default: return status;
        }
    };

    return (
        <StaffLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Tìm bệnh nhân, mã lịch..."
                            className="w-full pl-14 pr-8 py-5 bg-white border border-emerald-100 rounded-[2rem] shadow-sm focus:ring-4 focus:ring-emerald-50 focus:border-emerald-600 outline-none font-bold transition-all text-slate-700"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-3 flex-wrap justify-end">
                        {/* QR Scanner button */}
                        <button 
                            onClick={() => setShowQrScanner(true)}
                            className="flex items-center gap-3 bg-blue-600 text-white px-7 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-blue-200"
                        >
                            <ScanLine size={20} />
                            Quét QR Check-in
                        </button>

                        <button 
                            onClick={() => setShowWalkInModal(true)}
                            className="flex items-center gap-3 bg-emerald-600 text-white px-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-emerald-200"
                        >
                            <PlusCircle size={22} />
                            Tiếp nhận Trực tiếp
                        </button>
                        
                        <div className="flex items-center gap-4 bg-white px-8 py-4 rounded-[2rem] border border-emerald-100 shadow-sm transition-transform hover:scale-105">
                            <Calendar size={20} className="text-emerald-600" />
                            <span className="font-bold text-slate-700 uppercase tracking-tighter">Hôm nay: {new Date().toLocaleDateString('vi-VN')}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] shadow-xl shadow-emerald-900/5 border border-emerald-50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-emerald-50/30">
                                    <th className="px-10 py-6 text-xs font-black text-emerald-800 uppercase tracking-widest leading-none">STT</th>
                                    <th className="px-10 py-6 text-xs font-black text-emerald-800 uppercase tracking-widest leading-none">Mã lịch</th>
                                    <th className="px-10 py-6 text-xs font-black text-emerald-800 uppercase tracking-widest leading-none">Bệnh nhân</th>
                                    <th className="px-10 py-6 text-xs font-black text-emerald-800 uppercase tracking-widest leading-none">Thời gian</th>
                                    <th className="px-10 py-6 text-xs font-black text-emerald-800 uppercase tracking-widest leading-none">Bác sĩ / Phòng</th>
                                    <th className="px-10 py-6 text-xs font-black text-emerald-800 uppercase tracking-widest leading-none text-center">Trạng thái</th>
                                    <th className="px-10 py-6 text-xs font-black text-emerald-800 uppercase tracking-widest leading-none text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-50/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-10 py-20 text-center">
                                            <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-4" />
                                            <p className="font-bold text-emerald-800 uppercase tracking-widest text-[10px]">Đang đồng bộ dữ liệu...</p>
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-10 py-20 text-center">
                                            <Users className="w-16 h-16 text-emerald-100 mx-auto mb-4" />
                                            <p className="text-xl font-black text-slate-900">Không tìm thấy bệnh nhân</p>
                                        </td>
                                    </tr>
                                ) : filtered.map(a => (
                                    <tr key={a.id} className="hover:bg-emerald-50/10 transition-colors group">
                                        <td className="px-10 py-6">
                                            <span className="font-black text-2xl text-emerald-900 tabular-nums">
                                                {a.queueNumber || '--'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className="font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{a.appointmentCode}</span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{a.patientName}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">SĐT: {a.patientPhone || 'N/A'}</div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                                                    <Clock size={14} className="text-emerald-600" />
                                                    {a.appointmentTime?.substring(0, 5)}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Ngày {a.appointmentDate}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                                                        <Stethoscope size={12} />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-700">{a.doctor?.fullName}</span>
                                                </div>
                                                {a.assignedRoom && (
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-md w-fit">
                                                        <Hospital size={10} />
                                                        {a.assignedRoom}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest inline-block ${getStatusStyle(a.status)}`}>
                                                {getStatusText(a.status)}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            {a.status === 'PENDING' && (
                                                <button 
                                                    onClick={() => handleConfirmPayment(a.id)}
                                                    className="inline-flex items-center gap-2 bg-amber-500 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all hover:scale-105 shadow-xl shadow-amber-200"
                                                >
                                                    <CreditCard size={16} />
                                                    Xác nhận thanh toán
                                                </button>
                                            )}
                                            {a.status === 'CONFIRMED' && (
                                                <button 
                                                    onClick={() => handleCheckIn(a.id)}
                                                    className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all hover:scale-105 shadow-xl shadow-emerald-200"
                                                >
                                                    <CheckCircle2 size={16} />
                                                    Tiếp nhận Check-in
                                                </button>
                                            )}
                                            {a.status === 'CHECKED_IN' && (
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />
                                                        Đang chờ khám
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase italic tracking-widest">STT assigned: #{a.queueNumber}</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Walk-in Modal */}
                {showWalkInModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowWalkInModal(false)}></div>
                        <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-emerald-100 animate-in fade-in zoom-in duration-300">
                            <div className="bg-emerald-600 p-8 text-white flex justify-between items-center bg-gradient-to-r from-emerald-600 to-emerald-700">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white/20 p-3 rounded-2xl">
                                        <UserPlus size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black uppercase tracking-tight">Tiếp nhận Trực tiếp</h4>
                                        <p className="text-emerald-100 text-xs font-bold">Đăng ký bệnh nhân bốc số ngay tại quầy</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowWalkInModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleWalkInSubmit} className="p-10 space-y-6">
                                <div className="space-y-4">
                                    <div className="relative">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input type="text" placeholder="Họ và tên bệnh nhân"
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-emerald-600 outline-none font-bold transition-all"
                                            required value={walkInForm.fullName}
                                            onChange={(e) => setWalkInForm({...walkInForm, fullName: e.target.value})} />
                                    </div>
                                    <div className="relative">
                                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input type="tel" placeholder="Số điện thoại"
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-emerald-600 outline-none font-bold transition-all"
                                            required value={walkInForm.phoneNumber}
                                            onChange={(e) => setWalkInForm({...walkInForm, phoneNumber: e.target.value})} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-emerald-600 outline-none font-bold transition-all appearance-none cursor-pointer"
                                            value={walkInForm.gender}
                                            onChange={(e) => setWalkInForm({...walkInForm, gender: e.target.value})}>
                                            <option value="MALE">Nam</option>
                                            <option value="FEMALE">Nữ</option>
                                            <option value="OTHER">Khác</option>
                                        </select>
                                        <div className="relative">
                                            <Stethoscope className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <select className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-emerald-600 outline-none font-bold transition-all appearance-none cursor-pointer"
                                                required value={walkInForm.doctorId}
                                                onChange={(e) => setWalkInForm({...walkInForm, doctorId: Number(e.target.value)})}>
                                                <option value="">Chọn bác sĩ khám</option>
                                                {doctors.map(d => (
                                                    <option key={d.id} value={d.id}>BS. {d.fullName} ({d.specialty?.name})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <textarea placeholder="Triệu chứng / Ghi chú (nếu có)"
                                        className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-emerald-600 outline-none font-bold transition-all min-h-[100px]"
                                        value={walkInForm.symptomsNote}
                                        onChange={(e) => setWalkInForm({...walkInForm, symptomsNote: e.target.value})} />
                                </div>
                                <button type="submit"
                                    className="w-full py-5 bg-black text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100">
                                    Đăng ký và Xuất số
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* QR Scanner */}
                {showQrScanner && (
                    <QrCheckInScanner
                        onClose={() => setShowQrScanner(false)}
                        onSuccess={() => {
                            loadData();
                            // keep scanner open so staff can scan next patient
                        }}
                    />
                )}
            </div>
        </StaffLayout>
    );
}