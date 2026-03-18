import { useState, useEffect } from 'react';
import { 
    Users, 
    MapPin, 
    Stethoscope, 
    UserRound,
    Search,
    Loader2,
    CheckCircle2,
    Hospital
} from 'lucide-react';
import { staffAPI } from '../../utils/api';
import StaffLayout from '../../layouts/StaffLayout';
import toast from 'react-hot-toast';

export default function StaffRooms() {
    const [doctors, setDoctors] = useState([]);
    const [rooms, setRooms] = useState([
        { id: 'R101', name: 'Phòng 101', doctorId: null },
        { id: 'R102', name: 'Phòng 102', doctorId: null },
        { id: 'R103', name: 'Phòng 103', doctorId: null },
        { id: 'R104', name: 'Phòng 104', doctorId: null },
        { id: 'R201', name: 'Phòng 201', doctorId: null },
        { id: 'R202', name: 'Phòng 202', doctorId: null },
    ]);
    const [loading, setLoading] = useState(true);
    const [hospital, setHospital] = useState(null);
    const [draggingDoctor, setDraggingDoctor] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch Hospital info first to get real rooms list
            const hospRes = await staffAPI.getStaffHospital();
            const currentHospital = hospRes.data;
            setHospital(currentHospital);
            
            // Fetch Doctors (filtered by backend for Staff's hospital)
            const docRes = await staffAPI.getDoctors();
            const doctorsList = docRes.data;
            setDoctors(doctorsList);

            // Generate rooms and fill with assigned doctors from DB
            if (currentHospital.rooms && currentHospital.rooms.length > 0) {
                const initialRooms = currentHospital.rooms.map((roomName, index) => {
                    // Find if any doctor is assigned to this room in the database
                    const doctorInThisRoom = doctorsList.find(d => d.workingRoom === roomName);
                    return {
                        id: `ROOM-${index + 1}`,
                        name: roomName,
                        doctorId: doctorInThisRoom ? doctorInThisRoom.id : null
                    };
                });
                setRooms(initialRooms);
            }
        } catch (err) {
            toast.error('Lỗi khi tải dữ liệu phối phòng');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Drag and Drop handlers
    const onDragStart = (doctor) => {
        setDraggingDoctor(doctor);
    };

    const onDrop = async (roomData) => {
        if (!draggingDoctor) return;
        
        try {
            // 1. Update backend: Set doctor's working room
            await staffAPI.updateDoctorRoom(draggingDoctor.id, roomData.name);
            
            // 2. Update local state
            setRooms(prev => prev.map(room => {
                // Remove doctor from any other room UI
                if (room.doctorId === draggingDoctor.id) {
                    return { ...room, doctorId: null };
                }
                // Add to new room
                if (room.id === roomData.id) {
                    return { ...room, doctorId: draggingDoctor.id };
                }
                return room;
            }));

            // Update doctors workingRoom locally to keep isAssigned correct
            setDoctors(prev => prev.map(d => d.id === draggingDoctor.id ? {...d, workingRoom: roomData.name} : d));
            
            toast.success(`Đã xếp Bs. ${draggingDoctor.fullName} vào ${roomData.name}`);
        } catch (err) {
            toast.error('Lỗi khi cập nhật phòng khám');
        } finally {
            setDraggingDoctor(null);
        }
    };

    const clearRoom = async (roomData) => {
        const docInRoom = doctors.find(d => d.id === roomData.doctorId);
        if (!docInRoom) return;

        try {
            // Update backend (set room to empty string or null)
            await staffAPI.updateDoctorRoom(docInRoom.id, "");
            
            // Update UI
            setRooms(prev => prev.map(r => r.id === roomData.id ? { ...r, doctorId: null } : r));
            setDoctors(prev => prev.map(d => d.id === docInRoom.id ? {...d, workingRoom: null} : d));
            
            toast.success(`Đã hủy phân phòng cho Bs. ${docInRoom.fullName}`);
        } catch (err) {
            toast.error('Lỗi khi gỡ phân phòng');
        }
    };

    const getDoctorInRoom = (doctorId) => {
        return doctors.find(d => d.id === doctorId);
    };

    return (
        <StaffLayout>
            <div className="max-w-7xl mx-auto space-y-10">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Điều phối Phòng khám 🏢</h3>
                        <p className="text-slate-500 font-bold text-sm">Sắp xếp bác sĩ trực tại các phòng thuộc {hospital?.name || 'bệnh viện'}.</p>
                    </div>
                    {hospital && (
                        <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 flex items-center gap-3">
                            <Hospital className="text-emerald-600" size={20} />
                            <span className="font-black text-emerald-800 uppercase tracking-widest text-xs">{hospital.name}</span>
                        </div>
                    )}
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Doctors List */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-emerald-50">
                            <h4 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                                <Stethoscope className="text-emerald-600" size={24} />
                                Danh sách bác sĩ
                            </h4>
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {loading ? (
                                    <div className="py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Đang tải...</div>
                                ) : doctors.map(doc => {
                                    const isAssigned = rooms.some(r => r.doctorId === doc.id);
                                    return (
                                        <div 
                                            key={doc.id}
                                            draggable={!isAssigned}
                                            onDragStart={() => onDragStart(doc)}
                                            className={`p-5 rounded-2xl border transition-all cursor-grab active:cursor-grabbing ${
                                                isAssigned 
                                                ? 'bg-slate-50 border-slate-100 opacity-50 grayscale cursor-not-allowed' 
                                                : 'bg-white border-emerald-50 hover:border-emerald-500 hover:shadow-lg shadow-emerald-100'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-black">
                                                    {doc.fullName.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-black text-slate-900 truncate">Bs. {doc.fullName}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{doc.specialty?.name}</p>
                                                </div>
                                                {isAssigned && <CheckCircle2 size={16} className="text-emerald-500" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Rooms Grid */}
                    <div className="lg:col-span-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {rooms.map(room => {
                                const doc = getDoctorInRoom(room.doctorId);
                                return (
                                    <div 
                                        key={room.id}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={() => onDrop(room)}
                                        className={`bg-white rounded-[2.5rem] p-8 border-2 border-dashed transition-all min-h-[180px] flex flex-col justify-center items-center gap-4 ${
                                            room.doctorId 
                                            ? 'border-emerald-500 bg-emerald-50/10' 
                                            : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/5'
                                        }`}
                                    >
                                        <div className="absolute top-4 left-6">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{room.id}</span>
                                        </div>
                                        
                                        {!room.doctorId ? (
                                            <div className="text-center group">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4 group-hover:scale-110 transition-transform">
                                                    <MapPin size={32} />
                                                </div>
                                                <p className="text-xl font-bold text-slate-900">{room.name}</p>
                                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">Kéo bác sĩ vào đây</p>
                                            </div>
                                        ) : (
                                            <div className="w-full relative text-center">
                                                <button 
                                                    onClick={() => clearRoom(room)}
                                                    className="absolute -top-10 -right-4 p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                                >
                                                    Hủy phân phòng
                                                </button>
                                                <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white font-black text-2xl mx-auto shadow-xl shadow-emerald-200 mb-4 animate-in zoom-in duration-300">
                                                    {doc?.fullName?.charAt(0)}
                                                </div>
                                                <h5 className="text-lg font-black text-slate-900 mb-1">{room.name}</h5>
                                                <p className="text-sm font-black text-emerald-600 uppercase tracking-tighter">Bs. {doc?.fullName}</p>
                                                <div className="mt-4 inline-flex items-center gap-2 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
                                                    Đang trực
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </StaffLayout>
    );
}
