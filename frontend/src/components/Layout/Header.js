import React from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineUserGroup, HiMenu } from 'react-icons/hi';
import { FiLogOut } from 'react-icons/fi';
import './Header.css';

function getRolName(rol_id) {
  switch (rol_id) {
    case 1: return 'Administrador';
    case 2: return 'Tesorero';
    case 3: return 'Secretario';
    case 4: return 'Apoderado';
    default: return 'Usuario';
  }
}

export default function Header({ onHamburgerClick, user, onLogout }) {
  if (!user) return null;
  
  const handleLogout = () => {
    if (window.confirm('¿Estás seguro que deseas cerrar sesión?')) {
      onLogout();
    }
  };
  
  // Manejador específico para el botón hamburguesa
  const handleHamburgerClick = (e) => {
    // Detener la propagación para evitar que se cierre inmediatamente
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Hamburguesa clickeada en Header");
    
    // Llamar a la función proporcionada desde el componente padre
    if (onHamburgerClick) {
      onHamburgerClick();
    }
  };
  
  // Comprobación de si estamos en un dispositivo móvil
  const isMobileDevice = window.innerWidth <= 900;
  
  return (
    <header className="header-pro">
      <div className="header-left">
        {isMobileDevice && (
          <button 
            className="hamburger desktop-hamburger" 
            onClick={handleHamburgerClick}
            aria-label="Menú"
            type="button"
          >
            <HiMenu size={24} />
          </button>
        )}
        <h1>
          <HiOutlineUserGroup className="header-logo" size={30} />
          Centro de Apoderados
        </h1>
      </div>
      <div className="header-user-section">
        <span className="header-user-name">
          {user.nombre} | {getRolName(user.rol_id)}
        </span>
        <button
          onClick={handleLogout}
          className="btn-logout"
          title="Cerrar sesión"
          type="button"
        >
          <FiLogOut />
          Salir
        </button>
      </div>
    </header>
  );
}