import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaChartLine, FaMoneyBillWave, FaReceipt, FaFileAlt, FaCalendarAlt, FaHistory, FaSignOutAlt } from 'react-icons/fa';
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
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
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
    top: '60px',
    left: 0,
    width: '275px',
    height: 'calc(100vh - 60px)',
    backgroundColor: 'white',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    overflow: 'auto',
    zIndex: 9999
  },
  menuList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column'
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 16px',
    color: '#1e293b',
    textDecoration: 'none',
    borderBottom: '1px solid #e2e8f0',
    transition: 'background-color 0.2s',
    fontSize: '16px',
    fontWeight: 500
  },
  menuItemActive: {
    backgroundColor: '#e0e7ff',
    color: '#2563eb',
    fontWeight: 600
  },
  icon: {
    marginRight: '12px',
    color: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px'
  },
  logoutItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 16px',
    color: '#ef4444',
    textDecoration: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 500,
    marginTop: '10px'
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
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const menuContentRef = useRef(null);
  
  // Detectar cambios de tamaño de la ventana para mostrar/ocultar el menú
  useEffect(() => {
    // Función que verifica y actualiza la visibilidad
    const handleResize = () => {
      const mobileDevice = isMobile();
      setIsMobileDevice(mobileDevice);
      
      // Actualizar el estilo directamente - solo mostrar en móvil
      if (menuRef.current) {
        if (mobileDevice) {
          // En móvil, mostrar y posicionar correctamente
          menuRef.current.style.display = 'flex';
        } else {
          // En desktop, ocultar completamente
          menuRef.current.style.display = 'none';
          
          // Si cambiamos a desktop y el menú está abierto, cerrarlo
          if (menuOpen) {
            setMenuOpen(false);
            document.body.style.overflow = '';
          }
        }
      }
    };
    
    // Ejecutar inmediatamente para configurar el estado inicial
    handleResize();
    
    // Añadir el listener para cambios de tamaño
    window.addEventListener('resize', handleResize);
    
    // Limpiar al desmontar
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);
  
  // Cuando el menú está abierto, evitar scroll del body - solo en móvil
  useEffect(() => {
    if (menuOpen && isMobileDevice) {
      // Solo bloqueamos el scroll cuando el menú está abierto en móvil
      document.body.style.overflow = 'hidden';
    } else {
      // En cualquier otro caso, permitimos el scroll normal
      document.body.style.overflow = '';
    }
    
    return () => {
      // Asegurarnos de restaurar el scroll al desmontar
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
    { name: 'Dashboard', path: '/', icon: <FaChartLine size={18} /> },
    { name: 'Pagos', path: '/pagos', icon: <FaMoneyBillWave size={18} /> },
    { name: 'Gastos', path: '/gastos', icon: <FaReceipt size={18} /> },
    { name: 'Documentos', path: '/documentos', icon: <FaFileAlt size={18} /> },
    { name: 'Calendario', path: '/fechas', icon: <FaCalendarAlt size={18} /> },
  ];
  
  // Agregar historial solo para roles administrativos
  if (user.rol_id === 1 || user.rol_id === 2 || user.rol_id === 3) {
    menuItems.push({ name: 'Historial', path: '/historial', icon: <FaHistory size={18} /> });
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
          <div ref={menuContentRef} style={styles.menu}>
            <ul style={styles.menuList}>
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    style={{
                      ...styles.menuItem,
                      ...(location.pathname === item.path ? styles.menuItemActive : {})
                    }}
                    onClick={closeMenu}
                  >
                    <span style={styles.icon}>{item.icon}</span>
                    {item.name}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="#logout"
                  style={styles.logoutItem}
                  onClick={(e) => {
                    closeMenu();
                    handleLogout(e);
                  }}
                >
                  <span style={styles.icon}>
                    <FaSignOutAlt size={18} style={{ color: '#ef4444' }} />
                  </span>
                  Cerrar sesión
                </a>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default SimpleMenu; 