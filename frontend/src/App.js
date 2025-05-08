import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Footer from './components/Layout/Footer';
import Login from './components/Login';

import Dashboard from './pages/Dashboard';
import PagosPage from './pages/PagosPage';
import GastosPage from './pages/GastosPage';
import DocumentosPage from './pages/DocumentosPage';
import FechasPage from './pages/FechasPage';
import HistorialPage from './pages/HistorialPage';
import { ToastProvider } from './components/Layout/ToastProvider';

function App() {
  // Persistencia de sesión con localStorage
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

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

  // Función para cerrar sesión
  const handleLogout = () => {
    setUser(null);
    setToken(null);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setToken(userData.token);
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <ToastProvider>
      <Router>
        <Header 
          onHamburgerClick={() => setSidebarOpen(!sidebarOpen)} 
          user={user}
          onLogout={handleLogout}
        />
        <div className="app-container">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} user={user} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/pagos" element={<PagosPage user={user} />} />
              <Route path="/gastos" element={<GastosPage user={user} />} />
              <Route path="/documentos" element={<DocumentosPage user={user} />} />
              <Route path="/fechas" element={<FechasPage user={user} />} />
              <Route path="/historial" element={<HistorialPage user={user} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
        <Footer />
      </Router>
    </ToastProvider>
  );
}

export default App;