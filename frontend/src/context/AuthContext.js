import React, { createContext, useContext, useState, useEffect } from 'react';
import { setAuthToken } from '../api/client';

// ---------------------------------------------------------------------------
// 1. Create the context
// ---------------------------------------------------------------------------
const AuthContext = createContext(null);

// ---------------------------------------------------------------------------
// 2. Provider component
// ---------------------------------------------------------------------------
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `loading` starts as true so consumers can gate rendering until we've
  // finished reading from localStorage (prevents auth-state flicker on mount).
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------------------------
  // On initial mount: hydrate auth state from localStorage
  // -------------------------------------------------------------------------
  useEffect(() => {
    try {
      const stored = localStorage.getItem('farmtrust_user');
      const token = localStorage.getItem('token');
      if (token) {
        setAuthToken(token);
      }
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (error) {
      // Corrupt / unparseable data – clear it to avoid a stuck loading state.
      console.error('[AuthContext] Failed to parse stored user data:', error);
      localStorage.removeItem('farmtrust_user');
      localStorage.removeItem('token');
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  }, []); // empty deps → runs once after first render

  // -------------------------------------------------------------------------
  // login(userData) – persist user to state and localStorage
  // -------------------------------------------------------------------------
  const login = (userData) => {
    try {
      localStorage.setItem('farmtrust_user', JSON.stringify(userData));
    } catch (error) {
      console.error('[AuthContext] Failed to persist user data:', error);
    }
    setUser(userData);
  };

  // -------------------------------------------------------------------------
  // logout() – clear user from state and localStorage
  // -------------------------------------------------------------------------
  const logout = () => {
    localStorage.removeItem('farmtrust_user');
    localStorage.removeItem('token');
    setAuthToken(null);
    setUser(null);
  };

  // -------------------------------------------------------------------------
  // Context value
  // -------------------------------------------------------------------------
  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: Boolean(user),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// 3. Custom hook – the recommended way to consume this context
// ---------------------------------------------------------------------------
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
};

export default AuthContext;
