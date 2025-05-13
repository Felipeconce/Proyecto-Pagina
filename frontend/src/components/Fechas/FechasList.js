import React, { useEffect, useState } from 'react';
import { FaCalendarDay, FaCalendarCheck, FaCalendarWeek, FaCalendarTimes } from 'react-icons/fa';
import './FechasStyles.css';

export default function FechasList() {
  const [fechas, setFechas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debug, setDebug] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setLoading(true);
    setError(null);
    
    // Almacenar información de depuración
    try {
      const tokenData = token ? JSON.parse(atob(token.split('.')[1])) : null;
      setDebug({
        tokenPresente: !!token,
        tokenData: tokenData,
        apiUrl: process.env.REACT_APP_API_URL
      });
    } catch (e) {
      setDebug({
        tokenPresente: !!token,
        tokenError: e.message,
        apiUrl: process.env.REACT_APP_API_URL
      });
    }
    
    fetch(`${process.env.REACT_APP_API_URL}/fechas`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Error al cargar fechas: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        // Asegurarse de que data sea un array
        if (!Array.isArray(data)) {
          console.warn('La respuesta no es un array:', data);
          data = [];
        }
        
        console.log('Fechas recibidas:', data);
        
        // Ordenar por fecha, más cercanas primero
        const fechasOrdenadas = [...data].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        setFechas(fechasOrdenadas);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al cargar fechas:', err);
        setError(`No se pudieron cargar las fechas importantes: ${err.message}`);
        setFechas([]);
        setLoading(false);
      });
  }, []);

  // Función para determinar el icono según la fecha
  const getFechaIcon = (fechaStr) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const fechaEvento = new Date(fechaStr);
    fechaEvento.setHours(0, 0, 0, 0);
    
    const diffDays = Math.round((fechaEvento - hoy) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      // return <FaCalendarTimes color="#ef4444" />; // Fecha pasada
      return <FaCalendarTimes color="var(--color-error)" />;
    } else if (diffDays === 0) {
      // return <FaCalendarDay color="#f59e0b" />; // Hoy
      return <FaCalendarDay color="var(--color-warning)" />;
    } else if (diffDays <= 7) {
      // return <FaCalendarWeek color="#3b82f6" />; // Esta semana
      return <FaCalendarWeek color="var(--color-primary)" />;
    } else {
      // return <FaCalendarCheck color="#10b981" />; // Próximamente
      return <FaCalendarCheck color="var(--color-success)" />;
    }
  };

  // Función para obtener color según la fecha
  const getFechaColor = (fechaStr) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const fechaEvento = new Date(fechaStr);
    fechaEvento.setHours(0, 0, 0, 0);
    
    const diffDays = Math.round((fechaEvento - hoy) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return "#ef4444"; // Rojo para fechas pasadas
    } else if (diffDays === 0) {
      return "#f59e0b"; // Naranja para hoy
    } else if (diffDays <= 7) {
      return "#3b82f6"; // Azul para esta semana
    } else {
      return "#10b981"; // Verde para próximamente
    }
  };

  // Función para obtener clase CSS según el estado
  const getEstadoClass = (fechaStr) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const fechaEvento = new Date(fechaStr);
    fechaEvento.setHours(0, 0, 0, 0);
    
    const diffDays = Math.round((fechaEvento - hoy) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return "estado-pasado";
    } else if (diffDays === 0) {
      return "estado-hoy";
    } else if (diffDays <= 7) {
      return "estado-semana";
    } else {
      return "estado-futuro";
    }
  };

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="fechas-loading">
        Cargando fechas...
      </div>
    );
  }

  // Mostrar mensaje de error
  if (error) {
    return (
      <>
        <div className="fechas-error">
          {error}
        </div>
        {debug && (
          <div className="fechas-debug">
            <pre>{JSON.stringify(debug, null, 2)}</pre>
          </div>
        )}
      </>
    );
  }

  return (
    fechas.length === 0 ? (
      <div className="fechas-empty">
        No hay fechas importantes registradas.
      </div>
    ) : (
      <div className="table-container">
        <table className="table-modern">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Descripción</th>
              <th style={{textAlign: 'center'}}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {fechas.map(fecha => {
              const estadoClass = getEstadoClass(fecha.fecha);
              return (
                <tr key={fecha.id}>
                  <td className="fecha-cell" style={{verticalAlign: 'middle'}}>
                    {getFechaIcon(fecha.fecha)}
                    {new Date(fecha.fecha).toLocaleDateString('es-CL', {
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric'
                    }).replace(/\//g, '-')}
                  </td>
                  <td>{fecha.descripcion}</td>
                  <td style={{textAlign: 'center'}}>
                    <span className={`estado-badge ${estadoClass}`}>
                      {getEstadoFecha(fecha.fecha)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )
  );
}

// Función para determinar el estado según la fecha
function getEstadoFecha(fechaStr) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const fechaEvento = new Date(fechaStr);
  fechaEvento.setHours(0, 0, 0, 0);
  
  const diffDays = Math.round((fechaEvento - hoy) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return "Pasado";
  } else if (diffDays === 0) {
    return "Hoy";
  } else if (diffDays <= 7) {
    return "Esta semana";
  } else {
    return "Próximamente";
  }
}