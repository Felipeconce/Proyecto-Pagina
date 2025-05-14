import React, { useEffect, useState, useRef } from 'react';
import { FaMoneyBillWave, FaCheckCircle, FaHourglassHalf, FaExclamationTriangle } from 'react-icons/fa';
import { useToast } from '../Layout/ToastProvider';
import PagosTable from './PagosTable';

export default function PagosList({ user, refresh, onPagosChange, isPagoAtrasado, pagosAtrasadosMap, mesesMap, formatoMoneda = { maximumFractionDigits: 0 } }) {
  const [alumnos, setAlumnos] = useState([]);
  const [conceptos, setConceptos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [editCell, setEditCell] = useState({ alumnoId: null, conceptoId: null });
  const [editMonto, setEditMonto] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();
  
  // Determinar mes actual para validaciones
  const mesActual = new Date().getMonth() + 1; // Los meses en JS son 0-11

  useEffect(() => {
    // Mostrar spinner de carga
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('token');
    
    // Función para manejar errores de fetch
    const handleFetchError = (err, entidad) => {
      console.error(`Error cargando ${entidad}:`, err);
      setError(`No se pudieron cargar los ${entidad}. ${err.message}`);
      return [];
    };
    
    // Cargar pagos
    const fetchPagos = fetch(`${process.env.REACT_APP_API_URL}/pagos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Error al cargar pagos (${res.status})`);
        }
        return res.json();
      })
      .then(data => {
        // Asegurar que siempre sea un array
        return Array.isArray(data) ? data : [];
      })
      .catch(err => handleFetchError(err, 'pagos'));
    
    // Cargar conceptos
    const fetchConceptos = fetch(`${process.env.REACT_APP_API_URL}/conceptos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Error al cargar conceptos (${res.status})`);
        }
        return res.json();
      })
      .then(data => {
        // Asegurar que siempre sea un array
        return Array.isArray(data) ? data : [];
      })
      .catch(err => handleFetchError(err, 'conceptos'));

    // Cargar apoderados
    const fetchAlumnos = fetch(`${process.env.REACT_APP_API_URL}/apoderados`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Error al cargar apoderados (${res.status})`);
        }
        return res.json();
      })
      .then(data => {
        // Asegurar que siempre sea un array
        return Array.isArray(data) ? data : [];
      })
      .catch(err => handleFetchError(err, 'apoderados'));
    
    // Esperar a que todas las consultas terminen
    Promise.all([fetchPagos, fetchConceptos, fetchAlumnos])
      .then(([pagosData, conceptosData, alumnosData]) => {
        setPagos(pagosData);
        setConceptos(conceptosData);
        setAlumnos(alumnosData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error general al cargar datos:', err);
        setError('Ocurrió un error al cargar los datos. Por favor, intente nuevamente.');
        setLoading(false);
      });
  }, [refresh]); // Agregamos refresh para poder recargar cuando sea necesario

  // Construir un mapa: pagos[alumnoId][conceptoId] = monto
  const pagosMap = {};
  // Añadir un mapa para rastrear el estado de los pagos
  const pagosEstadoMap = {};
  
  pagos.forEach(p => {
    if (!pagosMap[p.usuario_id]) {
      pagosMap[p.usuario_id] = {};
      pagosEstadoMap[p.usuario_id] = {};
    }
    pagosMap[p.usuario_id][p.concepto_id] = p.monto;
    pagosEstadoMap[p.usuario_id][p.concepto_id] = p.estado;
  });

  const handleCellClick = (alumnoId, conceptoId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.showToast('Debes iniciar sesión para editar pagos', 'error');
      return;
    }
    
    // Si ya estamos editando, guardar ese valor primero
    if (editCell.alumnoId !== null && editCell.conceptoId !== null) {
      handleCellCancel();
    }
    
    setEditCell({ alumnoId, conceptoId });
    
    // Buscar el pago existente
    const pagoExistente = pagos.find(p => p.usuario_id === alumnoId && p.concepto_id === conceptoId);
    setEditMonto(pagoExistente ? pagoExistente.monto : '');
  };

  const handleCellSave = async () => {
    const { alumnoId, conceptoId } = editCell;
    
    if (!alumnoId || !conceptoId) return;
    
    if (!editMonto || isNaN(editMonto) || Number(editMonto) <= 0) {
      toast.showToast('El monto debe ser mayor a 0', 'error');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.showToast('No estás autenticado', 'error');
        return;
      }
      
      const pagoExistente = pagos.find(p => p.usuario_id === alumnoId && p.concepto_id === conceptoId);
      
      // Convertir el monto a entero
      const montoEntero = Math.round(Number(editMonto));
      
      const payload = {
        monto: montoEntero,
        fecha: pagoExistente ? pagoExistente.fecha : new Date().toISOString().slice(0, 10),
        estado: 'pagado',
        usuario_nombre: user.nombre,
        rol_id: user.rol_id,
        curso_id: user.curso_id,
        colegio_id: user.colegio_id
      };
      
      let res;
      if (pagoExistente) {
        res = await fetch(`${process.env.REACT_APP_API_URL}/pagos/${pagoExistente.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${process.env.REACT_APP_API_URL}/pagos`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({
            usuario_id: alumnoId,
            concepto_id: conceptoId,
            ...payload
          }),
        });
      }
      
      if (!res.ok) {
        const error = await res.json();
        toast.showToast(error.message || 'Error al guardar el pago', 'error');
        return;
      }
      
      // Obtener la respuesta del servidor para asegurar datos correctos
      const pagoGuardado = await res.json();
      console.log("Pago guardado en el servidor:", pagoGuardado);
      
      // Actualizar localmente con el dato devuelto por el servidor
      let nuevosPagos = [...pagos];
      const index = nuevosPagos.findIndex(p => p.usuario_id === alumnoId && p.concepto_id === conceptoId);
      
      if (index >= 0) {
        nuevosPagos[index] = {
          ...nuevosPagos[index],
          monto: montoEntero,
          estado: 'pagado'
        };
      } else {
        // Usar el ID devuelto por el servidor si es un nuevo pago
        nuevosPagos.push({
          id: pagoGuardado?.id || Date.now(), // ID del servidor o temporal
          usuario_id: alumnoId,
          concepto_id: conceptoId,
          monto: montoEntero,
          fecha: new Date().toISOString().slice(0, 10),
          estado: 'pagado',
          usuario_nombre: user.nombre,
          rol_id: user.rol_id,
          curso_id: user.curso_id,
          colegio_id: user.colegio_id
        });
      }
      
      // Actualizar el estado local
      setPagos(nuevosPagos);
      setEditCell({ alumnoId: null, conceptoId: null });
      setEditMonto('');
      toast.showToast('Pago guardado correctamente', 'success');
      
      // IMPORTANTE: Forzar actualización de datos completa con múltiples enfoques
      if (onPagosChange) {
        console.log("Forzando actualización de datos...");
        
        // Usar un temporizador escalonado para dar tiempo al backend y a React
        setTimeout(() => {
          onPagosChange(); // Primera llamada
          
          // Segunda llamada después de un tiempo para asegurar actualización
          setTimeout(() => {
            onPagosChange();
          }, 500);
        }, 100);
        
        // También recargar después de una transición completa
        setTimeout(() => {
          // Verificar si hay cambios pendientes antes de la recarga final
          const verificarPago = async () => {
            try {
              const verificarRes = await fetch(`${process.env.REACT_APP_API_URL}/pagos/${pagoGuardado?.id || ''}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              if (verificarRes.ok) {
                // Si la verificación es exitosa, forzar actualización final
                onPagosChange();
              }
            } catch (err) {
              console.error("Error verificando pago:", err);
            }
          };
          
          // Ejecutar verificación solo si tenemos un ID
          if (pagoGuardado?.id) {
            verificarPago();
          } else {
            // Si no tenemos ID, simplemente actualizar
            onPagosChange();
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.showToast('Error de conexión', 'error');
    }
  };

  const handleCellCancel = () => {
    setEditCell({ alumnoId: null, conceptoId: null });
    setEditMonto('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCellSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCellCancel();
    }
  };

  // Estados de carga y error
  if (loading) {
    return (
      <div className="estado-carga">
        <div className="spinner"></div>
        <p>Cargando pagos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="estado-error">
        <FaExclamationTriangle style={{fontSize: '1.5rem', color: '#ef4444'}} />
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="btn-retry"
        >
          Intentar nuevamente
        </button>
      </div>
    );
  }

  // Verificar si hay datos para mostrar
  const hayDatos = alumnos.length > 0 && conceptos.length > 0;

  return (
    <div className="pagos-container">
      <h3 className="pagos-titulo">
        Tabla de Pagos por Alumno y Concepto
      </h3>
      
      {!hayDatos ? (
        <div className="no-data">
          <p>No hay datos de pagos disponibles. Verifique que existan alumnos y conceptos de pago registrados.</p>
        </div>
      ) : (
        <>
          <div className="tabla-pagos-wrapper">
            <PagosTable 
              alumnos={alumnos} 
              conceptos={conceptos} 
              pagos={pagos} 
              user={user} 
              onCellClick={handleCellClick} 
              atrasadosMap={pagosAtrasadosMap}
            />
          </div>
          
          {/* Leyenda de colores */}
          <div className="pagos-leyenda">
            <div className="leyenda-item">
              <div className="leyenda-color pagado"></div>
              <span>Pagado</span>
            </div>
            <div className="leyenda-item">
              <div className="leyenda-color pendiente"></div>
              <span>Pendiente</span>
            </div>
            <div className="leyenda-item">
              <div className="leyenda-color atrasado"></div>
              <span>Atrasado</span>
            </div>
          </div>
        </>
      )}
      
      {/* Modal de edición de pagos */}
      {editCell.alumnoId !== null && editCell.conceptoId !== null && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>
              Editar Pago
            </h3>
            <input
              type="number"
              value={editMonto}
              onChange={e => setEditMonto(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Monto"
              className="modal-input"
              autoFocus
            />
            <div className="modal-actions">
              <button 
                className="btn-guardar"
                onClick={handleCellSave}
              >
                Guardar
              </button>
              <button 
                className="btn-cancelar"
                onClick={handleCellCancel}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}