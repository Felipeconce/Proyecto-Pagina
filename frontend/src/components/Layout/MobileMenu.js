// Componente MobileMenu - Menú móvil independiente
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaChartLine, FaMoneyBillWave, FaReceipt, FaFileAlt, FaCalendarAlt, FaHistory, FaSignOutAlt } from 'react-icons/fa';
import './MobileMenu.css';

// Items de navegación
const menuItems = [
  { nombre: 'Dashboard', ruta: '/', icono: <FaChartLine size={20} /> },
  { nombre: 'Pagos', ruta: '/pagos', icono: <FaMoneyBillWave size={20} /> },
  { nombre: 'Gastos', ruta: '/gastos', icono: <FaReceipt size={20} /> },
  { nombre: 'Documentos', ruta: '/documentos', icono: <FaFileAlt size={20} /> },
  { nombre: 'Calendario', ruta: '/fechas', icono: <FaCalendarAlt size={20} /> },
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
      {/* Overlay/backdrop que cubre toda la pantalla */}
      {isOpen && (
        <div className="mobile-menu-backdrop" onClick={onClose}></div>
      )}
      
      {/* El menú móvil */}
      <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
        <ul className="mobile-menu-list">
          {filteredItems.map((item) => (
            <li key={item.ruta}>
              <Link
                to={item.ruta}
                className={`mobile-menu-link ${location.pathname === item.ruta ? 'active' : ''}`}
                onClick={onClose}
              >
                <div className="mobile-menu-icon">{item.icono}</div>
                <span>{item.nombre}</span>
              </Link>
            </li>
          ))}
          
          <li className="mobile-menu-logout">
            <a 
              href="#logout" 
              className="mobile-menu-link"
              onClick={handleLogout}
            >
              <div className="mobile-menu-icon">
                <FaSignOutAlt size={20} />
              </div>
              <span>Cerrar sesión</span>
            </a>
          </li>
        </ul>
      </div>
    </>
  );
}

export default MobileMenu; 