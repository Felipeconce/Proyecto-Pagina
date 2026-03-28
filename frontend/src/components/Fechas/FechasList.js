import React, { useEffect, useState } from 'react';
import { FaCalendarDay, FaCalendarCheck, FaCalendarWeek, FaCalendarTimes, FaTrash, FaCalendarAlt } from 'react-icons/fa';
import { useToast } from '../Layout/ToastProvider';

export default function FechasList({ user, refresh, onRefresh }) {
  const [fechas, setFechas] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const puedeEliminar = user && [1, 2, 3, 5].includes(user.rol_id);

  const handleDelete = async (id, descripcion) => {
    if (!window.confirm(`¿Eliminar la fecha "${descripcion}"?`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/fechas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      showToast('Fecha eliminada', 'success');
      if (onRefresh) onRefresh();
    } catch {
      showToast('Error al eliminar fecha', 'error');
    }
  };

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
  }, [refresh]);

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
        <div style={{ padding: '8px 0' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-row">
              <span className="skeleton" style={{ height: 14, width: '18%' }} />
              <span className="skeleton" style={{ height: 14, width: '44%' }} />
              <span className="skeleton" style={{ height: 24, width: '14%', borderRadius: 9999 }} />
            </div>
          ))}
        </div>
      ) : fechas.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon"><FaCalendarAlt /></span>
          <p className="empty-state-text">No hay fechas importantes registradas</p>
          {puedeEliminar && <p className="empty-state-hint">Agrega la primera fecha usando el formulario</p>}
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
                {puedeEliminar && <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Acciones</th>}
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
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block', padding: '4px 10px', borderRadius: '9999px',
                        fontSize: '13px', fontWeight: '600',
                        backgroundColor: `${fechaColor}20`, color: fechaColor
                      }}>
                        {getEstadoFecha(fecha.fecha)}
                      </span>
                    </td>
                    {puedeEliminar && (
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button onClick={() => handleDelete(fecha.id, fecha.descripcion)} className="btn-icon btn-delete" style={{ fontSize: 13, padding: '6px 12px' }}>
                          <FaTrash /> Eliminar
                        </button>
                      </td>
                    )}
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