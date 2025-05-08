import React, { useEffect, useState } from 'react';
import { FaCalendarDay, FaCalendarCheck, FaCalendarWeek, FaCalendarTimes } from 'react-icons/fa';

export default function FechasList() {
  const [fechas, setFechas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setLoading(true);
    
    fetch(`${process.env.REACT_APP_API_URL}/fechas`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        // Ordenar por fecha, más cercanas primero
        const fechasOrdenadas = [...data].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        setFechas(fechasOrdenadas);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al cargar fechas:', err);
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
      return <FaCalendarTimes color="#ef4444" />; // Fecha pasada
    } else if (diffDays === 0) {
      return <FaCalendarDay color="#f59e0b" />; // Hoy
    } else if (diffDays <= 7) {
      return <FaCalendarWeek color="#3b82f6" />; // Esta semana
    } else {
      return <FaCalendarCheck color="#10b981" />; // Próximamente
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

  return (
    <div className="content-section" style={{
      backgroundColor: '#fff',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)'
    }}>
      <h3 style={{
        fontSize: '20px',
        fontWeight: '700',
        color: '#374151',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <FaCalendarDay color="#3b82f6" /> Listado de Fechas Importantes
      </h3>

      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
          Cargando fechas...
        </div>
      ) : fechas.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
          No hay fechas importantes registradas.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '15px',
            color: '#374151'
          }}>
            <thead>
              <tr style={{ 
                backgroundColor: '#dbeafe',
                borderBottom: '2px solid #bfdbfe',
                textAlign: 'left'
              }}>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Fecha</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Descripción</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {fechas.map(fecha => {
                const fechaColor = getFechaColor(fecha.fecha);
                return (
                  <tr key={fecha.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ 
                      padding: '12px 16px', 
                      fontWeight: '600',
                      color: fechaColor,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {getFechaIcon(fecha.fecha)}
                      {new Date(fecha.fecha).toLocaleDateString('es-CL', {
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric'
                      }).replace(/\//g, '-')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>{fecha.descripcion}</td>
                    <td style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center' 
                    }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '13px',
                        fontWeight: '600',
                        backgroundColor: `${fechaColor}20`,
                        color: fechaColor
                      }}>
                        {getEstadoFecha(fecha.fecha)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
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