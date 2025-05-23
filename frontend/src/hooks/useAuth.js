import { createContext, useContext } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const handleLogout = useCallback(() => {
    setIsLoggingOut(true);
    setUser(null);
    setToken(null);
    // No navegar aquí. La navegación se manejará en AppContent después de que el estado de usuario cambie.
    // navigate('/', { replace: true });
  }, []);

  const handleLogin = useCallback((userData) => {
    setIsLoggingOut(false);
    setUser(userData);
    setToken(userData.token);
    // No navegar aquí. La navegación se manejará en AppContent después de que el estado de usuario cambie.
    // navigate('/dashboard', { replace: true });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoggingOut, handleLogin, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}; 