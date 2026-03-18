import api from '../services/api.jsx';

export const isLoggedIn = () => !!localStorage.getItem('token');

export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('user-updated'));
};

export const publicAPI = {
    getCenters: () => api.get('/hospitals'),
    getHospitalById: (id) => api.get(`/hospitals/${id}`),
    getSpecialties: () => api.get('/specialties'),
    // use the search endpoint so server-side filtering (q, specialtyId, hospitalId) works
    getDoctors: (params) => api.get('/doctors/search', { params }),
    getDoctorById: (id) => api.get(`/doctors/${id}`),
    getDoctorsByHospital: (id) => api.get(`/doctors/hospital/${id}`),
    getDoctorsBySpecialty: (id) => api.get(`/doctors/specialty/${id}`),
    getSlots: (doctorId, date) => api.get(`/slots/doctor/${doctorId}?date=${date}`),
    lockSlot: (scheduleId, userId) => api.post(`/slots/lock/${scheduleId}?userId=${userId}`),
    unlockSlotsForUser: (userId) => api.post(`/slots/unlock/user/${userId}`),
    askAssistant: (data) => api.post('/assistant/ask', data),
};

export const userAPI = {
    getMyBookings: () => api.get('/user/appointments'),
    createAppointment: (data) => api.post('/appointments', data),
    cancelAppointment: (id) => api.post(`/appointments/${id}/cancel`),
    getMyNotifications: () => api.get('/notifications'),
    markNotificationRead: (id) => api.patch(`/notifications/${id}/read`),
    getProfile: () => api.get('/user/profile'),
    updateProfile: (data) => api.put('/user/profile', data),
    // Payments (VNPAY)
    createVnPayPayment: (appointmentId, amount) => api.post('/payments/vnpay/create', { appointmentId, amount }),
    // Payments (MOMO)
    createMomoPayment: (appointmentId, amount) => api.post('/payments/momo/create', { appointmentId, amount }),
    getPaymentStatus: (txRef) => api.get(`/payments/${txRef}/status`),
};

export const adminAPI = {
    getStats: () => api.get('/hospitals/statistics'),
    createHospital: (data) => api.post('/hospitals', data),
    updateHospital: (id, data) => api.put(`/hospitals/${id}`, data),
    deleteHospital: (id) => api.delete(`/hospitals/${id}`),
    createDoctor: (data) => api.post('/doctors', data),
    updateDoctor: (id, data) => api.put(`/doctors/${id}`, data),
    deleteDoctor: (id) => api.delete(`/doctors/${id}`),
    uploadFile: (formData) => api.post('/uploads', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    createSpecialty: (data) => api.post('/specialties', data),
    updateSpecialty: (id, data) => api.put(`/specialties/${id}`, data),
    deleteSpecialty: (id) => api.delete(`/specialties/${id}`),
    // Staff Management
    getAllStaff: () => api.get('/staff'),
    createStaff: (data) => api.post('/staff', data),
    updateStaff: (id, data) => api.put(`/staff/${id}`, data),
    deleteStaff: (id) => api.delete(`/staff/${id}`),
    // User Management
    getUsers: () => api.get('/admin/users'),
    createUser: (data) => api.post('/admin/users', data),
    updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
    lockUser: (id, active) => api.patch(`/admin/users/${id}/lock?active=${active}`),
    deleteUser: (id, hard = false) => api.delete(`/admin/users/${id}?hard=${hard}`),
};



export const doctorAPI = {
    getMe: () => api.get('/doctors/me'),
    getAppointments: (doctorId) => api.get(`/appointments/doctor/${doctorId}`),
    updateAppointmentStatus: (id, status) => api.patch(`/appointments/${id}/status?status=${status}`),
    createMedicalRecord: (data) => api.post('/medical-records', data),
    getRecordsByDoctor: (doctorId) => api.get(`/medical-records/doctor/${doctorId}`),
    getSchedules: (doctorId) => api.get(`/schedules/doctor/${doctorId}`),
    createSchedule: (data) => api.post('/schedules', data),
    updateSchedule: (id, data) => api.put(`/schedules/${id}`, data),
    deleteSchedule: (id) => api.delete(`/schedules/${id}`),
    createNotification: (userId, message) => api.post(`/notifications/user/${userId}`, message),
};

export const staffAPI = {
    getAllAppointments: () => api.get('/appointments'),
    getAppointmentByCode: (code) => api.get(`/appointments/code/${encodeURIComponent(code)}`),
    updateAppointmentStatus: (id, status) => api.patch(`/appointments/${id}/status?status=${status}`),
    assignRoom: (id, roomName) => api.patch(`/appointments/${id}/assign-room?roomName=${roomName}`),
    checkIn: (id) => api.patch(`/appointments/${id}/check-in`),
    confirmPayment: (id) => api.patch(`/appointments/${id}/confirm-payment`),
    getDoctors: () => api.get('/doctors'),
    getStaffHospital: () => api.get('/hospitals/staff/me'),
    getSchedules: (doctorId) => api.get(`/schedules/doctor/${doctorId}`),
    createWalkIn: (data) => api.post('/appointments/walk-in', data),
    updateDoctorRoom: (id, room) => api.patch(`/doctors/${id}/room?room=${room}`),
};

export const medicalRecordAPI = {
    getRecordsByUser: (userId) => api.get(`/medical-records/user/${userId}`),
};

// Mock realtime for now as we don't have websocket setup yet
export const realtime = {
    on: () => {},
    off: () => {},
    send: () => {},
};
