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

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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
          <Route path="/me" element={<ProfilePage />} />
          <Route path="/my-bookings" element={<MyBookingPage />} />
          <Route path="/notifications" element={<NotificationPage />} />
          <Route path="/booking/confirm" element={<BookingConfirmPage />} />
          <Route path="/booking/success" element={<BookingSuccessPage />} />
          <Route path="/booking/failure" element={<BookingPaymentFailurePage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/hospitals" element={<AdminHospitals />} />
          <Route path="/admin/doctors" element={<AdminDoctors />} />
          <Route path="/admin/specialties" element={<AdminSpecialties />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/staff" element={<AdminStaff />} />

          {/* Doctor Routes */}
          <Route path="/doctor" element={<DoctorHome />} />
          <Route path="/doctor/appointments" element={<DoctorAppointments />} />
          <Route path="/doctor/schedules" element={<DoctorSchedules />} />
          <Route path="/doctor/records" element={<DoctorMedicalRecords />} />
          <Route path="/doctor/records/create/:appointmentId" element={<CreateMedicalRecord />} />
          
          {/* Staff Routes */}
          <Route path="/staff" element={<StaffHome />} />
          <Route path="/staff/queue" element={<QueueManagement />} />
          <Route path="/staff/rooms" element={<StaffRooms />} />

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