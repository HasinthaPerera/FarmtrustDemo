import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import FarmerDashboard from './pages/FarmerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import AdminPanel from './pages/AdminPanel';
import AIPredictions from './pages/AIPredictions';
import Navbar from './components/Navbar';
import ThemeToggle from './components/ThemeToggle';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div key={location.pathname} className="page-transition">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/farmer" element={<FarmerDashboard />} />
        <Route path="/buyer" element={<BuyerDashboard />} />
        <Route path="/ai-predictions" element={<AIPredictions />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:bg-slate-900 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <Navbar />
        <AnimatedRoutes />
        <ThemeToggle />
      </div>
    </Router>
  );
}

export default App;