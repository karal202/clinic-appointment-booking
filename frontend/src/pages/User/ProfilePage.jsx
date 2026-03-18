import { useState, useEffect } from 'react';
import { 
  User, Calendar, Bell, Shield, LogOut, 
  ChevronRight, Home, Clock, MapPin, 
  CheckCircle, AlertCircle, RefreshCw,
  Camera, Edit3, Save, X, Loader2, ArrowRight,
  ClipboardList, Stethoscope, FileText
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AssistantButton from '../../components/AssistantButton';
import { getCurrentUser, userAPI, medicalRecordAPI, logout, isLoggedIn } from '../../utils/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('info'); 
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: '', phoneNumber: '', address: '' });

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setProfileForm({
      fullName: currentUser?.fullName || '',
      phoneNumber: currentUser?.phoneNumber || '',
      address: currentUser?.address || ''
    });

    if (activeTab === 'records' && currentUser) {
      loadRecords(currentUser.id);
    }
    
    document.title = "Trang cá nhân - clinic-booking";
  }, [navigate, activeTab]);

  const loadRecords = async (userId) => {
    setLoadingRecords(true);
    try {
      const res = await medicalRecordAPI.getRecordsByUser(userId);
      setRecords(res.data);
    } catch (err) {
      toast.error('Không thể tải hồ sơ khám');
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    // Prevent accidental submit when not in edit mode
    if (!editing) return;

    // Treat null/undefined and empty string as equal so we don't send no-op updates
    const normalize = (v) => (v === null || v === undefined) ? '' : String(v).trim();
    const noChange = (
      normalize(profileForm.fullName) === normalize(user?.fullName) &&
      normalize(profileForm.phoneNumber) === normalize(user?.phoneNumber) &&
      normalize(profileForm.address) === normalize(user?.address)
    );

    if (noChange) {
      toast('Bạn chưa thay đổi thông tin nào!', { icon: 'ℹ️' });
      return;
    }

    // Update profile
    try {
      const response = await userAPI.updateProfile(profileForm);
      const serverUser = response?.data || null;

      // Use server response when available; otherwise fall back to values user just submitted
      const mergedUser = {
        ...user,
        ...(serverUser || {}),
        ...profileForm
      };

      setUser(mergedUser);
      localStorage.setItem('user', JSON.stringify(mergedUser));
      window.dispatchEvent(new Event('user-updated'));

      setProfileForm({
        fullName: mergedUser.fullName || '',
        phoneNumber: mergedUser.phoneNumber || '',
        address: mergedUser.address || ''
      });

      toast.success('Cập nhật thông tin thành công!');
      setEditing(false);
    } catch (err) {
      console.error('updateProfile error', err);
      const msg = err?.response?.data?.message || 'Lỗi cập nhật thông tin';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Sidebar */}
          <div className="lg:w-80 shrink-0 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
               {/* Background pattern */}
               <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-600 to-indigo-600 opacity-10"></div>
               
               <div className="relative z-10 flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-4xl font-extrabold shadow-xl border-4 border-white">
                       {user?.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-500 hover:text-blue-600 transition border border-slate-100">
                       <Camera size={14} />
                    </button>
                  </div>
                  
                  <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">{user?.fullName}</h3>
                  <p className="text-sm text-slate-400 font-medium mb-8">{user?.email}</p>
                  
                  <div className="w-full space-y-2">
                     <button 
                        onClick={() => navigate('/my-bookings')}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all text-slate-600 hover:bg-slate-50`}
                      >
                        <div className="flex items-center gap-3">
                           <Calendar size={18} /> Lịch khám của tôi
                        </div>
                        <ChevronRight size={16} />
                     </button>
                      <button 
                         onClick={() => setActiveTab('info')}
                         className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all ${activeTab === 'info' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-600 hover:bg-slate-50'}`}
                       >
                         <div className="flex items-center gap-3">
                            <User size={18} /> Thông tin cá nhân
                         </div>
                         {activeTab !== 'info' && <ChevronRight size={16} />}
                      </button>
                      <button 
                         onClick={() => setActiveTab('records')}
                         className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all ${activeTab === 'records' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-600 hover:bg-slate-50'}`}
                       >
                         <div className="flex items-center gap-3">
                            <ClipboardList size={18} /> Hồ sơ khám bệnh
                         </div>
                         {activeTab !== 'records' && <ChevronRight size={16} />}
                      </button>
                      <div className="h-px bg-slate-100 my-4"></div>
                     <button 
                        onClick={() => {logout(); navigate('/');}}
                        className="w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 transition-all"
                      >
                        <LogOut size={18} /> Đăng xuất
                     </button>
                  </div>
               </div>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
               <Shield size={60} className="absolute -bottom-4 -right-4 text-white/10 rotate-12" />
               <h4 className="font-bold text-lg mb-2">Cần hỗ trợ?</h4>
               <p className="text-xs text-slate-400 leading-relaxed mb-6">Mọi thắc mắc về lịch hẹn hoặc cần tư vấn y tế gấp, vui lòng gọi cho chúng tôi.</p>
               <a href="tel:19009999" className="flex items-center gap-2 font-extrabold text-xl text-blue-400">
                  1900 9999
               </a>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
              <div className="space-y-6">
                 <h2 className="text-3xl font-extrabold text-slate-900 uppercase tracking-tight mb-8">
                   {activeTab === 'info' ? 'Thông tin cá nhân' : 'Hồ sơ khám bệnh'}
                 </h2>
                 
                 {activeTab === 'info' ? (
                   <form onSubmit={handleUpdateProfile} className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                       <div className="space-y-2">
                          <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest pl-1">Họ và tên</label>
                          <div className="relative">
                             <input 
                                type="text" 
                                readOnly={!editing}
                                value={profileForm.fullName}
                                onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})}
                                className={`w-full bg-slate-50 border rounded-2xl px-6 py-4 font-bold outline-none transition-all ${editing ? 'border-blue-600 ring-4 ring-blue-50' : 'border-transparent text-slate-600 cursor-default'}`}
                             />
                             {!editing && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"><Edit3 size={16} /></div>}
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest pl-1">Số điện thoại</label>
                          <input 
                             type="text" 
                             readOnly={!editing}
                             value={profileForm.phoneNumber}
                             onChange={(e) => setProfileForm({...profileForm, phoneNumber: e.target.value})}
                             className={`w-full bg-slate-50 border rounded-2xl px-6 py-4 font-bold outline-none transition-all ${editing ? 'border-blue-600 ring-4 ring-blue-50' : 'border-transparent text-slate-600 cursor-default'}`}
                          />
                       </div>
                       <div className="md:col-span-2 space-y-2">
                          <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest pl-1">Địa chỉ</label>
                          <input 
                             type="text" 
                             readOnly={!editing}
                             value={profileForm.address}
                             onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                             className={`w-full bg-slate-50 border rounded-2xl px-6 py-4 font-bold outline-none transition-all ${editing ? 'border-blue-600 ring-4 ring-blue-50' : 'border-transparent text-slate-600 cursor-default'}`}
                          />
                       </div>
                    </div>

                    <div className="flex items-center gap-4">
                       {editing ? (
                          <>
                             <button 
                               type="submit"
                               className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-extrabold shadow-lg shadow-blue-200 hover:bg-blue-700 transition"
                             >
                               <Save size={18} /> Lưu thay đổi
                             </button>
                             <button 
                               type="button"
                               onClick={() => {
                                  setEditing(false);
                                  setProfileForm({
                                     fullName: user?.fullName || '',
                                     phoneNumber: user?.phoneNumber || '',
                                     address: user?.address || ''
                                  });
                               }}
                               className="flex items-center gap-2 bg-slate-100 text-slate-600 px-8 py-4 rounded-xl font-extrabold hover:bg-slate-200 transition"
                             >
                               <X size={18} /> Hủy bỏ
                             </button>
                          </>
                       ) : (
                          <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditing(true); }}
                            className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-xl font-extrabold shadow-lg hover:bg-blue-600 transition"
                          >
                            Chỉnh sửa thông tin
                          </button>
                       )}
                    </div>
                   </form>
                 ) : (
                   <div className="space-y-4">
                     {loadingRecords ? (
                       <div className="bg-white rounded-[2.5rem] p-20 text-center shadow-xl shadow-slate-200/50">
                         <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                         <p className="text-slate-500 font-bold">Đang tải hồ sơ của bạn...</p>
                       </div>
                     ) : records.length === 0 ? (
                        <div className="bg-white rounded-[2.5rem] p-20 text-center shadow-xl shadow-slate-200/50 border border-slate-100">
                          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ClipboardList className="w-10 h-10 text-slate-300" />
                          </div>
                          <h4 className="text-xl font-extrabold text-slate-900 mb-2">Chưa có hồ sơ khám</h4>
                          <p className="text-slate-500 font-medium">Hồ sơ sẽ xuất hiện sau khi bác sĩ hoàn tất quá trình khám bệnh cho bạn.</p>
                        </div>
                     ) : (
                       records.map(record => (
                         <div key={record.id} className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                            <div className="flex flex-col md:flex-row gap-6">
                              <div className="shrink-0 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100 w-full md:w-32">
                                <span className="text-2xl font-black text-blue-600">{new Date(record.createdAt).getDate()}</span>
                                <span className="text-xs font-bold text-slate-400 uppercase">Tháng {new Date(record.createdAt).getMonth() + 1}</span>
                              </div>
                              <div className="flex-1 space-y-4">
                                <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-2">
                                      <Stethoscope className="w-5 h-5 text-blue-600" />
                                      <h4 className="text-lg font-extrabold text-slate-900">Bác sĩ: {record.doctorName}</h4>
                                   </div>
                                   <span className="text-xs font-bold text-slate-400">{new Date(record.createdAt).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div className="bg-slate-50/50 p-4 rounded-2xl">
                                      <div className="flex items-center gap-2 mb-2">
                                         <AlertCircle className="w-4 h-4 text-orange-500" />
                                         <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Triệu chứng</span>
                                      </div>
                                      <p className="text-sm font-bold text-slate-600">{record.symptoms || 'Không ghi chú'}</p>
                                   </div>
                                   <div className="bg-blue-50/30 p-4 rounded-2xl">
                                      <div className="flex items-center gap-2 mb-2">
                                         <CheckCircle className="w-4 h-4 text-blue-600" />
                                         <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Chẩn đoán</span>
                                      </div>
                                      <p className="text-sm font-bold text-slate-800">{record.diagnosis}</p>
                                   </div>
                                </div>
                                <div className="bg-slate-900 text-white p-6 rounded-2xl relative overflow-hidden">
                                   <FileText className="absolute top-4 right-4 text-white/10" size={40} />
                                   <div className="flex items-center gap-2 mb-3">
                                      <span className="text-xs font-extrabold text-blue-400 uppercase tracking-widest">Đơn thuốc & Điều trị</span>
                                   </div>
                                   <p className="text-sm font-medium text-slate-300 leading-relaxed mb-4">{record.treatmentPlan}</p>
                                   <div className="h-px bg-white/10 mb-4"></div>
                                   <p className="text-sm italic text-blue-100 font-bold">{record.prescription}</p>
                                </div>
                              </div>
                            </div>
                         </div>
                       ))
                     )}
                   </div>
                 )}
              </div>
          </div>
        </div>
      </div>

      <AssistantButton />
      <Footer />
    </div>
  );
}
