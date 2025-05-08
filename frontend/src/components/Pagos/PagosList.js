import React, { useEffect, useState, useRef } from 'react';
import { FaMoneyBillWave, FaCheckCircle, FaHourglassHalf, FaExclamationTriangle } from 'react-icons/fa';
import { useToast } from '../Layout/ToastProvider';
import './PagosStyles.css';
import './TableScroll.css';
import { setupScrollSync, fixStickyColumn } from './ScrollSync';

export default function PagosList({ user, refresh, onPagosChange, isPagoAtrasado, pagosAtrasadosMap, mesesMap, formatoMoneda = { maximumFractionDigits: 0 } }) {
  const [alumnos, setAlumnos] = useState([]);
  const [conceptos, setConceptos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [editCell, setEditCell] = useState({ alumnoId: null, conceptoId: null });
  const [editMonto, setEditMonto] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  
  // Referencias para las barras de desplazamiento
  const topScrollRef = useRef(null);
  const mainScrollRef = useRef(null);

  // Determinar mes actual para validaciones
  const mesActual = new Date().getMonth() + 1; // Los meses en JS son 0-11

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    // Realizar la solicitud sin verificar token primero
    const fetchData = async () => {
      try {
        // Force cache refresh by adding timestamp to URL
        const timestamp = new Date().getTime();
        const [alumnosRes, conceptosRes, pagosRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/apoderados?t=${timestamp}`),
          fetch(`${process.env.REACT_APP_API_URL}/conceptos?t=${timestamp}`),
          fetch(`${process.env.REACT_APP_API_URL}/pagos?t=${timestamp}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          })
        ]);

        // Procesar las respuestas independientemente si hay errores de autorización
        const alumnosData = alumnosRes.ok ? await alumnosRes.json() : [];
        const conceptosData = conceptosRes.ok ? await conceptosRes.json() : [];
        const pagosData = pagosRes.ok ? await pagosRes.json() : [];

        // Depuración de conceptos
        console.log("Conceptos cargados en PagosList:", conceptosData);
        console.log("Conceptos personalizados:", conceptosData.filter(c => c.orden === 0));
        console.log("Pagos atrasados Map recibido:", pagosAtrasadosMap);

        setAlumnos(alumnosData);
        setConceptos(conceptosData);
        setPagos(pagosData);
        setLoading(false);
        
        // Aplicar arreglo en la próxima renderización
        setTimeout(() => {
          fixStickyColumn();
        }, 200);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [refresh, pagosAtrasadosMap]);
  
  // Efecto para sincronizar las barras de desplazamiento
  useEffect(() => {
    if (loading) return; // No sincronizar mientras está cargando
    
    let cleanupFunction = null;
    
    // Función para aplicar los estilos y la sincronización
    const applyStyles = () => {
      // Configurar la sincronización de desplazamiento
      cleanupFunction = setupScrollSync(topScrollRef, mainScrollRef);
      
      // Arreglar los estilos de la columna sticky
      fixStickyColumn();
      
      // Asegurarse de que la tabla principal tenga el ancho adecuado
      if (mainScrollRef.current) {
        const table = mainScrollRef.current.querySelector('table');
        if (table) {
          // Calcular el ancho total necesario para la tabla
          const requiredWidth = Math.max(1500, conceptos.length * 120 + 300);
          table.style.width = `${requiredWidth}px`;
          
          // Actualizar el ancho del contenedor de scroll superior
          if (topScrollRef.current) {
            const scrollInner = topScrollRef.current.querySelector('.tabla-scroll-inner');
            if (scrollInner) {
              scrollInner.style.width = `${requiredWidth}px`;
            }
          }
        }
      }
    };
    
    // Aplicar los estilos con un pequeño retraso para asegurar que los componentes estén renderizados
    const timeoutId = setTimeout(applyStyles, 300);
    
    // Aplicar los estilos cada segundo para mantener la sincronización
    const intervalId = setInterval(applyStyles, 1000);
    
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      if (cleanupFunction) cleanupFunction();
    };
  }, [loading, conceptos.length, alumnos.length]);

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

  // Determinar el estado de una celda (si es atrasada)
  const getCellClass = (alumnoId, conceptoId, conceptoNombre) => {
    // Si está en edición, ninguna clase especial
    if (editCell.alumnoId === alumnoId && editCell.conceptoId === conceptoId) {
      return '';
    }
    
    // Si hay un pago y está pagado
    if (pagosEstadoMap[alumnoId]?.[conceptoId] === 'pagado') {
      return 'pago-completado';
    }
    
    // Para depuración - imprimir en la consola si el pago está en el mapa de atrasados
    if (pagosAtrasadosMap && pagosAtrasadosMap[alumnoId]?.[conceptoId]) {
      console.log(`Celda (${alumnoId},${conceptoId}) marcada como atrasada`);
    }
    
    // Si es un pago atrasado (utilizando el mapa proporcionado)
    // Aquí priorizamos el mapa de atrasados sobre cualquier otra condición
    if (pagosAtrasadosMap && pagosAtrasadosMap[alumnoId]?.[conceptoId]) {
      return 'pago-atrasado';
    }
    
    // Verificar si es un mes pasado (como MAR o ABR)
    if (mesesMap && mesesMap[conceptoNombre] && mesesMap[conceptoNombre] < mesActual) {
      console.log(`Mes ${conceptoNombre} (${mesesMap[conceptoNombre]}) es anterior al mes actual (${mesActual})`);
      return 'pago-atrasado';
    }
    
    // Si hay un monto pero no está pagado (pendiente)
    if (pagosMap[alumnoId]?.[conceptoId]) {
      return 'pago-pendiente';
    }
    
    // Para conceptos específicos MAM
    if (conceptoNombre === 'MAM') {
      console.log("Encontrado concepto MAM - marcando como atrasado");
      return 'pago-atrasado';
    }
    
    return '';
  };

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
    setEditMonto(pagosMap[alumnoId] && pagosMap[alumnoId][conceptoId] ? pagosMap[alumnoId][conceptoId] : '');
  };

  const handleCellSave = async (alumnoId, conceptoId) => {
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
      
      setEditCell({ alumnoId: null, conceptoId: null });
      setEditMonto('');
      toast.showToast('Pago guardado correctamente', 'success');
      
      // Actualizar los pagos localmente para mostrar el cambio inmediatamente
      if (!pagosEstadoMap[alumnoId]) {
        pagosEstadoMap[alumnoId] = {};
      }
      pagosEstadoMap[alumnoId][conceptoId] = 'pagado';
      
      if (!pagosMap[alumnoId]) {
        pagosMap[alumnoId] = {};
      }
      pagosMap[alumnoId][conceptoId] = montoEntero;
      
      // Actualizar las clases de estado en las celdas
      setTimeout(() => {
        fixStickyColumn();
      }, 100);
      
      if (onPagosChange) onPagosChange();
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.showToast('Error de conexión', 'error');
    }
  };

  const handleCellCancel = () => {
    setEditCell({ alumnoId: null, conceptoId: null });
    setEditMonto('');
  };

  const handleKeyDown = (e, alumnoId, conceptoId) => {
    // Guardar con Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCellSave(alumnoId, conceptoId);
    }
    // Cancelar con Escape
    else if (e.key === 'Escape') {
      e.preventDefault();
      handleCellCancel();
    }
  };

  // Función para formatear el monto sin decimales
  const formatearMonto = (monto) => {
    if (!monto) return '—';
    // Asegurarse de que el monto es un número
    const montoNumero = Number(monto);
    if (isNaN(montoNumero)) return '—';
    // Redondear a entero y formatear sin decimales
    const montoEntero = Math.round(montoNumero);
    return `$${montoEntero.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`;
  };

  if (loading) {
    return <div>Cargando pagos...</div>
  }

  // Imprimir el estado de los pagos atrasados para depuración
  console.log("Renderizando tabla con pagosAtrasadosMap:", pagosAtrasadosMap);

  // Ordenar los conceptos
  const conceptosOrdenados = [...conceptos].sort((a, b) => {
    // Primero ordenar por orden (los meses estándar tienen orden definido)
    // Los conceptos personalizados (orden 0 o null) se ordenan PRIMERO
    if (a.orden !== b.orden) {
      // Si alguno es personalizado (orden 0 o null)
      if (a.orden === 0 || a.orden === null) return -1; // a va antes
      if (b.orden === 0 || b.orden === null) return 1; // b va antes
      return a.orden - b.orden;
    }
    // Luego ordenar alfabéticamente
    return a.nombre.localeCompare(b.nombre);
  });

  return (
    <div>
      <h3 className="pagos-titulo">Tabla de Pagos por Alumno y Concepto</h3>
      <div className="tabla-contenedor">
        {/* Barra de desplazamiento superior */}
        <div className="tabla-scroll-container tabla-scroll-top" ref={topScrollRef}>
          <div className="tabla-scroll-inner" style={{ 
            width: `${Math.max(conceptos.length * 120 + 300, 1500)}px`
          }}></div>
        </div>
        
        {/* Tabla con barra de desplazamiento inferior */}
        <div className="tabla-scroll-container tabla-scroll-main" ref={mainScrollRef}>
          <table className="pagos-table">
            <thead>
              <tr>
                <th className="sticky-col">Alumno</th>
                {conceptosOrdenados.map(con => (
                  <th key={con.id}>{(con.nombre || '').slice(0, 3)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alumnos.map(al => (
                <tr key={al.id}>
                  <td className="sticky-col">
                    {al.nombre}
                  </td>
                  {conceptosOrdenados.map(con => {
                    // Usar la función getCellClass mejorada que incluye validación de meses pasados
                    const cellClass = getCellClass(al.id, con.id, con.nombre);
                      
                    return (
                      <td 
                        key={con.id} 
                        className={`${user.rol_id === 3 ? 'editable' : ''} ${cellClass}`}
                        onClick={() => user.rol_id === 3 && handleCellClick(al.id, con.id)}
                        data-concepto-nombre={con.nombre}
                      >
                        {editCell.alumnoId === al.id && editCell.conceptoId === con.id ? (
                          <div className="edit-cell-container">
                            <input
                              type="number"
                              value={editMonto}
                              onChange={e => setEditMonto(e.target.value)}
                              onKeyDown={e => handleKeyDown(e, al.id, con.id)}
                              autoFocus
                            />
                            <div className="edit-cell-actions">
                              <button 
                                className="save-button"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleCellSave(al.id, con.id);
                                }}
                              >
                                Guardar
                              </button>
                              <button 
                                className="cancel-button"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleCellCancel();
                                }}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="monto-celda">
                            {formatearMonto(pagosMap[al.id]?.[con.id])}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
    </div>
  );
}