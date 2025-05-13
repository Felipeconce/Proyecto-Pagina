import React, { useState, Fragment } from 'react';
import './PagosStyles.css';

// Componente de tabla completamente nuevo con implementación simple
const PagosTable = ({ alumnos, conceptos, pagos, user, onCellClick }) => {
  // Preparar datos para mostrar
  const pagosMap = {};
  const estadosMap = {};
  
  // Organizar pagos en formato de mapa para acceso rápido
  pagos.forEach(p => {
    if (!pagosMap[p.usuario_id]) {
      pagosMap[p.usuario_id] = {};
      estadosMap[p.usuario_id] = {};
    }
    pagosMap[p.usuario_id][p.concepto_id] = p.monto;
    estadosMap[p.usuario_id][p.concepto_id] = p.estado;
  });
  
  // Formatear montos
  const formatearMonto = (monto) => {
    if (!monto) return '—';
    const montoNumero = Number(monto);
    if (isNaN(montoNumero)) return '—';
    const montoEntero = Math.round(montoNumero);
    return `$${montoEntero.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`;
  };
  
  // Determinar el color de celda según su estado
  const getCellColor = (alumnoId, conceptoId) => {
    if (estadosMap[alumnoId]?.[conceptoId] === 'pagado') {
      return '#dcfce7'; // Verde para pagado
    } else if (pagosMap[alumnoId]?.[conceptoId]) {
      return '#fff7ed'; // Naranja para pendiente
    } else {
      return 'white'; // Blanco por defecto
    }
  };
  
  // Obtener clase CSS según estado
  const getCellClass = (alumnoId, conceptoId) => {
    if (estadosMap[alumnoId]?.[conceptoId] === 'pagado') {
      return 'pago-completado';
    } else if (pagosMap[alumnoId]?.[conceptoId]) {
      return 'pago-pendiente';
    }
    return '';
  };
  
  // Ordenar conceptos
  const conceptosOrdenados = [...conceptos].sort((a, b) => {
    if (a.orden !== b.orden) {
      if (a.orden === 0 || a.orden === null) return -1;
      if (b.orden === 0 || b.orden === null) return 1;
      return a.orden - b.orden;
    }
    return a.nombre.localeCompare(b.nombre);
  });
  
  // Verificar que haya datos para mostrar
  const tieneAlumnos = Array.isArray(alumnos) && alumnos.length > 0;
  const tieneConceptos = Array.isArray(conceptos) && conceptos.length > 0;
  
  if (!tieneAlumnos || !tieneConceptos) {
    return (
      <div className="tabla-contenedor" style={{padding: '20px', textAlign: 'center'}}>
        <p>{!tieneAlumnos ? 'No hay alumnos registrados.' : 'No hay conceptos de pago definidos.'}</p>
      </div>
    );
  }
  
  return (
    <div className="table-container">
      <div className="tabla-scroll-main">
        <table className="table-modern">
          <thead>
            <tr>
              <th className="sticky-col">
                ALUMNO
              </th>
              
              {conceptosOrdenados.map(concepto => (
                <th key={concepto.id} className="concepto-col">
                  {(concepto.nombre || '').slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {alumnos.map(alumno => (
              <tr key={alumno.id}>
                <td className="sticky-col">
                  {alumno.nombre || 'Sin nombre'}
                </td>
                
                {conceptosOrdenados.map(concepto => {
                  const cellClass = getCellClass(alumno.id, concepto.id);
                  return (
                    <td 
                      key={concepto.id}
                      onClick={() => user.rol_id === 3 && onCellClick(alumno.id, concepto.id)}
                      className={`concepto-col ${cellClass}`}
                      style={{
                        cursor: user.rol_id === 3 ? 'pointer' : 'default'
                      }}
                    >
                      {formatearMonto(pagosMap[alumno.id]?.[concepto.id])}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PagosTable; 