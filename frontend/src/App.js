import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';

import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import SimpleMenu from './components/SimpleMenu'; // Menú móvil mejorado
// Importa SidebarDebug para depuración - descomenta para usar
// import SidebarDebug from './components/Layout/SidebarDebug';
import Footer from './components/Layout/Footer';
import Login from './components/Login';
import HomePage from './pages/HomePage'; // Importar HomePage
import HeaderPublico from './components/Layout/HeaderPublico'; // <--- Importar HeaderPublico

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

// Componente para rutas protegidas
const ProtectedRoute = ({ user, redirectPath = '/login', isLoggingOut }) => {
  console.log(
    'ProtectedRoute evaluated. User isPresent:', !!user, 
    'isLoggingOut:', isLoggingOut,
    'Path intended for redirect if no user:', redirectPath
  );

  if (isLoggingOut) {
    console.log('[ProtectedRoute] Currently logging out. Suppressing redirect to login.');
    return null; // O un <></> o un loader pequeño si la transición es perceptible
  }

  if (!user) {
    console.log('[ProtectedRoute] User is null or undefined AND not logging out. Redirecting to:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }
  return <Outlet />;
};

// Componente para rutas públicas que pueden tener un layout diferente
const PublicLayout = ({ children }) => {
  return (
    <>
      <HeaderPublico /> {/* <--- Añadir HeaderPublico aquí */}
      {children}
      {/* El Footer ya está fuera, en MainAppLayout o global, así que no se necesita aquí si HomePage lo incluye */}
    </>
  );
};

// Componente para el layout principal de la aplicación (cuando el usuario está logueado)
const MainAppLayout = ({ user, handleLogout, sidebarOpen, setSidebarOpen, toggleSidebar, children, isLoggingOut }) => {
  if (!user) return null; // No renderizar si no hay usuario (ya que ProtectedRoute maneja la redirección)

  return (
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
          {children} 
        </main>
      </div>
      <Footer />
    </div>
  );
};

// --- Componente AppContent --- 
// Este componente contendrá la lógica principal de la aplicación y usará useNavigate
const AppContent = () => {
  const navigate = useNavigate(); // Hook para navegación programática

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // Nuevo estado

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
    setIsLoggingOut(true); // 1. Marcar que estamos haciendo logout
    setUser(null);         // 2. Limpiar usuario
    setToken(null);        // 3. Limpiar token
    navigate('/', { replace: true }); // 4. Navegar a HomePage
    // Opcional: resetear isLoggingOut después de un pequeño delay o en un efecto de navegación
    // setTimeout(() => setIsLoggingOut(false), 50); // Ejemplo de reseteo simple
  }, [navigate]);

  const handleLogin = useCallback((userData) => {
    setIsLoggingOut(false); // Asegurarse de que no estemos en estado de logout al loguear
    setUser(userData);
    setToken(userData.token);
  }, []);
  
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // Efecto para sincronizar el estado del sidebar con las clases CSS
  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('sidebar-open');
      document.documentElement.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
      document.documentElement.classList.remove('sidebar-open');
    }
    // No se necesita limpieza específica aquí si se maneja al desmontar AppContent o App
  }, [sidebarOpen]);

  // Efecto para limpiar las clases del body al desmontar App (si AppContent es el componente principal)
  useEffect(() => {
    return () => {
      document.body.classList.remove('sidebar-open');
      document.documentElement.classList.remove('sidebar-open');
    };
  }, []);
  
  // El resto de los useEffects (isMobileDevice, scrollY) se pueden mantener si son necesarios
  // Para simplificar, los omito aquí, pero deberían estar si antes estaban en App.
  // Detección de dispositivo móvil (ejemplo)
  /*
  const isMobile = () => window.innerWidth <= 900;
  const [isMobileDevice, setIsMobileDevice] = useState(isMobile());
  useEffect(() => {
    const handleResize = () => setIsMobileDevice(isMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  */

  return (
    <Routes>
      <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />} 
      />
      <Route element={<ProtectedRoute user={user} isLoggingOut={isLoggingOut} />}>
        <Route 
          path="/dashboard" 
          element={
            <MainAppLayout user={user} handleLogout={handleLogout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} toggleSidebar={toggleSidebar}>
              <Dashboard user={user} />
            </MainAppLayout>
          }
        />
        <Route 
          path="/pagos" 
          element={
            <MainAppLayout user={user} handleLogout={handleLogout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} toggleSidebar={toggleSidebar}>
              <PagosPage user={user} />
            </MainAppLayout>
          }
        />
        <Route 
          path="/gastos" 
          element={
            <MainAppLayout user={user} handleLogout={handleLogout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} toggleSidebar={toggleSidebar}>
              <GastosPage user={user} />
            </MainAppLayout>
          }
        />
        <Route 
          path="/documentos" 
          element={
            <MainAppLayout user={user} handleLogout={handleLogout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} toggleSidebar={toggleSidebar}>
              <DocumentosPage user={user} />
            </MainAppLayout>
          }
        />
        <Route 
          path="/fechas" 
          element={
            <MainAppLayout user={user} handleLogout={handleLogout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} toggleSidebar={toggleSidebar}>
              <FechasPage user={user} />
            </MainAppLayout>
          }
        />
        <Route 
          path="/historial" 
          element={
            <MainAppLayout user={user} handleLogout={handleLogout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} toggleSidebar={toggleSidebar}>
              <HistorialPage user={user} />
            </MainAppLayout>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} />} />
    </Routes>
  );
};

// --- Componente App (Principal) --- 
// Ahora solo configura el Router y el ToastProvider, y renderiza AppContent.
function App() {
  return (
    <ToastProvider>
      <Router>
        <AppContent />
      </Router>
    </ToastProvider>
  );
}

export default App;