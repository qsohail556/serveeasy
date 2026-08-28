import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import CustomerMenu from './pages/customer/CustomerMenu.jsx';
import StaffDashboard from './pages/staff/StaffDashboard.jsx';
import StaffLogin from './pages/staff/StaffLogin.jsx';
import AdminMenuManager from './pages/admin/AdminMenuManager.jsx';
import { CartProvider } from './context/CartContext.jsx';

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<HomePage />} />

        {/* Customer-facing — public, no auth, table id from URL */}
        <Route
          path="/m/:hotelSlug/:tableId"
          element={
            <CartProvider>
              <CustomerMenu />
            </CartProvider>
          }
        />

        {/* Staff */}
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="/staff" element={<StaffDashboard />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminMenuManager />} />

        {/* Catch-all for any unmatched path */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}