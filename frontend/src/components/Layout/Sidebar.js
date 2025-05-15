import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
/* import './SidebarReset.css'; */ /* ELIMINADO - Causa conflictos con !important */
/* import styles from './Sidebar.module.css'; */ /* ELIMINADO */
import { Home, Wallet, FileText, FileStack, Calendar, History, LogOut } from 'lucide-react';

// Items de navegación
const menuItems = [
  { nombre: 'Dashboard', ruta: '/dashboard', icono: <Home size={22} /> },
  { nombre: 'Pagos', ruta: '/pagos', icono: <Wallet size={22} /> },
  { nombre: 'Gastos', ruta: '/gastos', icono: <FileStack size={22} /> },
  { nombre: 'Documentos', ruta: '/documentos', icono: <FileText size={22} /> },
  { nombre: 'Calendario', ruta: '/fechas', icono: <Calendar size={22} /> },
];

// Función para detectar si estamos en un dispositivo móvil
const isMobileDevice = () => window.innerWidth <= 900;

export default function Sidebar({ open, setOpen, user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(isMobileDevice());
  const sidebarRef = useRef(null);
  const backdropRef = useRef(null);

  // Estados para nombre de curso y colegio
  const [nombreCurso, setNombreCurso] = useState('');
  const [nombreColegio, setNombreColegio] = useState('');
  const [loadingInfo, setLoadingInfo] = useState(false);

  // Manejar cierre de sesión
  const handleLogout = useCallback((e) => {
    e.preventDefault();
    window.localStorage.clear();
    navigate('/');
    window.location.reload();
  }, [navigate]);
  
  // Cerrar el sidebar si se hace clic en el overlay (solo en desktop)
  const handleOverlayClick = useCallback((e) => {
    console.log('Overlay clickeado');
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
  }, [setOpen]);
  
  // Actualizar estado de dispositivo móvil
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    if (user && user.curso_id) {
      setLoadingInfo(true);
      // Cargar nombre del curso
      fetch(`${process.env.REACT_APP_API_URL}/cursos`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Error al cargar cursos');
          }
          return res.json();
        })
        .then(cursos => {
          const cursoEncontrado = cursos.find(c => c.id === user.curso_id);
          if (cursoEncontrado) {
            setNombreCurso(cursoEncontrado.nombre);
          } else {
            setNombreCurso(`Curso ID: ${user.curso_id}`); // Fallback si no se encuentra
          }
        })
        .catch(error => {
          console.error("Error fetching curso:", error);
          setNombreCurso(''); // Limpiar en caso de error
        })
        .finally(() => {
          // setLoadingInfo(false) se manejará después del colegio si es necesario
        });
    } else {
      setNombreCurso('');
    }

    // Para el nombre del colegio:
    // Como la tabla 'colegios' está vacía y no hay endpoint,
    // usaremos user.nombre_colegio si existe, o un fallback.
    // Si tuvieras un mapeo estático, iría aquí.
    if (user && user.colegio_id) {
      if (user.nombre_colegio) { // Si viniera en el objeto user
        setNombreColegio(user.nombre_colegio);
      } else {
        // Aquí podrías poner un nombre por defecto si lo conoces para user.colegio_id
        // Ejemplo: if (user.colegio_id === 1) setNombreColegio("Colegio Central");
        // Por ahora, si no hay nombre_colegio en el user, se puede mostrar el ID o nada.
        setNombreColegio(`Colegio ID: ${user.colegio_id}`); // Fallback temporal
      }
    } else {
      setNombreColegio('');
    }
    // Simulamos que la carga de info (principalmente curso) termina aquí
    // En un caso real con fetch para colegio, el finally iría después de ambas promesas.
    if (user && user.curso_id) { // Solo actualiza loading si se intentó cargar curso
        setLoadingInfo(false);
    }

  }, [user]);
  
  // No renderizar en dispositivos móviles
  if (isMobile) {
    return null;
  }
  
  // Filtrar elementos de menú según el rol del usuario
  const filteredItems = [
    ...menuItems,
    (user && (user.rol_id === 1 || user.rol_id === 2 || user.rol_id === 3)) && { // Verificar user
      nombre: 'Historial',
      ruta: '/historial',
      icono: <History size={22} />,
    },
  ].filter(Boolean);
  
  return (
    <>
      {/* Backdrop para cuando el sidebar está abierto */}
      <div 
        ref={backdropRef} 
        className={`sidebar-backdrop ${open && !isMobile ? 'open' : ''}`}
        onClick={handleOverlayClick}
        /* style={{ display: 'none' }} */ /* ELIMINADO */
      />
      
      {/* Sidebar para desktop */}
      <aside 
        ref={sidebarRef}
        className={`sidebar-modern ${!open && !isMobile ? 'sidebar-closed-placeholder' : ''}`}
      >
        <nav className="sidebar-nav">
          {/* Información del Colegio y Curso */}
          {user && (nombreColegio || nombreCurso || loadingInfo) && (
            <div className="px-4 pt-4 pb-2 text-sm text-gray-400">
              {loadingInfo ? (
                <p className="text-gray-300">Cargando info...</p>
              ) : (
                <>
                  {nombreColegio && (
                    <p className="font-semibold text-gray-300 truncate">{nombreColegio}</p>
                  )}
                  {nombreCurso && (
                    <p className="truncate">{nombreCurso}</p>
                  )}
                </>
              )}
            </div>
          )}

          <ul className="sidebar-list" style={{gap: '12px'}}>
            {filteredItems.map((item) => (
              <li key={item.ruta} className="sidebar-item">
                <Link
                  to={item.ruta}
                  className={`sidebar-link ${
                    location.pathname === item.ruta ? ' active' : ''
                  }`}
                >
                  <span className="sidebar-icon">{item.icono}</span>
                  <span className="sidebarText">{item.nombre}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}