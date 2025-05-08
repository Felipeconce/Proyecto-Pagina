import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const menuItems = [
  { nombre: 'Dashboard', ruta: '/', icono: 'dashboard', color: '#fff', bg: 'rgba(99,102,241,0.95)' }, // blanco sobre violeta/indigo
  { nombre: 'Pagos', ruta: '/pagos', icono: 'payments', color: '#fff', bg: 'rgba(37,99,235,0.95)' }, // blanco sobre azul fuerte
  { nombre: 'Gastos', ruta: '/gastos', icono: 'trending_down', color: '#22c55e', bg: 'rgba(255,255,255,0.95)' }, // verde sobre blanco
  { nombre: 'Documentos', ruta: '/documentos', icono: 'description', color: '#fbbf24', bg: 'rgba(255,255,255,0.95)' }, // naranja sobre blanco
  { nombre: 'Calendario', ruta: '/fechas', icono: 'event', color: '#60a5fa', bg: 'rgba(255,255,255,0.95)' }, // azul claro sobre blanco
];
const logoutItem = { nombre: 'Cerrar sesión', icono: 'logout', color: '#fff', bg: 'rgba(37,99,235,0.95)' };

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  
  return isMobile;
}

export default function Sidebar({ open, setOpen, user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Manejar cierre de sesión
  const handleLogout = useCallback((e) => {
    e.preventDefault();
    window.localStorage.clear();
    navigate('/');
    window.location.reload();
  }, [navigate]);
  
  // Cerrar el sidebar móvil si se hace clic fuera del mismo
  useEffect(() => {
    // No ejecutar el efecto si no hay usuario o si no estamos en móvil o si el sidebar no está abierto
    if (!user || !isMobile || !open) return;
    
    const handleClickOutside = (e) => {
      if (!e.target.closest('.sidebar-drawer')) {
        setOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobile, open, setOpen, user]);
  
  // Cerrar sidebar al cambiar de ruta en móvil
  useEffect(() => {
    // No ejecutar el efecto si no hay usuario o si no estamos en móvil o si el sidebar no está abierto
    if (!user || !isMobile || !open) return;
    
    setOpen(false);
  }, [location.pathname, isMobile, open, setOpen, user]);

  // Si no hay usuario, no renderizar nada
  if (!user) return null;

  const filteredMenuItems = [
    ...menuItems,
    (user.rol_id === 1 || user.rol_id === 2 || user.rol_id === 3) && {
      nombre: 'Historial',
      ruta: '/historial',
      icono: 'history',
      color: '#6b7280',
      bg: 'rgba(255,255,255,0.95)',
    },
  ].filter(Boolean);

  if (isMobile) {
    // Drawer para móvil
    return (
      <nav 
        className={`sidebar-drawer${open ? ' open' : ''}`} 
        style={open ? { position: 'fixed', zIndex: 2000 } : {}}
        onClick={(e) => e.stopPropagation()}
      >
        <ul className="sidebar-drawer-list">
          {filteredMenuItems.map(item => (
            <li key={item.ruta}>
              <Link
                to={item.ruta}
                className={`sidebar-drawer-link${location.pathname === item.ruta ? ' active' : ''}`}
              >
                <span className="material-icons sidebar-icon-material" style={{ color: item.color, background: item.bg }}>{item.icono}</span>
                {item.nombre}
              </Link>
            </li>
          ))}
          <li style={{ marginTop: '2rem' }}>
            <a href="#logout" className="sidebar-drawer-link" onClick={handleLogout}>
              <span className="material-icons sidebar-icon-material" style={{ color: logoutItem.color, background: logoutItem.bg }}>{logoutItem.icono}</span>
              {logoutItem.nombre}
            </a>
          </li>
        </ul>
      </nav>
    );
  }

  // Sidebar clásica para desktop
  return (
    <aside className="sidebar-modern">
      <nav>
        <ul className="sidebar-list">
          {filteredMenuItems.map(item => (
            <li key={item.ruta}>
              <Link
                to={item.ruta}
                className={`sidebar-link${location.pathname === item.ruta ? ' active' : ''}`}
              >
                <span className="material-icons sidebar-icon-material" style={{ color: item.color, background: item.bg }}>{item.icono}</span>
                {item.nombre}
              </Link>
            </li>
          ))}
          <li style={{ marginTop: '2rem' }}>
            <a href="#logout" className="sidebar-link" onClick={handleLogout}>
              <span className="material-icons sidebar-icon-material" style={{ color: logoutItem.color, background: logoutItem.bg }}>{logoutItem.icono}</span>
              {logoutItem.nombre}
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}