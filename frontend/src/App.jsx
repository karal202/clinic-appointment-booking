import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/User/HomePage';
import DoctorListPage from './pages/User/DoctorListPage';
import HospitalListPage from './pages/User/HospitalListPage';
import DoctorDetailPage from './pages/User/DoctorDetailPage';
import HospitalDetailPage from './pages/User/HospitalDetailPage';
import ProfilePage from './pages/User/ProfilePage';
import NotificationPage from './pages/User/NotificationPage';
import BookingConfirmPage from './pages/User/BookingConfirmPage';
import BookingSuccessPage from './pages/User/BookingSuccessPage';
import BookingPaymentFailurePage from './pages/User/BookingPaymentFailurePage';
import MyBookingPage from './pages/User/MyBookingPage';
import { Toaster } from 'react-hot-toast';
import ChatAssistant from './components/ChatAssistant';
import ProtectedRoute from './components/ProtectedRoute';


import AdminHome from './pages/Admin/AdminHome';
import AdminHospitals from './pages/Admin/AdminHospitals';
import AdminDoctors from './pages/Admin/AdminDoctors';
import AdminSpecialties from './pages/Admin/AdminSpecialties';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminStaff from './pages/Admin/AdminStaff';
import DoctorHome from './pages/Doctors/DoctorHome';
import DoctorAppointments from './pages/Doctors/DoctorAppointments';
import DoctorSchedules from './pages/Doctors/DoctorSchedules';
import CreateMedicalRecord from './pages/Doctors/CreateMedicalRecord';
import DoctorMedicalRecords from './pages/Doctors/DoctorMedicalRecords';
import StaffHome from './pages/Staff/StaffHome';
import QueueManagement from './pages/Staff/QueueManagement';
import StaffRooms from './pages/Staff/StaffRooms';

const GOOGLE_CLIENT_ID = '187989966747-f574l8chsq2lpsl0jesujtustbgipirk.apps.googleusercontent.com';

function App() {

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/doctors" element={<DoctorListPage />} />
          <Route path="/doctors/:id" element={<DoctorDetailPage />} />
          <Route path="/hospitals" element={<HospitalListPage />} />
          <Route path="/hospitals/:id" element={<HospitalDetailPage />} />



          {/* Protected Routes */}
          <Route path="/me" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute><MyBookingPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationPage /></ProtectedRoute>} />
          <Route path="/booking/confirm" element={<ProtectedRoute><BookingConfirmPage /></ProtectedRoute>} />
          <Route path="/booking/success" element={<ProtectedRoute><BookingSuccessPage /></ProtectedRoute>} />
          <Route path="/booking/failure" element={<ProtectedRoute><BookingPaymentFailurePage /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminHome /></ProtectedRoute>} />
          <Route path="/admin/hospitals" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminHospitals /></ProtectedRoute>} />
          <Route path="/admin/doctors" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDoctors /></ProtectedRoute>} />
          <Route path="/admin/specialties" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminSpecialties /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminStaff /></ProtectedRoute>} />

          {/* Doctor Routes */}
          <Route path="/doctor" element={<ProtectedRoute allowedRoles={['DOCTOR']}><DoctorHome /></ProtectedRoute>} />
          <Route path="/doctor/appointments" element={<ProtectedRoute allowedRoles={['DOCTOR']}><DoctorAppointments /></ProtectedRoute>} />
          <Route path="/doctor/schedules" element={<ProtectedRoute allowedRoles={['DOCTOR']}><DoctorSchedules /></ProtectedRoute>} />
          <Route path="/doctor/records" element={<ProtectedRoute allowedRoles={['DOCTOR']}><DoctorMedicalRecords /></ProtectedRoute>} />
          <Route path="/doctor/records/create/:appointmentId" element={<ProtectedRoute allowedRoles={['DOCTOR']}><CreateMedicalRecord /></ProtectedRoute>} />
          
          {/* Staff Routes */}
          <Route path="/staff" element={<ProtectedRoute allowedRoles={['STAFF']}><StaffHome /></ProtectedRoute>} />
          <Route path="/staff/queue" element={<ProtectedRoute allowedRoles={['STAFF']}><QueueManagement /></ProtectedRoute>} />
          <Route path="/staff/rooms" element={<ProtectedRoute allowedRoles={['STAFF']}><StaffRooms /></ProtectedRoute>} />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <ChatAssistant />
      <Toaster position="top-right" />
    </GoogleOAuthProvider>
  );
}

export default App;