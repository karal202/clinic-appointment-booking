import { useEffect, useRef, useState, useCallback } from 'react';
import { 
    X, QrCode, CheckCircle2, AlertCircle, 
    Loader2, Camera, User, Clock, Hash, RefreshCw,
    Upload, ImagePlus
} from 'lucide-react';
import { staffAPI } from '../utils/api';
import toast from 'react-hot-toast';
import jsQR from 'jsqr';

/**
 * QrCheckInScanner — jsQR + native camera API + image upload
 * jsQR được load từ CDN lần đầu và cached trên window.jsQR
 *
 * Props:
 *   onClose: () => void
 *   onSuccess: (appointmentDTO) => void
 */
export default function QrCheckInScanner({ onClose, onSuccess }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const rafRef = useRef(null);
    const fileInputRef = useRef(null);

    // 'camera' | 'upload'
    const [tab, setTab] = useState('camera');
    const [phase, setPhase] = useState('loading'); // loading | scanning | found | checking | done | error
    const [appointment, setAppointment] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [cameraReady, setCameraReady] = useState(false);
    const [uploadPreview, setUploadPreview] = useState(null); // base64 preview
    const [uploadDragging, setUploadDragging] = useState(false);

    // ── Khởi động camera khi tab = camera ────────────────────
    useEffect(() => {
        if (tab === 'camera') {
            startCamera();
        } else {
            stopCamera();
            // reset về idle khi chuyển sang upload tab
            if (phase !== 'found' && phase !== 'done') {
                setPhase('idle');
            }
        }
        return () => stopCamera();
    }, [tab]);

    // ── Cleanup on unmount ────────────────────────────────────
    useEffect(() => () => stopCamera(), []);

    // ── Camera helpers ────────────────────────────────────────
    const startCamera = async () => {
        setPhase('loading');
        setCameraReady(false);
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error('[QR] navigator.mediaDevices.getUserMedia is not available', {
                    hasMediaDevices: !!navigator.mediaDevices,
                });
                setPhase('error');
                setErrorMsg('Trình duyệt này không hỗ trợ mở camera. Hãy thử dùng Chrome hoặc một trình duyệt mới hơn.');
                return;
            }

            console.log('[QR] Requesting camera access...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            console.log('[QR] Camera stream acquired', {
                tracks: stream.getVideoTracks().map(t => ({ label: t.label, enabled: t.enabled, readyState: t.readyState })),
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    console.log('[QR] Video metadata loaded, starting playback');
                    videoRef.current.play()
                        .then(() => {
                            console.log('[QR] Video playback started');
                            setCameraReady(true);
                            setPhase('scanning');
                            rafRef.current = requestAnimationFrame(tick);
                        })
                        .catch(playErr => {
                            console.error('[QR] Error starting video playback', playErr);
                            setPhase('error');
                            setErrorMsg('Không thể hiển thị camera. Hãy chạm vào màn hình một lần rồi thử lại.');
                        });
                };
            } else {
                console.warn('[QR] videoRef is null after getting stream');
            }
        } catch (err) {
            console.error('[QR] Failed to start camera', err);
            setPhase('error');
            if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
                setErrorMsg('Bạn chưa cấp quyền truy cập camera hoặc trình duyệt chặn camera. Vui lòng cho phép trong cài đặt và thử lại.');
            } else if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
                setErrorMsg('Không tìm thấy thiết bị camera phù hợp. Hãy kiểm tra lại camera hoặc thử thiết bị khác.');
            } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                setErrorMsg('Trình duyệt chỉ cho phép mở camera trên kết nối HTTPS. Hãy truy cập lại bằng đường dẫn https hoặc dùng localhost khi phát triển.');
            } else {
                setErrorMsg('Không thể mở camera. Hãy kiểm tra thiết bị và thử lại.');
            }
        }
    };

    const stopCamera = () => {
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
        setCameraReady(false);
    };

    // ── jsQR scan loop (camera) ───────────────────────────────
    const tick = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
            if (!video) {
                console.debug('[QR] tick: video element not ready yet');
            } else if (video.readyState !== video.HAVE_ENOUGH_DATA) {
                console.debug('[QR] tick: video has not enough data yet', { readyState: video.readyState });
            }
            if (!canvas) {
                console.debug('[QR] tick: canvas not ready yet');
            }
            rafRef.current = requestAnimationFrame(tick);
            return;
        }
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
        if (code?.data) {
            console.log('[QR] QR detected from camera stream');
            stopCamera();
            handleScanned(code.data);
            return;
        }
        rafRef.current = requestAnimationFrame(tick);
    }, []);

    // ── Decode QR từ ảnh upload ───────────────────────────────
    const decodeImageFile = async (file) => {
        if (!file || !file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file ảnh hợp lệ');
            return;
        }

        setUploadPreview(null);
        setPhase('checking');

        // 1. Đọc file thành base64
        const src = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => {
                console.error('[QR] FileReader error while reading image file', e);
                reject(e);
            };
            reader.readAsDataURL(file);
        });
        setUploadPreview(src);

        // 2. Vẽ ảnh lên canvas rồi decode
        const img = await new Promise((resolve, reject) => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.onerror = reject;
            i.src = src;
        }).catch(() => null);

        if (!img) {
            setPhase('error');
            setErrorMsg('Không đọc được file ảnh. Thử chọn ảnh khác.');
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
        if (code?.data) {
            handleScanned(code.data);
        } else {
            setPhase('error');
            setErrorMsg('Không tìm thấy mã QR trong ảnh. Hãy chắc chắn ảnh rõ nét và chứa đúng mã QR check-in.');
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) decodeImageFile(file);
        // reset input để có thể chọn lại cùng file
        e.target.value = '';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setUploadDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) decodeImageFile(file);
    };

    // ── Parse QR payload (JSON hoặc plain code) ─────────────
    const parseQrPayload = (raw) => {
        const trimmed = raw.trim();
        try {
            const obj = JSON.parse(trimmed);
            console.log('[QR] Decoded JSON payload:', obj);
            return { code: obj.appointmentCode, meta: obj };
        } catch {
            // fallback: plain appointmentCode string
            console.log('[QR] Decoded plain code:', trimmed);
            return { code: trimmed, meta: null };
        }
    };

    // ── Business logic — auto check-in ngay khi quét ────────
    const handleScanned = async (raw) => {
        const { code, meta } = parseQrPayload(raw);

        console.group('[QR] Scan detected');
        console.log('Raw:', raw);
        console.log('appointmentCode:', code);
        if (meta) {
            console.log('Patient:', meta.patientName);
            console.log('Doctor:', meta.doctorName);
            console.log('Date/Time:', meta.date, meta.time);
        }
        console.groupEnd();

        if (!code) {
            setPhase('error');
            setErrorMsg('Mã QR không hợp lệ. Vui lòng dùng mã QR check-in đúng.');
            return;
        }

        setPhase('checking');
        try {
            console.log('[QR] Looking up appointment by code:', code);
            const res = await staffAPI.getAppointmentByCode(code);
            const found = res.data;

            console.log('[QR] Appointment found:', { id: found.id, status: found.status, patient: found.patientName });

            // Đã check-in rồi → hiển thị luôn không cần xử lý thêm
            if (found.status === 'CHECKED_IN') {
                console.log('[QR] Already checked in, queue#:', found.queueNumber);
                setAppointment(found);
                setPhase('done');
                toast(`${found.patientName} đã check-in trước đó — STT #${found.queueNumber}`, { icon: 'ℹ️' });
                onSuccess?.(found);
                return;
            }

            // Chỉ CONFIRMED mới được auto check-in
            if (found.status !== 'CONFIRMED') {
                console.warn('[QR] Cannot check-in, status:', found.status);
                setAppointment(found);
                setPhase('found'); // hiển thị card thông tin + thông báo lý do
                return;
            }

            // AUTO CHECK-IN
            console.log('[QR] Auto check-in for appointment id:', found.id);
            await staffAPI.checkIn(found.id);
            console.log('[QR] checkIn API called successfully');

            const refreshed = await staffAPI.getAppointmentByCode(code);
            const updated = refreshed.data;
            console.log('[QR] Updated appointment after check-in:', { status: updated.status, queueNumber: updated.queueNumber });

            setAppointment(updated);
            setPhase('done');
            toast.success(`✓ Check-in tự động: ${updated.patientName} — STT #${updated.queueNumber}`);
            onSuccess?.(updated);

        } catch (err) {
            console.error('[QR] Error during handleScanned:', err);
            setPhase('error');
            setErrorMsg(err.response?.data?.message || 'Lỗi khi tra cứu / check-in. Vui lòng thử lại.');
        }
    };

    const reset = () => {
        setAppointment(null);
        setErrorMsg('');
        setUploadPreview(null);
        if (tab === 'camera') startCamera();
        else setPhase('idle');
    };

    // ── Status helpers ────────────────────────────────────────
    const statusLabel = { PENDING: 'Chờ thanh toán', CONFIRMED: 'Đã xác nhận', CHECKED_IN: 'Đã check-in', COMPLETED: 'Đã hoàn thành', CANCELLED: 'Đã hủy' };
    const statusColor = {
        PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
        CONFIRMED: 'bg-blue-100 text-blue-700 border-blue-200',
        CHECKED_IN: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        COMPLETED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        CANCELLED: 'bg-rose-100 text-rose-700 border-rose-200',
    };

    // Các phase dùng chung (found/checking/done/error) thay vì theo tab
    const isSharedPhase = ['found', 'checking', 'done', 'error'].includes(phase);

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-md" onClick={onClose} />

            <div className="relative z-10 bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
                {/* ── Header ── */}
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-7 text-white flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <QrCode size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tight">Quét QR Check-in</h3>
                            <p className="text-emerald-100 text-xs font-bold mt-0.5">Dùng camera hoặc tải ảnh QR lên</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* ── Tab switcher ── */}
                {!isSharedPhase && (
                    <div className="flex border-b border-slate-100">
                        <button
                            onClick={() => { setTab('camera'); setPhase('loading'); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                                tab === 'camera'
                                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <Camera size={15} /> Camera
                        </button>
                        <button
                            onClick={() => setTab('upload')}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                                tab === 'upload'
                                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <ImagePlus size={15} /> Tải ảnh lên
                        </button>
                    </div>
                )}

                <div className="p-8">
                    {/* ══════════ TAB: CAMERA ══════════ */}
                    {tab === 'camera' && !isSharedPhase && (
                        <div>
                            <div className="relative rounded-2xl overflow-hidden bg-slate-900 shadow-xl" style={{ aspectRatio: '4/3' }}>
                                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                                <canvas ref={canvasRef} className="hidden" />

                                {cameraReady && (
                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                        <div className="absolute inset-0 bg-slate-900/40" />
                                        <div className="relative w-52 h-52">
                                            <div className="absolute top-0 left-0 w-9 h-9 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                                            <div className="absolute top-0 right-0 w-9 h-9 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                                            <div className="absolute bottom-0 left-0 w-9 h-9 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                                            <div className="absolute bottom-0 right-0 w-9 h-9 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
                                            <div className="absolute left-2 right-2 h-0.5 bg-emerald-400/90 top-1/2 -translate-y-1/2 animate-pulse shadow-[0_0_10px_3px_rgba(52,211,153,0.5)]" />
                                        </div>
                                    </div>
                                )}

                                {!cameraReady && phase === 'loading' && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900">
                                        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                                        <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest">Đang khởi động camera...</p>
                                    </div>
                                )}
                            </div>
                            <p className="text-center text-slate-400 text-xs font-semibold mt-4 flex items-center justify-center gap-2">
                                <Camera size={14} className="text-emerald-500" />
                                Căn chỉnh mã QR vào khung xanh — tự động nhận dạng
                            </p>
                        </div>
                    )}

                    {/* ══════════ TAB: UPLOAD ══════════ */}
                    {tab === 'upload' && !isSharedPhase && (
                        <div className="space-y-4">
                            {/* Drop zone */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setUploadDragging(true); }}
                                onDragLeave={() => setUploadDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all py-12 px-6 ${
                                    uploadDragging
                                        ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
                                        : 'border-slate-200 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/50'
                                }`}
                            >
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${uploadDragging ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                                    <Upload size={28} className={uploadDragging ? 'text-emerald-600' : 'text-slate-400'} />
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-slate-700 text-sm">Kéo thả ảnh vào đây</p>
                                    <p className="text-slate-400 text-xs font-semibold mt-1">hoặc <span className="text-emerald-600 font-black underline">chọn file từ máy</span></p>
                                    <p className="text-slate-300 text-[10px] font-semibold mt-2 uppercase tracking-widest">PNG · JPG · WEBP</p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>

                            <p className="text-center text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
                                Tải lên ảnh chụp màn hình hoặc ảnh mã QR check-in của bệnh nhân
                            </p>
                        </div>
                    )}

                    {/* ══════════ SHARED PHASES ══════════ */}

                    {/* CHECKING */}
                    {phase === 'checking' && (
                        <div className="py-14 flex flex-col items-center gap-4">
                            {uploadPreview && tab === 'upload' && (
                                <img src={uploadPreview} alt="preview" className="w-32 h-32 object-contain rounded-xl border border-slate-200 mb-2 opacity-60" />
                            )}
                            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                            <p className="font-bold text-slate-600 uppercase tracking-widest text-xs">Đang tra cứu lịch hẹn...</p>
                        </div>
                    )}

                    {/* FOUND */}
                    {phase === 'found' && appointment && (
                        <div className="space-y-5">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${statusColor[appointment.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                {statusLabel[appointment.status] || appointment.status}
                            </span>

                            <div className="bg-slate-50 border border-slate-200 rounded-2xl divide-y divide-slate-200 overflow-hidden">
                                <InfoRow icon={<User size={16} className="text-emerald-700" />} iconBg="bg-emerald-100"
                                    label="Bệnh nhân" main={appointment.patientName} sub={appointment.patientPhone} />
                                <InfoRow icon={<Hash size={16} className="text-blue-700" />} iconBg="bg-blue-100"
                                    label="Mã lịch hẹn" main={<span className="font-mono">{appointment.appointmentCode}</span>} />
                                <InfoRow icon={<Clock size={16} className="text-purple-700" />} iconBg="bg-purple-100"
                                    label="Thời gian · Bác sĩ"
                                    main={`${appointment.appointmentTime?.substring(0, 5)} · BS. ${appointment.doctor?.fullName}`}
                                    sub={appointment.assignedRoom ? `Phòng ${appointment.assignedRoom}` : null}
                                    subColor="text-blue-600" />
                            </div>

                            {/* FOUND phase chỉ hiển thị khi status không thể check-in (PENDING/CANCELLED...) */}
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                                <p className="text-amber-800 font-bold text-sm">
                                    Trạng thái <strong>{statusLabel[appointment.status]}</strong> — chưa thể check-in tự động.
                                </p>
                                <p className="text-amber-600 text-xs mt-1">Vui lòng xử lý thủ công hoặc yêu cầu bệnh nhân thanh toán trước.</p>
                            </div>
                            <button onClick={reset}
                                className="w-full py-4 rounded-2xl border-2 border-slate-200 font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                <RefreshCw size={13} /> Quét lại
                            </button>
                        </div>
                    )}

                    {/* DONE */}
                    {phase === 'done' && (
                        <div className="py-10 flex flex-col items-center gap-5">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                                <CheckCircle2 size={40} className="text-emerald-600" />
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-black text-slate-900">Check-in thành công!</p>
                                <p className="text-slate-500 text-sm mt-1">{appointment?.patientName}</p>
                                {appointment?.queueNumber && (
                                    <div className="mt-4 inline-flex items-center gap-3 bg-emerald-600 text-white px-7 py-3 rounded-2xl shadow-lg shadow-emerald-200">
                                        <span className="text-xs font-black uppercase tracking-widest opacity-80">STT</span>
                                        <span className="text-4xl font-black tabular-nums">#{appointment.queueNumber}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 w-full mt-2">
                                <button onClick={reset}
                                    className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2">
                                    <RefreshCw size={13} /> Quét tiếp
                                </button>
                                <button onClick={onClose}
                                    className="flex-1 py-4 rounded-2xl border-2 border-slate-200 font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">
                                    Đóng
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ERROR */}
                    {phase === 'error' && (
                        <div className="py-10 flex flex-col items-center gap-5">
                            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center">
                                <AlertCircle size={40} className="text-rose-500" />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-black text-slate-900">Có lỗi xảy ra</p>
                                <p className="text-slate-500 text-sm mt-2 leading-relaxed max-w-xs">{errorMsg}</p>
                            </div>
                            <div className="flex gap-3 w-full">
                                <button onClick={reset}
                                    className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2">
                                    <RefreshCw size={13} /> Thử lại
                                </button>
                                <button onClick={onClose}
                                    className="flex-1 py-4 rounded-2xl border-2 border-slate-200 font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">
                                    Đóng
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon, iconBg, label, main, sub, subColor = 'text-slate-500' }) {
    return (
        <div className="flex items-center gap-4 p-5">
            <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{label}</p>
                <p className="font-black text-slate-900 mt-0.5 text-sm truncate">{main}</p>
                {sub && <p className={`text-xs font-semibold mt-0.5 ${subColor}`}>{sub}</p>}
            </div>
        </div>
    );
}
