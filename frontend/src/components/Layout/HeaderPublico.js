import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

export default function HeaderPublico() {
  return (
    <header className={`sticky top-0 z-50 h-20 transition-colors duration-300 bg-[var(--color-primary)] shadow-md`}>
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        {/* Izquierda: Botón Iniciar Sesión */}
        <div className="flex justify-start w-auto"> {/* Ajustar ancho si es necesario o dejar en auto */} 
          <Link
            to="/login"
            onClick={() => console.log('Click en Iniciar Sesión')}
            className={`font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-300 shadow-sm hover:shadow-md 
                        bg-white text-[var(--color-primary)] hover:bg-gray-100`}
          >
            Iniciar sesión
          </Link>
        </div>

        {/* Centro: Logo */}
        <div className="flex justify-center flex-grow">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/uploads/logo_gestion_padres.png"
              alt="Gestión Curso Logo" 
              className={`h-16 w-auto filter brightness-0 invert drop-shadow-[0px_0px_0.7px_rgba(255,255,255,0.7)]`}
            />
          </Link>
        </div>

        {/* Derecha: Botón Ver Demo en Video */}
        <div className="flex justify-end w-auto"> {/* Ajustar ancho si es necesario o dejar en auto */} 
          <Link
            to="/login" // Este enlace quizás debería ser a una sección de demo o a la misma página con un modal
            className={`font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-300 shadow-sm hover:shadow-md 
                        bg-white text-[var(--color-primary)] hover:bg-gray-100 
                        inline-flex items-center justify-center transform hover:scale-105`}
          >
            <Play size={18} className="mr-1.5 text-[var(--color-primary)]" /> {/* Icono también con color primario */}
            Ver Demo
          </Link>
        </div>
      </div>
    </header>
  );
} 