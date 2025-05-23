// Componente MobileMenu - Menú móvil independiente
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
// Importar todos los iconos necesarios, incluyendo los usados en Sidebar
import { FaChartLine, FaWallet, FaFileInvoiceDollar, FaFileAlt, FaCalendarAlt, FaHistory, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import { Home, Wallet as WalletLucide, FileText as FileTextLucide, FileStack as FileStackLucide, Calendar as CalendarLucide, History as HistoryLucide, LogOut } from 'lucide-react'; // Importar iconos de Lucide si se usan en Sidebar
import './MobileMenu.css';

// Items de navegación base (igual que en Sidebar.js)
const menuItems = [
  { nombre: 'Dashboard', ruta: '/dashboard', icono: <Home size={20} /> }, // Usar icono de Lucide para consistencia si Sidebar lo usa
  { nombre: 'Pagos', ruta: '/pagos', icono: <WalletLucide size={20} /> },
  { nombre: 'Gastos', ruta: '/gastos', icono: <FileStackLucide size={20} /> },
  { nombre: 'Documentos', ruta: '/documentos', icono: <FileTextLucide size={20} /> },
  { nombre: 'Calendario', ruta: '/fechas', icono: <CalendarLucide size={20} /> },
];

function MobileMenu({ isOpen, onClose, user }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Si no hay usuario, no renderizar nada
  if (!user) return null;
  
  // Manejar cierre de sesión
  const handleLogout = (e) => {
    e.preventDefault();
    window.localStorage.clear();
    navigate('/');
    window.location.reload();
  };
  
  // Construir lista de items de menú principal, aplicando filtrado por rol y añadiendo opciones de utilidad
  const mainMenuItems = [
    ...menuItems,
    // Añadir opción Administración (solo para rol_id 1)
    (user.rol_id === 1) && {
      nombre: 'Administración',
      ruta: '/admin-usuarios',
      icono: <FaUserCircle size={20} />,
    },
    // Historial (visible para rol_id 1, 2, 3)
    (user.rol_id === 1 || user.rol_id === 2 || user.rol_id === 3) && { 
      nombre: 'Historial',
      ruta: '/historial',
      icono: <HistoryLucide size={20} />,
    },
    // Cambiar Clave (visible para todos los usuarios autenticados)
    user && { // Asegurarse de que el usuario esté loggeado
      nombre: 'Cambiar Clave',
      ruta: '/cambiar-clave',
      icono: <FaUserCircle size={20} />,
    },
    // Cerrar Sesión (visible para todos los usuarios autenticados)
    user && { // Asegurarse de que el usuario esté loggeado
      nombre: 'Cerrar sesión',
      // No tiene ruta, ya que usa un manejador de evento onClick
      onClick: handleLogout,
      icono: <LogOut size={20} />,
      isButton: true, // Indicador para saber que es un botón y no un Link
    },
  ].filter(Boolean); // Elimina elementos false/null creados por el && condicional
  
  return (
    <>
      {/* Overlay/backdrop que cubre toda la pantalla */}
      {isOpen && (
        <div className="mobile-menu-backdrop" onClick={onClose}></div>
      )}
      
      {/* El menú móvil */}
      <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
        <ul className="mobile-menu-list">
          {/* INDICADOR TEMPORAL: SI VES ESTO, EL ARCHIVO SE CARGA CORRECTAMENTE */}
          <li>DEBUG_INDICATOR</li>
          {/* Renderizar items principales */}
          {mainMenuItems.map((item) => (
            <li key={item.ruta || item.nombre}> {/* Usar nombre como key si no hay ruta (para Cerrar Sesión) */}
              {item.isButton ? (
                // Si es un botón (Cerrar Sesión)
                <button onClick={item.onClick} className="mobile-menu-link mobile-menu-logout">
                  <div className="mobile-menu-icon">{item.icono}</div>
                  <span>{item.nombre}</span>
                </button>
              ) : (
                // Si es un Link
                <Link
                  to={item.ruta}
                  className={`mobile-menu-link ${location.pathname === item.ruta ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <div className="mobile-menu-icon">{item.icono}</div>
                  <span>{item.nombre}</span>
                </Link>
              )}
            </li>
          ))}
          
          {/* Separador visual si es necesario (puedes añadir una línea divisoria aquí con un <li> y una clase CSS) */}

        </ul>
      </div>
    </>
  );
}

export default MobileMenu; 