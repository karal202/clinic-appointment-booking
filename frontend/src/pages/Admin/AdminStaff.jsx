import { useState, useEffect } from 'react';
import { 
    Users, 
    Plus, 
    Pencil, 
    Trash2, 
    Search,
    Mail,
    UserCircle,
    Hospital,
    Loader2,
    X,
    Save,
    Briefcase,
    Lock,
    AlertCircle
} from 'lucide-react';
import { adminAPI, publicAPI } from '../../utils/api';
import AdminLayout from '../../layouts/AdminLayout';
import toast from 'react-hot-toast';

export default function AdminStaff() {
    const [items, setItems] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        userFullName: '',
        userEmail: '',
        password: '',
        hospitalId: '',
        position: '',
        isActive: true
    });

    useEffect(() => {
        loadData();
        loadHospitals();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getAllStaff();
            setItems(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi tải danh sách nhân viên');
        } finally {
            setLoading(false);
        }
    };

    const loadHospitals = async () => {
        try {
            const res = await publicAPI.getCenters();
            setHospitals(res.data);
        } catch (err) {
            console.error('Lỗi tải danh sách bệnh viện');
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setForm({
                userFullName: item.userFullName || '',
                userEmail: item.userEmail || '',
                password: '', 
                hospitalId: item.hospitalId || '',
                position: item.position || '',
                isActive: item.isActive !== undefined ? item.isActive : true
            });
        } else {
            setEditingItem(null);
            setForm({
                userFullName: '',
                userEmail: '',
                password: '',
                hospitalId: hospitals.length > 0 ? hospitals[0].id : '',
                position: '',
                isActive: true
            });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!form.userEmail || !form.hospitalId) {
            toast.error('Vui lòng nhập Email và chọn Bệnh viện');
            return;
        }

        if (!editingItem && !form.password) {
            toast.error('Vui lòng nhập mật khẩu khởi tạo cho tài khoản mới');
            return;
        }

        setSubmitting(true);
        try {
            if (editingItem) {
                await adminAPI.updateStaff(editingItem.id, form);
                toast.success('Đã cập nhật thông tin');
            } else {
                await adminAPI.createStaff(form);
                toast.success('Đã tạo tài khoản nhân viên mới');
            }
            setShowModal(false);
            loadData();
        } catch (err) {
            const msg = err.response?.data?.message || 'Lỗi kết nối Server (404/500)';
            toast.error(msg);
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Xác nhận xóa quyền nhân viên? Tài khoản sẽ không bị xóa nhưng sẽ quay về vai trò USER.')) return;
        try {
            await adminAPI.deleteStaff(id);
            toast.success('Đã xóa quyền nhân viên');
            loadData();
        } catch (err) {
            toast.error('Không thể xóa nhân viên');
        }
    };

    const filteredItems = items.filter(item => 
        item.userFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.hospitalName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Tìm nhân viên, email..."
                            className="w-full pl-14 pr-8 py-4 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none font-bold transition-all text-slate-700 placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] font-black hover:bg-slate-900 transition shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs"
                    >
                        <Plus size={20} />
                        Thêm nhân viên mới
                    </button>
                </div>

                {loading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                        <p className="text-slate-400 font-extrabold uppercase tracking-widest text-sm text-center">Đang tải danh sách...</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-100 shadow-sm">
                        <Users className="w-20 h-20 text-slate-100 mx-auto mb-6" />
                        <h4 className="text-2xl font-black text-slate-900 mb-2">Chưa có nhân viên nào</h4>
                        <p className="text-slate-400 font-bold">Hãy bấm nút "Thêm nhân viên mới" để bắt đầu.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhân viên & Email</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bệnh viện</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Chức vụ</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredItems.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-lg">
                                                    {item.userFullName?.charAt(0) || 'S'}
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight text-sm">{item.userFullName}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                        <Mail size={10} /> {item.userEmail}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-2 text-slate-600 font-extrabold text-sm">
                                                <Hospital size={16} className="text-indigo-400/50" />
                                                {item.hospitalName}
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-xs font-bold text-slate-500 uppercase">
                                            {item.position || 'Nhân viên'}
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${
                                                item.isActive 
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                : 'bg-slate-50 text-slate-400 border-slate-100'
                                            }`}>
                                                {item.isActive ? 'Đang trực' : 'Tạm nghỉ'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleOpenModal(item)}
                                                    className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-xl transition-all hover:shadow-lg"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-3 text-slate-300 hover:text-rose-500 hover:bg-white rounded-xl transition-all hover:shadow-lg"
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
                )}

                {/* Staff Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                <div>
                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                        {editingItem ? 'Sửa thông tin nhân viên' : 'Tạo mới Nhân viên'}
                                    </h4>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Quản lý và cấp quyền truy cập hệ thống</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2.5 hover:bg-white rounded-xl transition-colors text-slate-400 shadow-sm border border-transparent hover:border-slate-100">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleSave} className="p-10 space-y-6">
                                {!editingItem && (
                                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 mb-2">
                                        <AlertCircle className="text-amber-500 shrink-0" size={20} />
                                        <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
                                            Nếu người dùng chưa có tài khoản, hệ thống sẽ tự động tạo một tài khoản mới với mật khẩu dưới đây.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Họ và tên nhân viên</label>
                                    <div className="relative">
                                        <UserCircle className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        <input 
                                            required
                                            type="text"
                                            placeholder="Tên hiển thị..."
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-16 pr-6 py-4 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
                                            value={form.userFullName}
                                            onChange={e => setForm({...form, userFullName: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Email đăng nhập</label>
                                    <div className="relative">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        <input 
                                            required
                                            type="email"
                                            disabled={!!editingItem}
                                            placeholder="staff@medkit.com"
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-16 pr-6 py-4 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner disabled:opacity-50"
                                            value={form.userEmail}
                                            onChange={e => setForm({...form, userEmail: e.target.value})}
                                        />
                                    </div>
                                </div>

                                {!editingItem && (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Mật khẩu khởi tạo</label>
                                        <div className="relative">
                                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <input 
                                                required
                                                type="text" // Chế độ text để dễ thấy lúc tạo
                                                placeholder="Mật khẩu ít nhất 6 ký tự..."
                                                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-16 pr-6 py-4 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
                                                value={form.password}
                                                onChange={e => setForm({...form, password: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Cơ sở làm việc</label>
                                        <div className="relative">
                                            <Hospital className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <select 
                                                required
                                                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-16 pr-6 py-4 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner appearance-none cursor-pointer text-xs"
                                                value={form.hospitalId}
                                                onChange={e => setForm({...form, hospitalId: e.target.value})}
                                            >
                                                <option value="">Chọn BV...</option>
                                                {hospitals.map(h => (
                                                    <option key={h.id} value={h.id}>{h.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Chức danh</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <input 
                                                placeholder="Lễ tân..."
                                                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-16 pr-6 py-4 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
                                                value={form.position}
                                                onChange={e => setForm({...form, position: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {editingItem && (
                                    <div className="flex items-center gap-3 pl-2">
                                        <input 
                                            type="checkbox"
                                            id="isActive"
                                            className="w-5 h-5 rounded-lg border-2 border-slate-200 text-indigo-600 focus:ring-indigo-600"
                                            checked={form.isActive}
                                            onChange={e => setForm({...form, isActive: e.target.checked})}
                                        />
                                        <label htmlFor="isActive" className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Đang công tác</label>
                                    </div>
                                )}

                                <div className="pt-6 flex gap-4">
                                    <button 
                                        type="button"
                                        disabled={submitting}
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black hover:bg-slate-100 transition uppercase text-[10px] tracking-widest border border-slate-100"
                                    >
                                        Hủy
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-indigo-600 transition flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest disabled:opacity-50"
                                    >
                                        {submitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                        {editingItem ? 'Lưu thay đổi' : 'Tạo nhân viên'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
