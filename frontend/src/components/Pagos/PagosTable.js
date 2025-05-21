import React, { useState, Fragment } from 'react';
import './PagosStyles.css'; // Descomentado
// import './TableScroll.css'; // Sigue comentado por ahora

// Componente de tabla completamente nuevo con implementación simple
const PagosTable = ({ alumnos, conceptos, pagos, user, onCellClick, atrasadosMap }) => {
  console.log('[PagosTable] Props recibidas:', { alumnos, conceptos, pagos, user, atrasadosMap });

  // Preparar datos para mostrar
  const pagosMap = {};
  const estadosMap = {};
  
  // Organizar pagos en formato de mapa para acceso rápido
  pagos.forEach(p => {
    // Volvemos a la lógica de usar p.usuario_id, asumiendo que el backend lo proveerá
    if (p.usuario_id !== undefined) { // Verificar que la propiedad exista
      if (!pagosMap[p.usuario_id]) {
        pagosMap[p.usuario_id] = {};
        estadosMap[p.usuario_id] = {};
      }
      pagosMap[p.usuario_id][p.concepto_id] = p.monto;
      estadosMap[p.usuario_id][p.concepto_id] = p.estado;
    } else {
      console.warn('[PagosTable] Objeto de pago SIN usuario_id definido:', p);
    }
  });
  console.log('[PagosTable] pagosMap construido esperando p.usuario_id:', pagosMap);
  
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
    const estadoOriginal = estadosMap[alumnoId]?.[conceptoId]; 
    // Mantener el console.log original por si acaso, pero añadir uno más específico.
    // console.log(`DEBUG PagosTable -> Alumno: ${alumnoId}, Concepto: ${conceptoId}, Estado RECIBIDO: '${estadoOriginal}'`); 

    if (estadoOriginal === 'pagado') {
      // console.log(`DEBUG PagosTable -> Alumno: ${alumnoId}, Concepto: ${conceptoId}, Clase: pago-completado (por estadoOriginal)`);
      return 'pago-completado';
    }

    // Nueva lógica: Primero chequear el atrasadosMap
    if (atrasadosMap && atrasadosMap[alumnoId]?.[conceptoId]) {
      // console.log(`DEBUG PagosTable -> Alumno: ${alumnoId}, Concepto: ${conceptoId}, Clase: pago-atrasado (por atrasadosMap)`);
      return 'pago-atrasado';
    }
    
    // Si no está pagado y no está en atrasadosMap, ver si el estado original es 'pendiente'
    if (estadoOriginal === 'pendiente') { 
      // console.log(`DEBUG PagosTable -> Alumno: ${alumnoId}, Concepto: ${conceptoId}, Clase: pago-pendiente (por estadoOriginal)`);
      return 'pago-pendiente';
    }
    
    // console.log(`DEBUG PagosTable -> Alumno: ${alumnoId}, Concepto: ${conceptoId}, Clase: '' (ninguna condición cumplida)`);
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
  
  const handleDeletePago = (alumnoId, conceptoId) => {
    // Lógica para eliminar el pago
    console.log(`Eliminar pago para Alumno: ${alumnoId}, Concepto: ${conceptoId}`);
    // Aquí puedes añadir la lógica para eliminar el pago del estado o hacer una llamada a la API
  };

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
                      onClick={(e) => user.rol_id === 3 && onCellClick(e, alumno.id, concepto.id)}
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