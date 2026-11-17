import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import { Spinner } from './components/ui.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Courses from './pages/Courses.jsx';
import CourseDetail from './pages/CourseDetail.jsx';
import Attendance from './pages/Attendance.jsx';
import Gpa from './pages/Gpa.jsx';

function Protected({ children }) {
  const { student, loading } = useAuth();
  if (loading) return <Spinner />;
  return student ? children : <Navigate to="/login" replace />;
}
function GuestOnly({ children }) {
  const { student, loading } = useAuth();
  if (loading) return <Spinner />;
  return student ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:id" element={<CourseDetail />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="gpa" element={<Gpa />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
