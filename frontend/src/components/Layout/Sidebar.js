import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import './SidebarReset.css';
import styles from './Sidebar.module.css';
import { FaChartLine, FaMoneyBillWave, FaReceipt, FaFileAlt, FaCalendarAlt, FaHistory, FaSignOutAlt } from 'react-icons/fa';

// Items de navegación
const menuItems = [
  { nombre: 'Dashboard', ruta: '/', icono: <FaChartLine size={20} /> },
  { nombre: 'Pagos', ruta: '/pagos', icono: <FaMoneyBillWave size={20} /> },
  { nombre: 'Gastos', ruta: '/gastos', icono: <FaReceipt size={20} /> },
  { nombre: 'Documentos', ruta: '/documentos', icono: <FaFileAlt size={20} /> },
  { nombre: 'Calendario', ruta: '/fechas', icono: <FaCalendarAlt size={20} /> },
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
  
  // Efecto para gestionar el backdrop
  useEffect(() => {
    if (!backdropRef.current) return;
    
    // Solo mostrar backdrop en desktop cuando el sidebar está abierto
    if (open && !isMobile) {
      backdropRef.current.style.display = 'block';
    } else {
      backdropRef.current.style.display = 'none';
    }
  }, [open, isMobile]);
  
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
      icono: <FaHistory size={20} />,
    },
  ].filter(Boolean);
  
  return (
    <>
      {/* Backdrop para cuando el sidebar está abierto */}
      <div 
        ref={backdropRef} 
        className={styles.sidebarBackdrop} 
        onClick={handleOverlayClick}
        style={{ display: 'none' }}
      />
      
      {/* Sidebar para desktop */}
      <aside 
        ref={sidebarRef}
        className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}
      >
        <nav className={styles.sidebarNav}>
          <ul className={styles.sidebarList}>
            {filteredItems.map((item) => (
              <li key={item.ruta} className={styles.sidebarItem}>
                <Link
                  to={item.ruta}
                  className={`${styles.sidebarLink} ${
                    location.pathname === item.ruta ? styles.active : ''
                  }`}
                >
                  <span className={styles.sidebarIcon}>{item.icono}</span>
                  <span className={styles.sidebarText}>{item.nombre}</span>
                </Link>
              </li>
            ))}
            
            <li className={styles.sidebarItem}>
              <a 
                href="#logout" 
                className={styles.sidebarLinkLogout}
                onClick={handleLogout}
              >
                <span className={styles.sidebarIcon}>
                  <FaSignOutAlt size={20} />
                </span>
                <span className={styles.sidebarText}>Cerrar sesión</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}