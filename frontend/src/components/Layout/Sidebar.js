import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
/* import './SidebarReset.css'; */ /* ELIMINADO - Causa conflictos con !important */
/* import styles from './Sidebar.module.css'; */ /* ELIMINADO */
import { Home, Wallet, FileText, FileStack, Calendar, History, LogOut } from 'lucide-react';

// Items de navegación
const menuItems = [
  { nombre: 'Dashboard', ruta: '/', icono: <Home size={22} /> },
  { nombre: 'Pagos', ruta: '/pagos', icono: <Wallet size={22} /> },
  { nombre: 'Gastos', ruta: '/gastos', icono: <FileStack size={22} /> },
  { nombre: 'Documentos', ruta: '/documentos', icono: <FileText size={22} /> },
  { nombre: 'Calendario', ruta: '/fechas', icono: <Calendar size={22} /> },
];

// Función para detectar si estamos en un dispositivo móvil
const isMobileDevice = () => window.innerWidth <= 900;

export default function Sidebar({ open, setOpen, user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(isMobileDevice());
  const sidebarRef = useRef(null);
  
  // Referencia al backdrop
  const backdropRef = useRef(null);
  
  // Manejar cierre de sesión
  const handleLogout = useCallback((e) => {
    e.preventDefault();
    window.localStorage.clear();
    navigate('/');
    window.location.reload();
  }, [navigate]);
  
  // Cerrar el sidebar si se hace clic en el overlay (solo en desktop)
  const handleOverlayClick = useCallback((e) => {
    console.log('Overlay clickeado');
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
  }, [setOpen]);
  
  // Actualizar estado de dispositivo móvil
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // No renderizar en dispositivos móviles
  if (isMobile) {
    return null;
  }
  
  // Filtrar elementos de menú según el rol del usuario
  const filteredItems = [
    ...menuItems,
    (user.rol_id === 1 || user.rol_id === 2 || user.rol_id === 3) && {
      nombre: 'Historial',
      ruta: '/historial',
      icono: <History size={22} />,
    },
  ].filter(Boolean);
  
  return (
    <>
      {/* Backdrop para cuando el sidebar está abierto */}
      <div 
        ref={backdropRef} 
        className={`sidebar-backdrop ${open && !isMobile ? 'open' : ''}`}
        onClick={handleOverlayClick}
        /* style={{ display: 'none' }} */ /* ELIMINADO */
      />
      
      {/* Sidebar para desktop */}
      <aside 
        ref={sidebarRef}
        className={`sidebar-modern ${!open && !isMobile ? 'sidebar-closed-placeholder' : ''}`}
      >
        <nav className="sidebar-nav">
          <ul className="sidebar-list" style={{gap: '12px'}}>
            {filteredItems.map((item) => (
              <li key={item.ruta} className="sidebar-item">
                <Link
                  to={item.ruta}
                  className={`sidebar-link ${
                    location.pathname === item.ruta ? ' active' : ''
                  }`}
                >
                  <span className="sidebar-icon">{item.icono}</span>
                  <span className="sidebarText">{item.nombre}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}