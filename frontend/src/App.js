import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import SimpleMenu from './components/SimpleMenu'; // Menú móvil mejorado
// Importa SidebarDebug para depuración - descomenta para usar
// import SidebarDebug from './components/Layout/SidebarDebug';
import Footer from './components/Layout/Footer';
import Login from './components/Login';

import Dashboard from './pages/Dashboard';
import PagosPage from './pages/PagosPage';
import GastosPage from './pages/GastosPage';
import DocumentosPage from './pages/DocumentosPage';
import FechasPage from './pages/FechasPage';
import HistorialPage from './pages/HistorialPage';
import { ToastProvider } from './components/Layout/ToastProvider';

// Importaciones de estilos
import './App.css';
import './components/FormStyles.css';
import './components/TableStyles.css';
import './components/CardStyles.css';
import './pages/PageStabilizer.css'; // Importar estabilizador de páginas
import './components/Layout/LayoutAdjustments.css'; // Importar ajustes de layout
import './pages/PageNormalizer.css'; // Importar normalizador de páginas
import './pages/PageCommon.css'; // Importar estilos comunes para páginas
import './components/CommonStyles.css'; // Importar estilos comunes para botones y formularios
import './components/Layout/CommonStyles.css'; // Importar estilos modernos mejorados
// Eliminar importaciones de optimización móvil que pueden estar causando problemas
// import './MobileOptimization.css'; // Importar optimizaciones para móviles
// import './components/MobileCardFix.css'; // Importar ajustes para tarjetas en móviles
// import './components/MobileFormFix.css'; // Importar optimizaciones para formularios en móviles
// import './components/MobilePagesOptimization.css'; // Importar optimizaciones específicas para cada página
// import './components/MobilePerformanceFix.css'; // Importar optimizaciones de rendimiento en móviles

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

  // Estado del sidebar para desktop
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Detección de dispositivo móvil
  const isMobile = () => window.innerWidth <= 900;
  const [isMobileDevice, setIsMobileDevice] = useState(isMobile());

  // Efecto para detectar cambios de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobileDevice(isMobile());
    };
    
    // Configuración inicial
    handleResize();
    
    // Listener para cambios de tamaño
    window.addEventListener('resize', handleResize);
    
    // Limpiar al desmontar
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Función para alternar el estado del sidebar
  const toggleSidebar = () => {
    console.log("Botón hamburguesa clickeado - toggle sidebar");
    const newState = !sidebarOpen;
    
    // Actualizar las clases CSS directamente
    if (newState) {
      document.body.classList.add('sidebar-open');
      document.documentElement.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
      document.documentElement.classList.remove('sidebar-open');
    }
    
    // Actualizar el estado del sidebar
    setSidebarOpen(newState);
  };

  // Efecto para sincronizar el estado del sidebar con las clases CSS
  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('sidebar-open');
      document.documentElement.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
      document.documentElement.classList.remove('sidebar-open');
    }
  }, [sidebarOpen]);

  // Efecto para limpiar las clases del body al desmontar
  useEffect(() => {
    return () => {
      document.body.classList.remove('sidebar-open');
      document.documentElement.classList.remove('sidebar-open');
    };
  }, []);

  // Efecto para estabilizar el desplazamiento vertical
  useEffect(() => {
    // Guardar la posición de desplazamiento original
    const originalScrollY = window.scrollY;
    
    // Función para prevenir cambios de tamaño que causen movimiento
    const preventScrollJumps = () => {
      if (Math.abs(window.scrollY - originalScrollY) < 5) {
        window.scrollTo(0, originalScrollY);
      }
    };
    
    // Manejar cambios de tamaño de ventana
    window.addEventListener('resize', preventScrollJumps);
    
    // Limpiar el evento al desmontar
    return () => {
      window.removeEventListener('resize', preventScrollJumps);
    };
  }, []);

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <ToastProvider>
      <Router>
        <div className={sidebarOpen ? 'app-wrapper sidebar-open' : 'app-wrapper'}>
          <Header 
            onHamburgerClick={toggleSidebar} 
            user={user}
            onLogout={handleLogout}
          />
          
          {/* Menú móvil simplificado - solo visible en móvil gracias a sus estilos internos */}
          <SimpleMenu user={user} />
          
          <div className="app-container">
            {/* Sidebar con soporte para escritorio */}
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
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;