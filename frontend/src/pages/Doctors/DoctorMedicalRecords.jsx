import { useState, useEffect } from 'react';
import { 
    ClipboardList, 
    Search, 
    Filter, 
    Calendar, 
    User, 
    Loader2,
    ArrowRight,
    FileText,
    Stethoscope
} from 'lucide-react';
import { doctorAPI, getCurrentUser } from '../../utils/api';
import DoctorLayout from '../../layouts/DoctorLayout';
import toast from 'react-hot-toast';

export default function DoctorMedicalRecords() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [doctor, setDoctor] = useState(null);
    const user = getCurrentUser();

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
            const res = await doctorAPI.getRecordsByDoctor(doctorId);
            setRecords(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (err) {
            toast.error('Lỗi khi tải danh sách hồ sơ');
        } finally {
            setLoading(false);
        }
    };

    const filteredRecords = records.filter(r => 
        r.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DoctorLayout>
            <div className="max-w-7xl mx-auto space-y-10">
                {/* Search Header */}
                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-center md:text-left">
                            <h3 className="text-3xl font-black mb-2 uppercase tracking-tight">Lịch sử hồ sơ bệnh án</h3>
                            <p className="text-slate-400 font-bold max-w-md">Tra cứu và quản lý toàn bộ hồ sơ khám bệnh bạn đã thực hiện.</p>
                        </div>
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                            <input 
                                type="text" 
                                placeholder="Tìm bệnh nhân, chẩn đoán..."
                                className="w-full pl-14 pr-8 py-5 bg-white/10 border border-white/10 rounded-2xl focus:bg-white focus:text-slate-900 outline-none font-bold transition-all placeholder:text-slate-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Records List */}
                {loading ? (
                    <div className="bg-white rounded-[2.5rem] p-20 text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                        <p className="text-slate-400 font-extrabold uppercase tracking-widest text-sm">Đang tải dữ liệu hồ sơ...</p>
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-100">
                        <ClipboardList className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                        <h4 className="text-2xl font-black text-slate-900 mb-2">Chưa có hồ sơ nào</h4>
                        <p className="text-slate-400 font-bold">Bắt đầu khám bệnh để lưu lại hồ sơ cho bệnh nhân của bạn.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredRecords.map((record) => (
                            <div key={record.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-50/50 transition-all group overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                                <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                                    <div className="flex items-center gap-6 shrink-0">
                                        <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 font-black text-2xl border border-indigo-100">
                                            {record.userName?.charAt(0) || 'P'}
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-900">{record.userName}</p>
                                            <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                                                <Calendar size={14} />
                                                {new Date(record.createdAt).toLocaleDateString('vi-VN')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full lg:w-auto">
                                        <div className="bg-slate-50 p-6 rounded-2xl">
                                            <div className="flex items-center gap-2 mb-2 text-indigo-600">
                                                <Stethoscope size={16} />
                                                <span className="text-[10px] font-black uppercase tracking-widest pl-1">Chẩn đoán</span>
                                            </div>
                                            <p className="text-base font-black text-slate-700">{record.diagnosis}</p>
                                        </div>
                                        <div className="bg-slate-900 p-6 rounded-2xl text-white">
                                            <div className="flex items-center gap-2 mb-2 text-blue-400">
                                                <FileText size={16} />
                                                <span className="text-[10px] font-black uppercase tracking-widest pl-1">Đơn thuốc</span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-300 truncate">{record.prescription}</p>
                                        </div>
                                    </div>

                                    <button className="hidden lg:flex p-5 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-3xl transition-all">
                                        <ArrowRight size={24} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DoctorLayout>
    );
}
