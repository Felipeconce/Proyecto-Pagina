import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  // const navigate = useNavigate(); // Ya no es necesario aquí

  if (!user) return null;
  
  const handleLogoutClick = () => {
    if (window.confirm('¿Estás seguro que deseas cerrar sesión?')) {
      onLogout(); // Esto llamará a handleLogout en AppContent, que ahora navega
      // console.log("Navegando a / desde Header.js tras llamar a onLogout"); // Eliminado
      // navigate('/', { replace: true }); // Eliminado
    }
  };
  
  // Comprobación de si estamos en un dispositivo móvil
  // const isMobileDevice = window.innerWidth <= 900; // Ya no es necesario aquí
  
  return (
    <header className="header-pro">
      <div className="header-title-wrapper">
        <h1 className="font-semibold text-lg">
          {/* <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3eb.svg" alt="Edificio escolar" className="header-logo" /> */}
          Gestión Curso
        </h1>
      </div>
      <div className="header-user-section">
        <span className="header-user-name">
          {user.nombre} | {getRolName(user.rol_id)}
        </span>
        <button
          onClick={handleLogoutClick}
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