import { useState, useEffect } from 'react';
import { 
    Stethoscope, 
    Plus, 
    Pencil, 
    Trash2, 
    Search,
    UserRound,
    Hospital,
    ShieldCheck,
    Loader2,
    X
} from 'lucide-react';
import { adminAPI, publicAPI } from '../../utils/api';
import AdminLayout from '../../layouts/AdminLayout';
import toast from 'react-hot-toast';

export default function AdminDoctors() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // bundled doctor images from src/assets/doctors — load asynchronously to support environments without globEager
    const doctorModules = import.meta.glob('../../assets/doctors/*.{png,jpg,jpeg,webp,svg}');
    const [DOCTOR_ASSETS, setDoctorAssets] = useState([]);
    const [showAssetPicker, setShowAssetPicker] = useState(false);

    const [showModal, setShowModal] = useState(false);

    // load bundled doctor assets
    useEffect(() => {
        const loadAssets = async () => {
            try {
                const loaders = Object.values(doctorModules);
                const mods = await Promise.all(loaders.map(fn => fn()));
                setDoctorAssets(mods.map(m => m.default || m));
            } catch (err) {
                console.error('Failed to load doctor assets', err);
            }
        };
        loadAssets();
    }, []);
    const [editingItem, setEditingItem] = useState(null);
    const [specialties, setSpecialties] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        fullName: '',
        avatar: '',
        specialtyId: '',
        hospitalId: '',
        experienceYears: '',
        feeMin: '',
        feeMax: '',
        workingRoom: ''
    });

    useEffect(() => {
        loadData();
        loadSpecialties();
        loadHospitals();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await publicAPI.getDoctors();
            setItems(res.data);
        } catch (err) {
            toast.error('Lỗi khi tải danh sách bác sĩ');
        } finally {
            setLoading(false);
        }
    };

    const loadSpecialties = async () => {
        try {
            const res = await publicAPI.getSpecialties();
            setSpecialties(res.data);
        } catch (err) {
            console.error('Không tải được chuyên khoa');
        }
    };

    const loadHospitals = async () => {
        try {
            const res = await publicAPI.getCenters();
            setHospitals(res.data);
        } catch (err) {
            console.error('Không tải được bệnh viện');
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setForm({
                fullName: item.fullName || '',
                avatar: item.avatar || '',
                specialtyId: item.specialty?.id || '',
                hospitalId: item.hospital?.id || '',
                experienceYears: item.experienceYears || '',
                feeMin: item.feeMin || '',
                feeMax: item.feeMax || '',
                workingRoom: item.workingRoom || ''
            });
        } else {
            setEditingItem(null);
            setForm({ fullName: '', avatar: '', specialtyId: '', hospitalId: hospitals.length > 0 ? hospitals[0].id : '', experienceYears: '', feeMin: '', feeMax: '', workingRoom: '' });
        }
        setShowModal(true);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await adminAPI.uploadFile(fd);
            setForm(prev => ({ ...prev, avatar: res.data.url }));
            toast.success('Ảnh đã được tải lên');
        } catch (err) {
            console.error(err);
            toast.error('Không thể tải ảnh');
        }
    };

    const handleSave = async (e) => {
        e?.preventDefault();
        if (!form.fullName || !form.specialtyId || !form.hospitalId) {
            toast.error('Vui lòng nhập tên, chuyên khoa và bệnh viện');
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                fullName: form.fullName,
                avatar: form.avatar,
                specialty: form.specialtyId ? { id: Number(form.specialtyId) } : null,
                hospital: form.hospitalId ? { id: Number(form.hospitalId) } : null,
                experienceYears: form.experienceYears ? Number(form.experienceYears) : null,
                feeMin: form.feeMin ? Number(form.feeMin) : null,
                feeMax: form.feeMax ? Number(form.feeMax) : null,
                workingRoom: form.workingRoom || ''
            };

            if (editingItem) {
                await adminAPI.updateDoctor(editingItem.id, payload);
                toast.success('Đã cập nhật bác sĩ');
            } else {
                await adminAPI.createDoctor(payload);
                toast.success('Đã tạo bác sĩ mới');
            }
            setShowModal(false);
            loadData();
        } catch (err) {
            console.error(err);
            toast.error('Lỗi lưu bác sĩ');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Xác nhận xóa bác sĩ này?')) return;
        try {
            await adminAPI.deleteDoctor(id);
            toast.success('Đã xóa thành công');
            loadData();
        } catch (err) {
            toast.error('Lỗi khi xóa');
        }
    };

    const filteredItems = items.filter(item => 
        item.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.specialty?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.hospital?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Tìm bác sĩ, chuyên khoa, bệnh viện..."
                            className="w-full pl-14 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] shadow-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none font-bold transition-all text-slate-700 placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-5 rounded-[2rem] font-black hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs">
                        <Plus size={20} />
                        Thêm bác sĩ
                    </button>
                </div>

                <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Bác sĩ</th>
                                    <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Chuyên khoa</th>
                                    <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Bệnh viện</th>
                                    <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Kinh nghiệm</th>
                                    <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-10 py-20 text-center">
                                            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
                                            <p className="font-bold text-slate-400">Đang tải danh sách...</p>
                                        </td>
                                    </tr>
                                ) : filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-10 py-20 text-center">
                                            <UserRound className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                                            <p className="text-xl font-black text-slate-900">Không tìm thấy bác sĩ nào</p>
                                        </td>
                                    </tr>
                                ) : filteredItems.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center text-indigo-600 font-black overflow-hidden relative">
                                                    {item.avatar ? (
                                                        <img src={item.avatar} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        item.fullName?.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{item.fullName}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: #{item.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                                                    <ShieldCheck size={14} />
                                                </div>
                                                <span className="text-sm font-bold text-slate-600">{item.specialty?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                                                    <Hospital size={14} />
                                                </div>
                                                <span className="text-sm font-bold text-slate-600">{item.hospital?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 font-black text-slate-700 text-sm">
                                            {item.experienceYears} năm
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                <button onClick={() => handleOpenModal(item)} className="p-3 bg-white text-slate-400 hover:bg-white hover:text-indigo-600 rounded-2xl transition-all shadow-sm">
                                                    <Pencil size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-3 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl shadow-sm border border-rose-100 transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                <div>
                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                        {editingItem ? 'Sửa bác sĩ' : 'Tạo mới Bác sĩ'}
                                    </h4>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Quản lý thông tin bác sĩ</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2.5 hover:bg-white rounded-xl transition-colors text-slate-400 shadow-sm border border-transparent hover:border-slate-100">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Họ và tên</label>
                                        <input required value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-4 pr-4 py-3 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Chuyên khoa</label>
                                        <select required value={form.specialtyId} onChange={e => setForm({...form, specialtyId: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-4 pr-4 py-3 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all">
                                            <option value="">Chọn chuyên khoa...</option>
                                            {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Bệnh viện</label>
                                        <select required value={form.hospitalId} onChange={e => setForm({...form, hospitalId: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-4 pr-4 py-3 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all">
                                            <option value="">Chọn bệnh viện...</option>
                                            {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Kinh nghiệm (năm)</label>
                                        <input type="number" value={form.experienceYears} onChange={e => setForm({...form, experienceYears: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-4 pr-4 py-3 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Phí tối thiểu</label>
                                        <input type="number" value={form.feeMin} onChange={e => setForm({...form, feeMin: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-4 pr-4 py-3 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Phí tối đa</label>
                                        <input type="number" value={form.feeMax} onChange={e => setForm({...form, feeMax: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-4 pr-4 py-3 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-2 block">Ảnh đại diện</label>
                                        <div className="flex items-center gap-4">
                                            <div className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center">
                                                {form.avatar ? <img src={form.avatar} className="w-full h-full object-cover" alt="preview" /> : <div className="text-slate-300 font-black">No</div>}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex gap-3 items-center">
                                                    <input type="file" accept="image/*" onChange={handleFileChange} />
                                                    <button type="button" onClick={() => setShowAssetPicker(true)} className="px-3 py-2 bg-slate-100 rounded-2xl text-sm font-bold">Chọn từ thư viện</button>
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-2">Chọn file để tải lên (max 10MB) hoặc chọn ảnh có sẵn</p>

                                                {showAssetPicker && (
                                                    <div className="mt-4 grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg bg-white">
                                                        {DOCTOR_ASSETS.map((src, idx) => (
                                                            <button key={idx} type="button" onClick={() => { setForm(prev => ({ ...prev, avatar: src })); setShowAssetPicker(false); toast.success('Đã chọn ảnh'); }} className="w-20 h-20 p-0 border rounded-lg overflow-hidden">
                                                                <img src={src} alt={`asset-${idx}`} className="w-full h-full object-cover" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black hover:bg-slate-100 transition uppercase text-[10px] tracking-widest border border-slate-100">Hủy</button>
                                    <button type="submit" disabled={submitting} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-indigo-600 transition flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest disabled:opacity-50">{submitting ? 'Đang lưu...' : (editingItem ? 'Lưu thay đổi' : 'Tạo bác sĩ')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
