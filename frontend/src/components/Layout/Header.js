import React from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineUserGroup } from 'react-icons/hi';
import { FiLogOut } from 'react-icons/fi';

export default function Header({ onHamburgerClick, user, onLogout }) {
  if (!user) return null;
  
  const handleLogout = () => {
    if (window.confirm('¿Estás seguro que deseas cerrar sesión?')) {
      onLogout();
    }
  };
  
  return (
    <header className="header-pro">
      <button className="hamburger" onClick={onHamburgerClick}>
        <i className="material-icons">menu</i>
      </button>
      <h1>
        <HiOutlineUserGroup className="header-logo" size={30} />
        Centro de Apoderados
      </h1>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ 
          color: '#4b5563', 
          fontSize: '0.95rem',
          fontWeight: 500 
        }}>
          {user.nombre} | {getRolName(user.rol_id)}
        </span>
        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            color: '#ef4444',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: 8,
            boxShadow: 'none',
            fontWeight: 600,
            fontSize: '0.95rem'
          }}
          title="Cerrar sesión"
        >
          <FiLogOut />
          Salir
        </button>
      </div>
    </header>
  );
}

function getRolName(rol_id) {
  switch (rol_id) {
    case 1: return 'Administrador';
    case 2: return 'Presidente';
    case 3: return 'Tesorero';
    case 4: return 'Apoderado';
    default: return 'Usuario';
  }
}