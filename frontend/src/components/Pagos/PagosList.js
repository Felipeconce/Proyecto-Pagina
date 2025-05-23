import React, { useEffect, useState, useRef } from 'react';
import { FaMoneyBillWave, FaCheckCircle, FaHourglassHalf, FaExclamationTriangle } from 'react-icons/fa';
import { useToast } from '../Layout/ToastProvider';
import PagosTable from './PagosTable';

export default function PagosList({ user, refresh, onPagosChange, isPagoAtrasado, pagosAtrasadosMap, mesesMap, formatoMoneda = { maximumFractionDigits: 0 } }) {
  const [alumnos, setAlumnos] = useState([]);
  const [conceptos, setConceptos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [editCell, setEditCell] = useState({ 
    alumnoId: null, 
    conceptoId: null, 
    top: 0, 
    left: 0, 
    cellWidth: 0, 
    cellHeight: 0, 
    visible: false 
  });
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

  const handleCellClick = (e, alumnoId, conceptoId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.showToast('Debes iniciar sesión para editar pagos', 'error');
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    // Intentar obtener el contenedor '.pagos-container' más cercano
    const pagosContainerElement = e.currentTarget.closest('.pagos-container');

    if (!pagosContainerElement) {
      console.error("No se pudo encontrar el elemento .pagos-container");
      // Fallback o manejo de error si no se encuentra el contenedor
      setEditCell({
        alumnoId,
        conceptoId,
        top: rect.top + window.scrollY, // Comportamiento anterior como fallback
        left: rect.left + window.scrollX,
        cellWidth: rect.width,
        cellHeight: rect.height,
        visible: true
      });
      const pagoExistenteFallback = pagos.find(p => p.usuario_id === alumnoId && p.concepto_id === conceptoId);
      setEditMonto(pagoExistenteFallback && typeof pagoExistenteFallback.monto !== 'undefined' ? String(pagoExistenteFallback.monto) : '');
      return;
    }

    const containerRect = pagosContainerElement.getBoundingClientRect();

    setEditCell({
      alumnoId,
      conceptoId,
      top: rect.top - containerRect.top, // Relativo al contenedor
      left: rect.left - containerRect.left, // Relativo al contenedor
      cellWidth: rect.width,
      cellHeight: rect.height,
      visible: true
    });

    const pagoExistente = pagos.find(p => p.usuario_id === alumnoId && p.concepto_id === conceptoId);
    setEditMonto(pagoExistente && typeof pagoExistente.monto !== 'undefined' ? String(pagoExistente.monto) : '');
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
        // El servidor respondió con un error (4xx o 5xx)
        let errorMessage = `Error del servidor (${res.status})`;
        try {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json') && res.body) {
            const errorBody = await res.json();
            errorMessage = errorBody.message || `${errorMessage}: ${JSON.stringify(errorBody)}`;
          } else {
            const errorText = await res.text();
            if (errorText) errorMessage = `${errorMessage}: ${errorText}`;
          }
        } catch (e) {
          console.warn("No se pudo parsear el cuerpo del error (o no era JSON):", e, res.status);
        }
        toast.showToast(errorMessage, 'error');
        // NO actualizar el estado local si el servidor devuelve un error
        return; 
      }
      
      // Si llegamos aquí, res.ok es true
      let pagoActualizadoParaEstado = null;

      if (res.status === 204) { 
        console.log("Pago actualizado en el servidor (204 No Content)");
        if (pagoExistente) {
            pagoActualizadoParaEstado = {
                ...pagoExistente, 
                monto: montoEntero,    
                estado: 'pagado',      
                fecha: payload.fecha, 
                usuario_nombre: payload.usuario_nombre,
            };
        } else {
            pagoActualizadoParaEstado = {
                id: Date.now(), 
                usuario_id: alumnoId,
                concepto_id: conceptoId,
                ...payload
            };
        }
      } else { // Para 200 OK con cuerpo JSON
        const pagoGuardadoDelServidor = await res.json(); 
        console.log("Pago guardado/actualizado en el servidor (con cuerpo JSON):", pagoGuardadoDelServidor);
        pagoActualizadoParaEstado = pagoGuardadoDelServidor;
      }

      // Actualizar localmente el estado de 'pagos'
      let nuevosPagos = [...pagos];
      const index = nuevosPagos.findIndex(p => 
        (pagoExistente && p.id === pagoExistente.id) || 
        (!pagoExistente && pagoActualizadoParaEstado && pagoActualizadoParaEstado.id && p.id === pagoActualizadoParaEstado.id) 
      );
      
      if (index >= 0 && pagoActualizadoParaEstado) { 
        nuevosPagos[index] = pagoActualizadoParaEstado;
      } else if (!pagoExistente && pagoActualizadoParaEstado) { 
        nuevosPagos.push(pagoActualizadoParaEstado);
      } else {
        if (pagoExistente) {
            const fallbackIndex = nuevosPagos.findIndex(p => p.usuario_id === alumnoId && p.concepto_id === conceptoId);
            if (fallbackIndex >= 0) {
                nuevosPagos[fallbackIndex] = {
                    ...nuevosPagos[fallbackIndex],
                    monto: montoEntero,
                    estado: 'pagado'
                };
            }
        } else {
             // Si es un nuevo pago y no tenemos un ID del servidor, añadirlo con los datos del payload
            nuevosPagos.push({
                id: Date.now(), // ID Temporal
                usuario_id: alumnoId,
                concepto_id: conceptoId,
                monto: montoEntero,
                fecha: payload.fecha,
                estado: 'pagado',
                usuario_nombre: user.nombre,
                rol_id: user.rol_id,
                curso_id: user.curso_id,
                colegio_id: user.colegio_id
            });
        }
        console.warn("No se pudo actualizar el pago en el estado local de forma ideal, usando fallback si es posible.");
      }
      
      setPagos(nuevosPagos);
      setEditCell({ ...editCell, visible: false });
      setEditMonto('');
      toast.showToast('Pago guardado correctamente', 'success');
      
      if (onPagosChange) {
        console.log("Forzando actualización de datos...");
        setTimeout(() => { onPagosChange(); }, 100);
        setTimeout(() => { onPagosChange(); }, 500);
        setTimeout(() => {
            const verificarPago = async () => {
                try {
                    const idParaVerificar = pagoExistente ? pagoExistente.id : (pagoActualizadoParaEstado ? pagoActualizadoParaEstado.id : null);
                    if (idParaVerificar) {
                        const verificarRes = await fetch(`${process.env.REACT_APP_API_URL}/pagos/${idParaVerificar}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (verificarRes.ok) { onPagosChange(); }
                    }
                } catch (err) { console.error("Error verificando pago:", err); }
            };
            verificarPago();
        }, 1000);
      }
    } catch (error) {
      console.error("Error al guardar (catch general):", error);
      let toastMessage = 'Error de conexión o respuesta inesperada del servidor.';
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')){
        toastMessage = 'Error de red al intentar conectar con el servidor.';
      } else if (error.message && error.message.toLowerCase().includes('json')) {
        // Este caso es si res.ok era true, pero res.json() falló (ej. cuerpo vacío con status 200)
        toastMessage = 'Respuesta del servidor exitosa pero con formato inesperado.';
      }
      toast.showToast(toastMessage, 'error');
    }
  };

  const handleCellCancel = () => {
    setEditCell({ ...editCell, visible: false }); // Solo ocultar
    // O resetear completamente:
    // setEditCell({ alumnoId: null, conceptoId: null, top: 0, left: 0, cellWidth: 0, cellHeight: 0, visible: false });
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

  // Nueva función para eliminar el pago
  const handleCellDelete = async () => {
    const { alumnoId, conceptoId } = editCell;
    if (!alumnoId || !conceptoId) return;
    const pagoExistente = pagos.find(p => p.usuario_id === alumnoId && p.concepto_id === conceptoId);
    if (!pagoExistente) {
      toast.showToast('No hay pago para eliminar', 'error');
      setEditCell({ ...editCell, visible: false });
      setEditMonto('');
      if (onPagosChange) onPagosChange();
      return;
    }
    if (!window.confirm('¿Seguro que deseas eliminar este pago?')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.showToast('No estás autenticado', 'error');
        return;
      }
      const res = await fetch(`${process.env.REACT_APP_API_URL}/pagos/${pagoExistente.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.showToast('Pago eliminado correctamente', 'success');
      } else {
        toast.showToast('Error al eliminar el pago', 'error');
      }
    } catch (err) {
      console.error('Error al eliminar el pago:', err);
      toast.showToast('Error de conexión o respuesta inesperada', 'error');
    }
    setEditCell({ ...editCell, visible: false });
    setEditMonto('');
    if (onPagosChange) onPagosChange();
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
          className="btn btn-secondary"
        >
          Intentar nuevamente
        </button>
      </div>
    );
  }

  // Verificar si hay datos para mostrar
  const hayDatos = alumnos.length > 0 && conceptos.length > 0;

  if (editCell.visible) {
    console.log('[PagosList] Coordenadas y datos para el popup:', editCell);
  }

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
      
      {/* Popup de edición */}
      {editCell.visible && (
        <div
          className="edit-pago-popup"
          style={{
            top: `${editCell.top + editCell.cellHeight + 2}px`,
            left: `${editCell.left}px`,
          }}
        >
          <h3>Editar Pago</h3>
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
              className="btn btn-primary btn-small"
              onClick={handleCellSave}
              disabled={!editMonto || Number(editMonto) <= 0}
            >
              Guardar
            </button>
            <button 
              className="btn btn-secondary btn-small"
              onClick={handleCellCancel}
            >
              Cancelar
            </button>
            <button
              className="btn btn-danger btn-small"
              onClick={handleCellDelete}
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}