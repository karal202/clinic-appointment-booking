import { useState, useEffect } from 'react';
import { 
    Hospital, 
    Plus, 
    Pencil, 
    Trash2, 
    Search,
    MapPin,
    Phone,
    Globe,
    Loader2,
    X,
    Save,
    LayoutDashboard
} from 'lucide-react';
import { adminAPI, publicAPI } from '../../utils/api';
import AdminLayout from '../../layouts/AdminLayout';
import toast from 'react-hot-toast';

export default function AdminHospitals() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form, setForm] = useState({
        name: '',
        address: '',
        phone: '',
        imageUrl: '',
        details: '',
        rooms: []
    });
    const [newRoom, setNewRoom] = useState('');

    // bundled hospital images from src/assets/hospitals — load with import.meta.glob for compatibility
    const hospitalModules = import.meta.glob('../../assets/hospitals/*.{png,jpg,jpeg,webp,svg}');
    const [HOSPITAL_ASSETS, setHospitalAssets] = useState([]);
    const [showHospitalAssetPicker, setShowHospitalAssetPicker] = useState(false);

    // load bundled hospital assets
    useEffect(() => {
        const loadAssets = async () => {
            try {
                const loaders = Object.values(hospitalModules);
                const mods = await Promise.all(loaders.map(fn => fn()));
                setHospitalAssets(mods.map(m => m.default || m));
            } catch (err) {
                console.error('Failed to load hospital assets', err);
            }
        };
        loadAssets();

        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await publicAPI.getCenters();
            setItems(res.data);
        } catch (err) {
            toast.error('Lỗi khi tải danh sách bệnh viện');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setForm({
                name: item.name || '',
                address: item.address || '',
                phone: item.phone || '',
                imageUrl: item.imageUrl || '',
                details: item.details || '',
                rooms: item.rooms || []
            });
        } else {
            setEditingItem(null);
            setForm({
                name: '',
                address: '',
                phone: '',
                imageUrl: '',
                details: '',
                rooms: []
            });
        }
        setShowModal(true);
    };

    // Upload image from local disk and set `form.imageUrl` to returned URL
    const handleFileChangeHospital = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await adminAPI.uploadFile(fd);
            setForm(prev => ({ ...prev, imageUrl: res.data.url }));
            toast.success('Ảnh bệnh viện đã được tải lên');
        } catch (err) {
            console.error(err);
            toast.error('Không thể tải ảnh lên');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await adminAPI.updateHospital(editingItem.id, form);
                toast.success('Đã cập nhật bệnh viện');
            } else {
                await adminAPI.createHospital(form);
                toast.success('Đã thêm bệnh viện mới');
            }
            setShowModal(false);
            loadData();
        } catch (err) {
            toast.error('Lỗi khi lưu thông tin');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Xác nhận xóa bệnh viện này?')) return;
        try {
            await adminAPI.deleteHospital(id);
            toast.success('Đã xóa thành công');
            loadData();
        } catch (err) {
            toast.error('Lỗi khi xóa');
        }
    };

    const addRoom = () => {
        if (!newRoom.trim()) return;
        if (form.rooms.includes(newRoom.trim())) {
            toast.error('Phòng này đã tồn tại');
            return;
        }
        setForm({ ...form, rooms: [...form.rooms, newRoom.trim()] });
        setNewRoom('');
    };

    const removeRoom = (roomName) => {
        setForm({ ...form, rooms: form.rooms.filter(r => r !== roomName) });
    };

    const filteredItems = items.filter(item => 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Tìm tên, địa chỉ bệnh viện..."
                            className="w-full pl-14 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] shadow-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none font-bold transition-all text-slate-700 placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-3 bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black hover:bg-slate-800 transition shadow-xl shadow-slate-200 uppercase tracking-widest text-xs"
                    >
                        <Plus size={20} />
                        Thêm bệnh viện
                    </button>
                </div>

                {loading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                        <p className="text-slate-400 font-extrabold uppercase tracking-widest text-sm">Đang tải dữ liệu...</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100 shadow-sm">
                        <Hospital className="w-20 h-20 text-slate-100 mx-auto mb-6" />
                        <h4 className="text-2xl font-black text-slate-900 mb-2">Không tìm thấy bệnh viện</h4>
                        <p className="text-slate-400 font-bold">Hãy cập nhật từ khóa tìm kiếm hoặc thêm mới bệnh viện.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredItems.map(item => (
                            <div key={item.id} className="bg-white rounded-[3rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all group flex flex-col">
                                <div className="h-48 bg-slate-100 relative overflow-hidden">
                                    <img 
                                        src={item.imageUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800'} 
                                        alt={item.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute top-6 right-6 flex gap-2">
                                        <button 
                                            onClick={() => handleOpenModal(item)}
                                            className="p-3 bg-white/90 backdrop-blur-md rounded-2xl text-slate-900 hover:bg-indigo-600 hover:text-white transition-all shadow-lg shadow-black/5"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(item.id)}
                                            className="p-3 bg-white/90 backdrop-blur-md rounded-2xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-black/5"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-4 left-6">
                                        <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-600">
                                            {item.rooms?.length || 0} Phòng khám
                                        </span>
                                    </div>
                                </div>
                                <div className="p-8 flex flex-col flex-1">
                                    <h4 className="text-xl font-black text-slate-900 mb-6 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">{item.name}</h4>
                                    
                                    <div className="space-y-4 mb-6">
                                        <div className="flex gap-3 items-start">
                                            <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400">
                                                <MapPin size={16} />
                                            </div>
                                            <p className="text-sm font-bold text-slate-500 flex-1 line-clamp-2">{item.address}</p>
                                        </div>
                                    </div>

                                    {item.rooms && item.rooms.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-auto pt-6 border-t border-slate-50">
                                            {item.rooms.slice(0, 3).map(room => (
                                                <span key={room} className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                                                    {room}
                                                </span>
                                            ))}
                                            {item.rooms.length > 3 && (
                                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                                                    +{item.rooms.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
                        <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
                                <div>
                                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                                        {editingItem ? 'Cập nhật Bệnh viện' : 'Thêm Bệnh viện mới'}
                                    </h4>
                                    <p className="text-slate-400 text-xs font-bold mt-1">Vui lòng điền đầy đủ các thông tin chi tiết bên dưới.</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400">
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Column 1: Basic Info */}
                                    <div className="space-y-6">
                                        <h5 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-indigo-50 pb-2">Thông tin cơ bản</h5>
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Tên bệnh viện</label>
                                                <input 
                                                    required
                                                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
                                                    value={form.name}
                                                    onChange={e => setForm({...form, name: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Địa chỉ</label>
                                                <input 
                                                    required
                                                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
                                                    value={form.address}
                                                    onChange={e => setForm({...form, address: e.target.value})}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Điện thoại</label>
                                                    <input 
                                                        className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
                                                        value={form.phone}
                                                        onChange={e => setForm({...form, phone: e.target.value})}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Hình ảnh</label>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-28 h-20 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center">
                                                            {form.imageUrl ? (
                                                                <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="text-slate-300 font-black">No</div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex gap-3 items-center">
                                                                <input type="file" accept="image/*" onChange={handleFileChangeHospital} />
                                                                <button type="button" onClick={() => setShowHospitalAssetPicker(true)} className="px-3 py-2 bg-slate-100 rounded-2xl text-sm font-bold">Chọn từ thư viện</button>
                                                            </div>
                                                            <p className="text-[11px] text-slate-400 mt-2">Hoặc dán URL ảnh vào bên dưới</p>
                                                            <input 
                                                                className="w-full mt-2 bg-slate-50 border-2 border-transparent rounded-2xl px-4 py-3 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
                                                                placeholder="URL ảnh (tùy chọn)"
                                                                value={form.imageUrl}
                                                                onChange={e => setForm({...form, imageUrl: e.target.value})}
                                                            />

                                                            {showHospitalAssetPicker && (
                                                                <div className="mt-3 grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg bg-white">
                                                                    {HOSPITAL_ASSETS.map((src, idx) => (
                                                                        <button key={idx} type="button" onClick={() => { setForm(prev => ({ ...prev, imageUrl: src })); setShowHospitalAssetPicker(false); toast.success('Đã chọn ảnh bệnh viện'); }} className="w-20 h-20 p-0 border rounded-lg overflow-hidden">
                                                                            <img src={src} alt={`h-${idx}`} className="w-full h-full object-cover" />
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Mô tả chi tiết</label>
                                                <textarea 
                                                    rows="4"
                                                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner resize-none"
                                                    value={form.details}
                                                    onChange={e => setForm({...form, details: e.target.value})}
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 2: Rooms Management */}
                                    <div className="space-y-6">
                                        <h5 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-indigo-50 pb-2">Danh sách Phòng khám</h5>
                                        <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 flex flex-col h-full min-h-[300px]">
                                            <div className="flex gap-2 mb-6">
                                                <input 
                                                    type="text"
                                                    placeholder="Nhập tên phòng..."
                                                    className="flex-1 bg-white border-2 border-transparent rounded-xl px-4 py-3 font-bold outline-none focus:border-indigo-600 transition-all shadow-sm text-sm"
                                                    value={newRoom}
                                                    onChange={e => setNewRoom(e.target.value)}
                                                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addRoom())}
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={addRoom}
                                                    className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition"
                                                >
                                                    <Plus size={20} />
                                                </button>
                                            </div>

                                            <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                                                {form.rooms.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                                                        <LayoutDashboard size={40} className="mb-2 opacity-20" />
                                                        <p className="text-xs font-bold uppercase tracking-widest">Chưa có phòng nào</p>
                                                    </div>
                                                ) : (
                                                    form.rooms.map(room => (
                                                        <div key={room} className="flex justify-between items-center bg-white p-3 px-4 rounded-xl shadow-sm border border-slate-100 group">
                                                            <span className="text-sm font-bold text-slate-700">{room}</span>
                                                            <button 
                                                                type="button"
                                                                onClick={() => removeRoom(room)}
                                                                className="text-slate-300 hover:text-rose-500 transition-colors"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>

                            <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-4 shrink-0">
                                <button 
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-10 py-5 bg-white text-slate-500 rounded-2xl font-black hover:bg-slate-100 transition uppercase text-xs tracking-widest border border-slate-200"
                                >
                                    Hủy bỏ
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleSave}
                                    className="flex-1 px-10 py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-indigo-600 transition flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
                                >
                                    <Save size={18} />
                                    {editingItem ? 'Lưu thay đổi' : 'Tạo bệnh viện'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
