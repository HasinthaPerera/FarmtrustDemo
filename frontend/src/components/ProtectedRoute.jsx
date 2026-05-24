import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 *
 * A route-level guard component that enforces authentication and role-based
 * access control (RBAC) before rendering protected page content.
 *
 * Usage:
 *   <Route
 *     path="/farmer"
 *     element={
 *       <ProtectedRoute allowedRoles={['farmer', 'admin']}>
 *         <FarmerDashboard />
 *       </ProtectedRoute>
 *     }
 *   />
 *
 * @param {React.ReactNode} children     - The protected page component to render.
 * @param {string[]}        allowedRoles - Roles permitted to access this route.
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  // ── Step 1: WAIT ──────────────────────────────────────────────────────────
  // AuthContext is still hydrating from localStorage. Returning null (or a
  // spinner) prevents a premature redirect before we know the user's identity.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          {/* Animated spinner */}
          <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin dark:border-slate-700 dark:border-t-primary-400" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wide">
            Verifying access…
          </p>
        </div>
      </div>
    );
  }

  // ── Step 2: AUTHENTICATE ──────────────────────────────────────────────────
  // No authenticated user → send to the unified /auth page. Using replace so
  // the protected route is not pushed onto the history stack (Back button skips it).
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // ── Step 3: AUTHORIZE ────────────────────────────────────────────────────
  // User is authenticated but their role is not in the allowedRoles list.
  // Redirect to home rather than /login to avoid an odd UX loop.
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // ── Step 4: PASS ─────────────────────────────────────────────────────────
  // All checks passed – render the requested page.
  return children;
};

export default ProtectedRoute;
