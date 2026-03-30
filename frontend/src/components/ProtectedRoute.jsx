import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = authService.getCurrentUser();

  // Chưa đăng nhập
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Nếu có truyền role được phép và user role không nằm trong mảng đó
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Chuyển hướng theo role
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'DOCTOR') return <Navigate to="/doctor" replace />;
    if (user.role === 'STAFF') return <Navigate to="/staff" replace />;
    return <Navigate to="/" replace />; // Chuyển về trang chủ cho USER/bất kỳ ai khác
  }

  return children;
};

export default ProtectedRoute;
