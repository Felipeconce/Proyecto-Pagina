import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Wallet, FileStack, FileText, Calendar, History, LogOut } from 'lucide-react';
import { HiMenu, HiX } from 'react-icons/hi';

// Función para detectar si estamos en un dispositivo móvil con más precisión
const isMobile = () => {
  // Verificar ancho de ventana (método principal)
  const isMobileWidth = window.innerWidth <= 900;
  return isMobileWidth;
};

// Estilos inline para garantizar que no haya conflictos CSS
const styles = {
  container: {
    position: 'fixed',
    top: '15px',
    left: '15px',
    zIndex: 10000, // Mayor que cualquier otro elemento
    display: 'none', // Oculto por defecto, se mostrará solo en móvil vía JS
    flexDirection: 'column',
    alignItems: 'flex-start'
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    backgroundColor: '#14b8a6 !important', // Forzar Teal con !important
    color: 'white',
    border: 'none',
    borderRadius: 'var(--border-radius-sm)',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    zIndex: 10001,
    fontSize: '24px'
  },
  buttonIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    color: 'white',
    fill: 'currentColor'
  },
  menu: {
    position: 'fixed',
    top: '0',
    left: 0,
    width: '250px',
    height: '100vh',
    backgroundColor: 'var(--color-bg)',
    boxShadow: 'var(--shadow-lg)',
    overflow: 'auto',
    zIndex: 9999,
    paddingTop: '60px',
    boxSizing: 'border-box'
  },
  menuList: {
    listStyle: 'none',
    margin: 0,
    padding: '1rem 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1.5rem',
    color: 'var(--color-text-secondary)',
    textDecoration: 'none',
    transition: 'background-color 0.2s, color 0.2s',
    fontSize: '1rem',
    fontWeight: 500,
    borderRadius: 'var(--border-radius-md)',
    margin: '0 1rem'
  },
  menuItemHover: {
    backgroundColor: 'var(--color-bg-hover)',
    color: 'var(--color-text)',
  },
  menuItemActive: {
    backgroundColor: 'var(--color-primary)',
    color: '#fff',
    fontWeight: 600
  },
  icon: {
    marginRight: '1rem',
    color: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22px',
    height: '22px',
    flexShrink: 0
  },
  menuItemText: {
    display: 'inline-block'
  },
  logoutItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1.5rem',
    color: '#ef4444',
    textDecoration: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 500,
    marginTop: 'auto',
    marginBottom: '1rem',
    borderRadius: 'var(--border-radius-md)',
    margin: '0 1rem'
  },
  logoutIcon: {
    marginRight: '1rem',
    color: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22px',
    height: '22px',
    flexShrink: 0
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 9998
  }
};

// Componente simple de menú móvil
function SimpleMenu({ user }) {
  // --- INICIO DE CONSOLE LOGS PARA DEBUG ---
  console.log('[SimpleMenu] Props user:', user);
  const locationForLog = useLocation(); // Necesitas instanciar useLocation aquí si lo usas antes de los otros hooks
  console.log('[SimpleMenu] Current location.pathname:', locationForLog.pathname);
  // --- FIN DE CONSOLE LOGS PARA DEBUG ---

  // Hooks: useState, useLocation, useNavigate, useRef
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(isMobile());
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  
  // Hooks: useEffect
  useEffect(() => {
    const handleResize = () => {
      const mobile = isMobile();
      setIsMobileDevice(prevIsMobile => prevIsMobile !== mobile ? mobile : prevIsMobile);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (menuRef.current) {
      if (isMobileDevice) {
        menuRef.current.style.display = 'flex';
        console.log('[SimpleMenu] useEffect (displayLogic): isMobileDevice=true. Mostrando botón. Estilo actual:', menuRef.current.style.display, 'window.innerWidth:', window.innerWidth);
      } else {
        menuRef.current.style.display = 'none';
        console.log('[SimpleMenu] useEffect (displayLogic): isMobileDevice=false. Ocultando botón. Estilo actual:', menuRef.current.style.display, 'window.innerWidth:', window.innerWidth);
        if (menuOpen) {
          setMenuOpen(false);
        }
      }
    }
  }, [isMobileDevice, menuOpen]);

  useEffect(() => {
    if (menuOpen && isMobileDevice) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen, isMobileDevice]);
  
  useEffect(() => {
    // Solo cerrar el menú si la RUTA cambia y el menú ESTABA ABIERTO.
    // No reaccionar a los cambios de menuOpen en sí mismos.
    if (menuOpen) { // Checkear el estado actual
        setMenuOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [location.pathname]); // Depender SOLO de location.pathname
  
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27 && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [menuOpen]);

  // Early return: AFTER all hooks
  if (!user || location.pathname === '/') {
    console.log('[SimpleMenu] CONDICIÓN DE SALIDA TEMPRANA CUMPLIDA. User:', user, 'Pathname:', location.pathname, '-> Retornando null.');
    return null;
  } else {
    console.log('[SimpleMenu] CONDICIÓN DE SALIDA TEMPRANA NO CUMPLIDA. User:', user, 'Pathname:', location.pathname, '-> Renderizando menú.');
  }
  
  // Component logic and JSX
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  const closeMenu = () => {
    setMenuOpen(false);
  };
  
  const handleLogout = (e) => {
    e.preventDefault();
    closeMenu();
    window.localStorage.clear();
    navigate('/');
    window.location.reload();
  };
  
  // Opciones del menú basadas en el rol del usuario
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <Home size={22} /> },
    { name: 'Pagos', path: '/pagos', icon: <Wallet size={22} /> },
    { name: 'Gastos', path: '/gastos', icon: <FileStack size={22} /> },
    { name: 'Documentos', path: '/documentos', icon: <FileText size={22} /> },
    { name: 'Calendario', path: '/fechas', icon: <Calendar size={22} /> },
  ];
  
  // Agregar historial solo para roles administrativos
  if (user && (user.rol_id === 1 || user.rol_id === 2 || user.rol_id === 3)) {
    menuItems.push({ name: 'Historial', path: '/historial', icon: <History size={22} /> });
  }
  
  return (
    <div id="simple-mobile-menu-container" ref={menuRef} style={styles.container}>
      <button 
        style={styles.button}
        onClick={toggleMenu}
        type="button"
        aria-label="Menú móvil"
      >
        {menuOpen ? 
          <span style={styles.buttonIcon}>
            <HiX size={24} /> 
          </span> 
          : 
          <span style={styles.buttonIcon}>
            <HiMenu size={24} />
          </span>
        }
      </button>
      
      {menuOpen && isMobileDevice && (
        <>
          <div style={styles.overlay} onClick={closeMenu} />
          <nav style={styles.menu}>
            <ul style={styles.menuList}>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const itemStyle = isActive 
                  ? { ...styles.menuItem, ...styles.menuItemActive }
                  : styles.menuItem;
                const iconStyle = styles.icon; 

                return (
                  <li key={item.name}>
                    <Link to={item.path} style={itemStyle} onClick={closeMenu}>
                      <span style={iconStyle}>{item.icon}</span>
                      <span style={styles.menuItemText}>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
              <li>
                <div onClick={handleLogout} style={styles.logoutItem}>
                  <span style={styles.logoutIcon}><LogOut size={22}/></span>
                  <span style={styles.menuItemText}>Cerrar sesión</span>
                </div>
              </li>
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}

export default SimpleMenu; 