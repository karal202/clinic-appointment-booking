import { useState, useEffect } from 'react';
import { 
    ShieldCheck, 
    Plus, 
    Pencil, 
    Trash2, 
    Search,
    LayoutDashboard,
    Loader2,
    X
} from 'lucide-react';
import { adminAPI, publicAPI } from '../../utils/api';
import AdminLayout from '../../layouts/AdminLayout';
import toast from 'react-hot-toast';

export default function AdminSpecialties() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ name: '', slug: '', description: '' });

    const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setForm(item ? { name: item.name || '', slug: item.slug || '', description: item.description || '' } : { name: '', slug: '', description: '' });
    setShowModal(true);
    };

    const handleSave = async (e) => {
    e?.preventDefault();
    if (!form.name) { toast.error('Tên chuyên khoa là bắt buộc'); return; }
    setSubmitting(true);
    try {
        if (editingItem) {
        await adminAPI.updateSpecialty(editingItem.id, form);
        toast.success('Cập nhật chuyên khoa thành công');
        } else {
        await adminAPI.createSpecialty(form);
        toast.success('Tạo chuyên khoa thành công');
        }
        setShowModal(false);
        loadData();
    } catch (err) {
        toast.error('Lỗi khi lưu chuyên khoa');
    } finally {
        setSubmitting(false);
    }};

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await publicAPI.getSpecialties();
            setItems(res.data);
        } catch (err) {
            toast.error('Lỗi khi tải danh sách chuyên khoa');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Xác nhận xóa chuyên khoa này?')) return;
        try {
            await adminAPI.deleteSpecialty(id);
            toast.success('Đã xóa thành công');
            loadData();
        } catch (err) {
            toast.error('Lỗi khi xóa');
        }
    };

    const filteredItems = items.filter(item => 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Tìm tên chuyên khoa..."
                            className="w-full pl-14 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] shadow-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none font-bold transition-all text-slate-700 placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-3 bg-purple-600 text-white px-8 py-5 rounded-[2rem] font-black hover:bg-purple-700 transition shadow-xl shadow-purple-100 uppercase tracking-widest text-xs">
                        <Plus size={20} />
                        Thêm chuyên khoa
                    </button>
                </div>

                {loading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                        <p className="text-slate-400 font-extrabold uppercase tracking-widest text-sm">Đang tải dữ liệu...</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100 shadow-sm">
                        <LayoutDashboard className="w-20 h-20 text-slate-100 mx-auto mb-6" />
                        <h4 className="text-2xl font-black text-slate-900 mb-2">Không tìm thấy chuyên khoa</h4>
                        <p className="text-slate-400 font-bold">Hãy cập nhật từ khóa tìm kiếm hoặc thêm mới.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredItems.map(item => (
                            <div key={item.id} className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-purple-100/50 transition-all group relative overflow-hidden">
                                <ShieldCheck className="absolute top-[-20px] left-[-20px] text-purple-50 group-hover:text-purple-100 transition-colors" size={120} />
                                
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="w-16 h-16 bg-purple-50 rounded-3xl flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                                            <p className="text-2xl font-black">{item.name?.charAt(0)}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleOpenModal(item)} className="p-3 bg-white text-slate-400 hover:bg-purple-600 hover:text-white rounded-2xl shadow-sm border border-slate-50 transition-all">
                                                <Pencil size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(item.id)}
                                                className="p-3 bg-white text-slate-400 hover:bg-rose-500 hover:text-white rounded-2xl shadow-sm border border-slate-50 transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <h4 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-purple-600 transition-colors">{item.name}</h4>
                                    <p className="text-slate-500 font-bold text-sm leading-relaxed mb-6 line-clamp-3">
                                        {item.description || 'Chưa có mô tả chi tiết cho chuyên khoa này.'}
                                    </p>
                                    
                                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã CK: #{item.id}</span>
                                        <button className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:translate-x-1 transition-transform">Xem bác sĩ →</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-6 z-[100]">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                        <h3 className="text-lg font-black">{editingItem ? 'Sửa chuyên khoa' : 'Tạo chuyên khoa'}</h3>
                        <p className="text-xs text-slate-400">{editingItem ? `ID: #${editingItem.id}` : 'Thêm chuyên khoa mới'}</p>
                        </div>
                        <button onClick={() => setShowModal(false)} className="p-2"><X /></button>
                    </div>

                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                        <label className="text-xs font-bold">Tên chuyên khoa</label>
                        <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3 rounded-xl border" />
                        </div>
                        <div>
                        <label className="text-xs font-bold">Slug (tùy chọn)</label>
                        <input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="w-full p-3 rounded-xl border" />
                        </div>
                        <div>
                        <label className="text-xs font-bold">Mô tả</label>
                        <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-3 rounded-xl border min-h-[100px]" />
                        </div>

                        <div className="flex gap-3 justify-end">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-3 bg-slate-100 rounded-xl">Hủy</button>
                        <button type="submit" disabled={submitting} className="px-6 py-3 bg-indigo-600 text-white rounded-xl">{submitting ? 'Đang lưu...' : (editingItem ? 'Lưu' : 'Tạo')}</button>
                        </div>
                    </form>
                    </div>
                </div>
                )}
        </AdminLayout>
    );
}
