import { useState, useEffect } from 'react';
import { 
    ClipboardList, 
    User, 
    Calendar, 
    Clock, 
    Stethoscope, 
    FileText, 
    AlertCircle, 
    CheckCircle,
    Save,
    ChevronLeft,
    Loader2,
    X
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorAPI, userAPI, getCurrentUser } from '../../utils/api';
import DoctorLayout from '../../layouts/DoctorLayout';
import toast from 'react-hot-toast';

export default function CreateMedicalRecord() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const user = getCurrentUser();
    
    const [loading, setLoading] = useState(true);
    const [appointment, setAppointment] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        symptoms: '',
        diagnosis: '',
        treatmentPlan: '',
        prescription: '',
        notes: ''
    });

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // First get the actual Doctor data
                const docRes = await doctorAPI.getMe();
                const doctorData = docRes.data;
                setDoctor(doctorData);

                // We need to find the specific appointment
                const res = await doctorAPI.getAppointments(doctorData.id);
                const found = res.data.find(a => a.id.toString() === appointmentId);
                if (!found) {
                    toast.error('Không tìm thấy lịch hẹn');
                    navigate('/doctor/appointments');
                    return;
                }
                setAppointment(found);
            } catch (err) {
                toast.error('Lỗi khi tải thông tin');
            } finally {
                setLoading(false);
            }
        };
        if (user && appointmentId) loadInitialData();
    }, [appointmentId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await doctorAPI.createMedicalRecord({
                appointmentId: appointment.id,
                userId: appointment.userId,
                doctorId: doctor.id,
                ...form
            });
            toast.success('Hồ sơ khám đã được lưu & Lịch khám hoàn tất!');
            navigate('/doctor/appointments');
        } catch (err) {
            toast.error('Lỗi khi lưu hồ sơ');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <DoctorLayout>
                <div className="flex flex-col items-center justify-center h-64">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Đang tải thông tin ca khám...</p>
                </div>
            </DoctorLayout>
        );
    }

    return (
        <DoctorLayout>
            <div className="max-w-5xl mx-auto">
                <div className="mb-10 flex items-center justify-between">
                    <button 
                        onClick={() => navigate('/doctor/appointments')}
                        className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-black transition-colors"
                    >
                        <ChevronLeft size={20} />
                        QUAY LẠI DANH SÁCH
                    </button>
                    <div className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
                        Đang thực hiện khám bệnh
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Patient Summary */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-24 bg-indigo-600 opacity-5"></div>
                            <div className="relative z-10">
                                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-100 text-indigo-600 font-extrabold text-3xl">
                                    {appointment?.userName?.charAt(0) || 'P'}
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-1">{appointment?.userName}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Bệnh nhân</p>
                                
                                <div className="space-y-4 text-left">
                                    <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
                                        <div className="p-2.5 bg-white rounded-xl text-slate-400 shadow-sm">
                                            <Calendar size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Ngày hẹn</p>
                                            <p className="text-sm font-black text-slate-700">{appointment?.appointmentDate}</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
                                        <div className="p-2.5 bg-white rounded-xl text-slate-400 shadow-sm">
                                            <Clock size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Giờ hẹn</p>
                                            <p className="text-sm font-black text-slate-700">{appointment?.appointmentTime}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                            <Stethoscope className="absolute -bottom-4 -right-4 text-white/10 rotate-12" size={80} />
                            <h4 className="text-lg font-black mb-4">Lưu ý chuyên môn</h4>
                            <p className="text-xs font-bold text-slate-400 leading-relaxed italic">
                                "Vui lòng ghi chú kỹ triệu chứng lâm sàng và chẩn đoán chính xác trước khi ra đơn thuốc."
                            </p>
                        </div>
                    </div>

                    {/* Examination Form */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-12 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-10">
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <AlertCircle size={14} className="text-amber-500" />
                                        Triệu chứng lâm sàng
                                    </label>
                                    <textarea 
                                        required
                                        placeholder="Mô tả các triệu chứng của bệnh nhân..."
                                        rows="3"
                                        className="w-full bg-slate-50 border border-transparent rounded-2xl px-8 py-5 font-bold outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-700"
                                        value={form.symptoms}
                                        onChange={e => setForm({...form, symptoms: e.target.value})}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <CheckCircle size={14} className="text-emerald-500" />
                                        Chẩn đoán cuối cùng
                                    </label>
                                    <input 
                                        required
                                        type="text"
                                        placeholder="Ví dụ: Viêm họng cấp tính..."
                                        className="w-full bg-slate-50 border border-transparent rounded-2xl px-8 py-5 font-bold outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-700"
                                        value={form.diagnosis}
                                        onChange={e => setForm({...form, diagnosis: e.target.value})}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={14} className="text-indigo-600" />
                                        Kế hoạch điều trị & Dặn dò
                                    </label>
                                    <textarea 
                                        required
                                        placeholder="Hướng dẫn sinh hoạt, ăn uống và tái khám..."
                                        rows="3"
                                        className="w-full bg-slate-50 border border-transparent rounded-2xl px-8 py-5 font-bold outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-700"
                                        value={form.treatmentPlan}
                                        onChange={e => setForm({...form, treatmentPlan: e.target.value})}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <ClipboardList size={14} className="text-rose-500" />
                                        Đơn thuốc chi tiết
                                    </label>
                                    <textarea 
                                        required
                                        placeholder="Liệt kê danh sách thuốc và liều dùng..."
                                        rows="4"
                                        className="w-full bg-slate-900 border-none rounded-2xl px-8 py-6 font-bold outline-none focus:ring-4 focus:ring-slate-200 transition-all text-blue-100 placeholder:text-slate-600"
                                        value={form.prescription}
                                        onChange={e => setForm({...form, prescription: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-6 pt-6">
                                <button 
                                    type="button"
                                    onClick={() => navigate('/doctor/appointments')}
                                    className="flex-1 px-10 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition uppercase tracking-widest text-xs"
                                >
                                    Hủy bỏ
                                </button>
                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-[2] px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition flex items-center justify-center gap-3 uppercase tracking-widest text-xs disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                    Hoàn tất & Lưu hồ sơ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </DoctorLayout>
    );
}
