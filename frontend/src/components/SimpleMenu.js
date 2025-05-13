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
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(isMobile()); // Inicializar con la función
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  // const menuContentRef = useRef(null); // No se usa, se puede quitar
  
  // Efecto para manejar la visibilidad basada en el tamaño de la pantalla
  useEffect(() => {
    const handleResize = () => {
      const mobile = isMobile();
      setIsMobileDevice(mobile);
      
      if (menuRef.current) {
        if (!mobile && menuOpen) { // Si cambia a desktop y el menú estaba abierto
          setMenuOpen(false); // Ciérralo
        }
      }
    };

    handleResize(); // Llamada inicial para establecer el estado correcto
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [menuOpen]); // Mantener menuOpen aquí para el caso de cerrar si se pasa a desktop

  // Efecto para el scroll del body cuando el menú está abierto
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
  
  // Al cambiar de ruta, cerrar el menú
  useEffect(() => {
    if (menuOpen) {
      setMenuOpen(false);
    }
  }, [location.pathname]);
  
  // Añadir evento de escape para cerrar el menú
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
  
  // Si no hay usuario, no renderizar nada
  if (!user) return null;
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  const closeMenu = () => {
    setMenuOpen(false);
  };
  
  const handleLogout = (e) => {
    e.preventDefault();
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
  
  if (!isMobileDevice && !menuOpen) { // No renderizar nada en desktop si el menú no está forzado a abrirse
      // O, si el botón es solo para mobile, y el menuRef.current.style.display='none' lo oculta
      // entonces este if (!isMobileDevice) return null; podría ser más simple. 
      // Dejemos que el display:none del useEffect haga su trabajo primero.
  }

  return (
    <div ref={menuRef} style={styles.container}>
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
          <nav /*ref={menuContentRef}*/ style={styles.menu}> {/* menuContentRef no se usa */}
            <ul style={styles.menuList}>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const itemStyle = isActive 
                  ? { ...styles.menuItem, ...styles.menuItemActive }
                  : styles.menuItem;
                const iconStyle = styles.icon; 

                return (
                  <li key={item.name}>
                    <Link to={item.path} style={itemStyle} onClick={closeMenu}> {/* Cerrar menú al hacer clic */}
                      <span style={iconStyle}>{item.icon}</span>
                      <span style={styles.menuItemText}>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
              <li>
                <div onClick={(e) => { closeMenu(); handleLogout(e); }} style={styles.logoutItem}> {/* Cerrar menú antes de logout */}
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