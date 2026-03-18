import { useState, useEffect } from 'react';
import { 
    Users,
    Plus,
    Pencil,
    Trash2,
    Search,
    Mail,
    UserCircle,
    Loader2,
    X,
    Save,
    Lock
} from 'lucide-react';
import { adminAPI } from '../../utils/api';
import AdminLayout from '../../layouts/AdminLayout';
import toast from 'react-hot-toast';

export default function AdminUsers() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [form, setForm] = useState({
        email: '',
        fullName: '',
        phoneNumber: '',
        password: '',
        role: 'USER',
        isActive: true
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getUsers();
            setItems(res.data || []);
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setForm({
                email: user.email || '',
                fullName: user.fullName || '',
                phoneNumber: user.phoneNumber || '',
                password: '',
                role: user.role || 'USER',
                isActive: user.isActive !== undefined ? user.isActive : true
            });
        } else {
            setEditingUser(null);
            setForm({ email: '', fullName: '', phoneNumber: '', password: '', role: 'USER', isActive: true });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.email) return toast.error('Vui lòng nhập email');
        if (!editingUser && !form.password) return toast.error('Vui lòng nhập mật khẩu');
        setSubmitting(true);
        try {
            if (editingUser) {
                await adminAPI.updateUser(editingUser.id, form);
                toast.success('Đã cập nhật người dùng');
            } else {
                await adminAPI.createUser(form);
                toast.success('Đã tạo người dùng mới');
            }
            setShowModal(false);
            setEditingUser(null);
            loadData();
        } catch (err) {
            const msg = err.response?.data?.message || 'Lỗi khi lưu user';
            toast.error(msg);
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleActive = async (user) => {
        try {
            await adminAPI.lockUser(user.id, !user.isActive);
            toast.success(user.isActive ? 'Đã khóa người dùng' : 'Đã mở khóa người dùng');
            loadData();
        } catch (err) {
            toast.error('Không thể thay đổi trạng thái');
        }
    };

    const handleDelete = async (id) => {
        const soft = window.confirm('Nhấn OK để xóa mềm (ẩn tài khoản). Nhấn Cancel để xóa hoàn toàn.');
        const confirmHard = soft ? true : window.confirm('Bạn đã chọn xóa hoàn toàn. Xác nhận? Hành động không thể hoàn tác.');
        const hard = soft ? false : confirmHard;
        if (!soft && !confirmHard) return; // user canceled
        try {
            await adminAPI.deleteUser(id, hard);
            toast.success(hard ? 'Đã xóa hoàn toàn người dùng' : 'Đã xóa (ẩn) người dùng');
            loadData();
        } catch (err) {
            toast.error('Không thể xóa người dùng');
        }
    };

    const filteredItems = items.filter(item => 
        item.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Tìm người dùng, email hoặc số điện thoại..."
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
                        Thêm người dùng
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
                        <h4 className="text-2xl font-black text-slate-900 mb-2">Chưa có người dùng</h4>
                        <p className="text-slate-400 font-bold">Tạo người dùng mới bằng nút bên trên.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Người dùng</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Số điện thoại</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vai trò</th>
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
                                                    {item.fullName?.charAt(0) || item.email?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight text-sm">{item.fullName || item.email}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                        <Mail size={10} /> {item.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-sm font-extrabold text-slate-600">{item.phoneNumber || '-'}</td>
                                        <td className="px-10 py-6 text-xs font-bold text-slate-500 uppercase">{item.role}</td>
                                        <td className="px-10 py-6">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${
                                                item.isActive 
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                : 'bg-slate-50 text-slate-400 border-slate-100'
                                            }`}>
                                                {item.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(item)}
                                                    className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-xl transition-all hover:shadow-lg"
                                                    title="Chỉnh sửa người dùng"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleToggleActive(item)}
                                                    className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-xl transition-all hover:shadow-lg"
                                                    title={item.isActive ? 'Khóa người dùng' : 'Mở khóa người dùng'}
                                                >
                                                    <Lock size={18} />
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

                {/* Create User Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                <div>
                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">{editingUser ? 'Chỉnh sửa Người dùng' : 'Tạo Người dùng mới'}</h4>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Dùng cho bệnh nhân, bác sĩ, nhân viên</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2.5 hover:bg-white rounded-xl transition-colors text-slate-400 shadow-sm border border-transparent hover:border-slate-100">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-10 space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        <input 
                                            required
                                            type="email"
                                            placeholder="email@domain.com"
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-16 pr-6 py-4 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
                                            value={form.email}
                                            onChange={e => setForm({...form, email: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Họ và tên</label>
                                        <div className="relative">
                                            <UserCircle className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <input 
                                                type="text"
                                                placeholder="Tên đầy đủ"
                                                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-16 pr-6 py-4 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
                                                value={form.fullName}
                                                onChange={e => setForm({...form, fullName: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Số điện thoại</label>
                                        <div className="relative">
                                            <input 
                                                type="text"
                                                placeholder="0968xxxxxx"
                                                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-6 pr-6 py-4 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
                                                value={form.phoneNumber}
                                                onChange={e => setForm({...form, phoneNumber: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Vai trò</label>
                                        <select 
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-6 pr-6 py-4 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner appearance-none cursor-pointer text-xs"
                                            value={form.role}
                                            onChange={e => setForm({...form, role: e.target.value})}
                                        >
                                            <option value="USER">USER</option>
                                            <option value="DOCTOR">DOCTOR</option>
                                            <option value="STAFF">STAFF</option>
                                            <option value="ADMIN">ADMIN</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Mật khẩu {editingUser ? '(để trống nếu không đổi)' : 'khởi tạo'}</label>
                                        <input 
                                            type="text"
                                            placeholder="Mật khẩu tạm thời"
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-6 pr-6 py-4 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
                                            value={form.password}
                                            onChange={e => setForm({...form, password: e.target.value})}
                                            required={!editingUser}
                                        />
                                    </div>
                                </div>

                                {editingUser && (
                                    <div className="flex items-center gap-3 pl-2 mb-2">
                                        <input
                                            type="checkbox"
                                            id="isActive"
                                            className="w-5 h-5 rounded-lg border-2 border-slate-200 text-indigo-600 focus:ring-indigo-600"
                                            checked={form.isActive}
                                            onChange={e => setForm({...form, isActive: e.target.checked})}
                                        />
                                        <label htmlFor="isActive" className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Đang hoạt động</label>
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
                                        {editingUser ? 'Lưu thay đổi' : 'Tạo người dùng'}
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
