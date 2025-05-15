import React, { useState } from 'react';
import { LogIn, AlertTriangle, Mail, KeyRound } from 'lucide-react'; // Iconos para el formulario
import { Link } from 'react-router-dom';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // localStorage.setItem('token', data.token); // App.js ya maneja esto
        
        // Asegurarse de que el usuario tiene todos los campos necesarios (esta validación es buena mantenerla)
        if (!data.rol_id || !data.nombre) { // Simplificado, asumiendo que el token ya implica el resto
          setError('Respuesta inesperada del servidor. Contacte al administrador.');
          setLoading(false);
          return;
        }
        onLogin(data);
      } else {
        setError(data.error || 'Error de autenticación. Verifique sus credenciales.');
      }
    } catch (err) {
      console.error("Error en el fetch de login:", err); // Loguear el error real
      setError('No se pudo conectar al servidor. Intente más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] p-4">
      <div className="bg-[var(--color-card-bg)] p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 border border-[var(--color-border)]">
        <div className="text-center mb-8">
          {/* Puedes añadir un logo aquí si lo tienes */}
          {/* <img src="/logo.png" alt="Gestion Curso Logo" className="mx-auto h-12 w-auto mb-4" /> */}
          <h2 className="text-3xl font-bold text-[var(--color-primary)]">Bienvenido a Gestion Curso</h2>
          <p className="text-[var(--color-text-secondary)] mt-2">Inicia sesión para acceder a tu portal.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text)] mb-1">
              Correo Electrónico
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 flex items-center justify-center w-12 pointer-events-none">
                <Mail className="h-5 w-5 text-[var(--color-text-secondary)]" aria-hidden="true" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full py-3 border border-[var(--color-border)] rounded-md placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] focus:border-[var(--color-primary)] sm:text-sm transition-colors bg-white text-[var(--color-text)] pl-12"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text)] mb-1">
              Contraseña
            </label>
            <div className="relative rounded-md shadow-sm">
               <div className="absolute inset-y-0 left-0 flex items-center justify-center w-12 pointer-events-none">
                <KeyRound className="h-5 w-5 text-[var(--color-text-secondary)]" aria-hidden="true" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full py-3 px-3 pl-12 border border-[var(--color-border)] rounded-md placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] focus:border-[var(--color-primary)] sm:text-sm transition-colors bg-white text-[var(--color-text)]"
                placeholder="Tu contraseña"
              />
            </div>
          </div>

          {error && (
            <div className="bg-[var(--color-error-bg)] border-l-4 border-[var(--color-error)] p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-[var(--color-error)]" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-[var(--color-error)]">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ingresando...
                </>
              ) : (
                <>
                  <LogIn className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-[var(--color-text-secondary)]">
          ¿No tienes una cuenta?{' '}
          <Link to="/" className="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">
            Volver al Inicio
          </Link>
        </p>
      </div>
    </div>
  );
}