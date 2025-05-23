import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';

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
import AdminUsuariosPage from './pages/AdminUsuariosPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import { ToastProvider } from './components/Layout/ToastProvider';

// Importar el nuevo hook de autenticación
import { useAuth, AuthProvider } from './hooks/useAuth';

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
  const { pathname } = useLocation(); // Obtener el pathname de la ubicación actual directamente

  // Usar el hook de autenticación
  const { user, token, isLoggingOut, handleLogin, handleLogout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

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

   // Efecto para manejar la navegación después del login/logout
   useEffect(() => {
     // Si no hay usuario Y no estamos en proceso de logout, redirigir a la página de inicio (EXCEPTO si ya estamos en /login)
     if (!user && !isLoggingOut && pathname !== '/login') {
       // Si no hay usuario Y no estamos en proceso de logout, redirigir a la página de inicio
       console.log('Redirigiendo a / (página de inicio) - No autenticado y no en /login');
       navigate('/', { replace: true });
     } else if (user && !isLoggingOut && pathname === '/login') {
        // Si hay usuario, no estamos en logout, Y estamos en la página de login, redirigir al dashboard
        navigate('/dashboard', { replace: true });
     }
     // Ahora location es una dependencia debido al uso de useLocation
   }, [user, isLoggingOut, navigate, pathname]); // Dependencias: user, isLoggingOut, navigate, pathname

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
        // Si el usuario existe, redirigir al dashboard. De lo contrario, mostrar el componente Login.
        element={user && !isLoggingOut ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />} 
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
        <Route 
          path="/admin-usuarios" 
          element={
            <MainAppLayout user={user} handleLogout={handleLogout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} toggleSidebar={toggleSidebar}>
              <AdminUsuariosPage user={user} />
            </MainAppLayout>
          }
        />
        <Route 
          path="/cambiar-clave" 
          element={
            <MainAppLayout user={user} handleLogout={handleLogout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} toggleSidebar={toggleSidebar}>
              <ChangePasswordPage user={user} />
            </MainAppLayout>
          }
        />
      </Route>
      {/* Redirigir rutas desconocidas. Si hay usuario, ir al dashboard, si no, a la página de inicio. */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
    </Routes>
  );
};

// --- Componente App (Principal) --- 
// Ahora solo configura el Router y el ToastProvider, y renderiza AppContent envuelto en AuthProvider.
function App() {
  return (
    <ToastProvider>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ToastProvider>
  );
}

export default App;