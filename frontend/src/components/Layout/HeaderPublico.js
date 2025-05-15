import React from 'react';
import { Link } from 'react-router-dom';

export default function HeaderPublico() {
  return (
    <header className={`sticky top-0 z-50 h-20 transition-colors duration-300 bg-[var(--color-primary)] shadow-md`}>
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <img 
            src="/uploads/logo_gestion_padres.png"
            alt="Gestión Curso Logo" 
            className={`h-16 w-auto`}
          />
        </Link>

        {/* Botones de Navegación */}
        <nav className="space-x-3">
          <Link
            to="/login"
            className={`font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-300 shadow-sm hover:shadow-md 
                        bg-white text-[var(--color-primary)] hover:bg-gray-100`}
          >
            Iniciar sesión
          </Link>
          <Link
            to="/#cta"
            onClick={(e) => {
              const href = e.currentTarget.href;
              const targetId = href.substring(href.indexOf('#') + 1);
              const targetElement = document.getElementById(targetId);
              if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className={`font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-300 shadow-sm hover:shadow-md 
                        bg-white text-[var(--color-primary)] border border-[var(--color-primary)] hover:bg-gray-100 hover:border-[var(--color-primary-hover)] hover:text-[var(--color-primary-hover)]`}
          >
            Solicitar demo
          </Link>
        </nav>
      </div>
    </header>
  );
} 