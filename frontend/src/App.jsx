import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Mockups from './pages/Mockups.jsx';
import UploadMockup from './pages/UploadMockup.jsx';
import Orders from './pages/Orders.jsx';
import Profile from './pages/Profile.jsx';
import AppShell from './components/AppShell.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

const App = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Authenticated */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mockups" element={<Mockups />} />
        <Route
          path="/mockups/new"
          element={
            <ProtectedRoute roles={['designer']}>
              <UploadMockup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mockups/:id/edit"
          element={
            <ProtectedRoute roles={['designer']}>
              <UploadMockup />
            </ProtectedRoute>
          }
        />
        <Route path="/orders" element={<Orders />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
