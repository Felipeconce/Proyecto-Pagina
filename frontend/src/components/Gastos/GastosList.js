import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import styles from './GastosPage.module.css';

const GastosList = forwardRef(({ user }, ref) => {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editMonto, setEditMonto] = useState('');
  const [editFecha, setEditFecha] = useState('');
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Función para recargar los gastos
  const loadGastos = () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    
    fetch(`${process.env.REACT_APP_API_URL}/gastos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Error al cargar los gastos');
        }
        return res.json();
      })
      .then(data => {
        // Asegurarse de que data sea un array
        const gastosArray = Array.isArray(data) ? data : [];
        setGastos(gastosArray);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setError('No se pudieron cargar los gastos');
        setGastos([]);
        setLoading(false);
      });
  };

  // Función para forzar recarga
  const reloadGastos = () => {
    setLastUpdate(Date.now());
  };

  // Exponer método reloadGastos a través de ref
  useImperativeHandle(ref, () => ({
    reloadGastos
  }));

  // Cargar gastos cuando cambie lastUpdate
  useEffect(() => {
    loadGastos();
  }, [lastUpdate]);

  const startEdit = (gasto) => {
    setEditId(gasto.id);
    setEditDescripcion(gasto.descripcion);
    setEditMonto(gasto.monto);
    setEditFecha(gasto.fecha);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/gastos/${editId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          descripcion: editDescripcion,
          monto: Number(editMonto),
          fecha: editFecha,
          usuario_id: user.id,
          usuario_nombre: user.nombre,
          rol_id: user.rol_id,
          curso_id: user.curso_id,
          colegio_id: user.colegio_id
        }),
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar cambios');
      }
      
      setEditId(null);
      
      // Recargar la lista de gastos
      reloadGastos();
    } catch (err) {
      console.error('Error al guardar:', err);
    }
  };

  const cancelEdit = () => {
    setEditId(null);
  };

  // Efecto para volver a cargar los gastos cada 10 segundos (solo si hay usuario)
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        reloadGastos();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  if (loading) {
    return <p className={styles.successMsg}>Cargando gastos...</p>;
  }

  if (error) {
    return (
      <div>
        <p className={styles.errorMsg}>{error}</p>
        <button onClick={reloadGastos} className="btn-principal">Reintentar</button>
      </div>
    );
  }

  return (
    <div>
      {gastos.length === 0 ? (
        <div>
          <p className={styles.successMsg}>No hay gastos registrados</p>
          <button onClick={reloadGastos} className="btn-principal">Actualizar</button>
        </div>
      ) : (
        <div className="table-container">
          <button onClick={reloadGastos} className="btn-principal" style={{marginBottom:12}}>
            <i className="fa fa-refresh"></i> Actualizar listado
          </button>
          <table className="table-modern gastos-table">
            <thead>
              <tr>
                <th className="text-left">Descripción</th>
                <th className="text-center">Monto</th>
                <th className="text-center">Fecha</th>
                {user && user.rol_id === 3 && <th className="text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {gastos.map(gasto => (
                <tr key={gasto.id}>
                  <td className="text-left">{gasto.descripcion}</td>
                  <td className="text-center">${Number(gasto.monto).toLocaleString('es-CL')}</td>
                  <td className="text-center">{new Date(gasto.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                  {user && user.rol_id === 3 && (
                    <td className="text-center">
                      <button onClick={() => startEdit(gasto)} className="btnTable">Editar</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

export default GastosList;