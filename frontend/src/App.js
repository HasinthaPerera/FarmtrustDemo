import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Auth from './pages/Auth';
import FarmerDashboard from './pages/FarmerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import AdminPanel from './pages/AdminPanel';
import AIPredictions from './pages/AIPredictions';
import Navbar from './components/Navbar';
import ThemeToggle from './components/ThemeToggle';
import ProtectedRoute from './components/ProtectedRoute';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div key={location.pathname} className="page-transition">
      <Routes>
        {/* ── Public routes ── */}
        <Route path="/" element={<Home />} />
        {/* Canonical auth entry point — covers login + register */}
        <Route path="/auth" element={<Auth />} />
        {/* Legacy redirects — keep old URLs working */}
        <Route path="/login"    element={<Navigate to="/auth" replace />} />
        <Route path="/register" element={<Navigate to="/auth" replace />} />

        {/* ── Protected: Farmers & Admins only ── */}
        <Route
          path="/farmer"
          element={
            <ProtectedRoute allowedRoles={['farmer', 'admin']}>
              <FarmerDashboard />
            </ProtectedRoute>
          }
        />

        {/* ── Protected: Buyers & Admins only ── */}
        <Route
          path="/buyer"
          element={
            <ProtectedRoute allowedRoles={['buyer', 'admin']}>
              <BuyerDashboard />
            </ProtectedRoute>
          }
        />

        {/* ── Protected: Buyers & Admins only (AI Predictions) ── */}
        <Route
          path="/ai-predictions"
          element={
            <ProtectedRoute allowedRoles={['buyer', 'farmer', 'admin']}>
              <AIPredictions />
            </ProtectedRoute>
          }
        />

        {/* ── Protected: Admins only ── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:bg-slate-900 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
            <Navbar />
            <AnimatedRoutes />
            <ThemeToggle />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;