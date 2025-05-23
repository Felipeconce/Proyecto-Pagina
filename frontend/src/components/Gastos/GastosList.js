import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import styles from './GastosPage.module.css';

const fetchComprobante = async (gastoId, comprobanteUrl) => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('No autenticado. Por favor, inicia sesión nuevamente.');
    return;
  }

  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/gastos/${gastoId}/comprobante`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error al descargar comprobante:', response.status, errorText);
      alert(`Error al descargar comprobante: ${response.status} ${response.statusText}`);
      return;
    }

    const blob = await response.blob(); // Obtener los datos del archivo como Blob
    const url = URL.createObjectURL(blob); // Crear una URL temporal para el Blob

    // Determinar el nombre del archivo (puede que necesitemos obtenerlo del backend en una cabecera si la URL es genérica)
    // Por ahora, intentemos extraerlo de la URL guardada, pero puede no ser el nombre original exacto
    const filename = comprobanteUrl.split('/').pop();

    // Crear un enlace temporal para descargar el archivo
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'comprobante_gasto'; // Usar el nombre extraído o un nombre por defecto
    document.body.appendChild(a); // Añadir el enlace al DOM (necesario para firefox)
    a.click(); // Simular un clic en el enlace

    // Limpiar: remover el enlace y revocar la URL temporal
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error en la solicitud de descarga:', error);
    alert('Error al intentar descargar el comprobante.');
  }
};

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
    console.log('loadGastos() triggered');
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

  // Función para eliminar un gasto
  const handleDeleteGasto = async (gastoId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este gasto?')) {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No autenticado.');
        return;
      }
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/gastos/${gastoId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al eliminar el gasto.');
        }

        // Actualizar la lista de gastos después de eliminar
        reloadGastos(); // Opcional: llamar a reloadGastos para forzar la recarga completa
        // Alternativa: actualizar el estado local eliminando el gasto
        // setGastos(gastos.filter(gasto => gasto.id !== gastoId));
        console.log(`reloadGastos() called after successful deletion of gasto ID ${gastoId}`);

        alert('Gasto eliminado con éxito.');

      } catch (error) {
        console.error('Error eliminando gasto:', error);
        alert(`Error al eliminar gasto: ${error.message}`);
      }
    }
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
    return (
      <div className={styles.successMsg}>Cargando gastos...</div>
    );
  }

  if (error) {
    return (
      <div>
        <p className={styles.errorMsg}>{error}</p>
        <button onClick={reloadGastos} className="btn btn-secondary">Reintentar</button>
      </div>
    );
  }

  return (
    <div>
      {gastos.length === 0 ? (
        <div>
          <p className={styles.successMsg}>No hay gastos registrados</p>
          <button onClick={reloadGastos} className="btn btn-primary">Actualizar</button>
        </div>
      ) : (
        <div className="table-container">
          <button onClick={reloadGastos} className="btn btn-primary" style={{marginBottom:12}}>
            <i className="fa fa-refresh"></i> Actualizar listado
          </button>
          <table className="table-modern gastos-table">
            <thead>
              <tr>
                <th className="text-left" style={{ width: '37%' }}>Descripción</th>
                <th className="text-center" style={{ width: '15%' }}>Monto</th>
                <th className="text-center" style={{ width: '15%' }}>Fecha</th>
                <th className="text-center" style={{ width: '15%' }}>Comprobante</th>
                {user && user.rol_id === 3 && <th className="text-center" style={{ width: '18%' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {gastos.map(gasto => (
                <tr key={gasto.id}>
                  <td className="text-left">{gasto.descripcion}</td>
                  <td className="text-center">${Number(gasto.monto).toLocaleString('es-CL')}</td>
                  <td className="text-center">{new Date(gasto.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                  <td className="text-center">
                    {gasto.comprobante_url ? (
                      <a 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          fetchComprobante(gasto.id, gasto.comprobante_url);
                        }}
                        className="btn btn-secondary btn-small"
                      >
                        Descargar
                      </a>
                    ) : (
                      <span>N/A</span>
                    )}
                  </td>
                  {user && user.rol_id === 3 && (
                    <td className="text-center">
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        <button 
                          onClick={() => handleDeleteGasto(gasto.id)} 
                          className="btn btn-danger btn-small"
                        >
                           Eliminar
                        </button>
                      </div>
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