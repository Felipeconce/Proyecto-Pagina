import React, { useEffect, useState } from 'react';

function Pagos({ user }) {
  const [pagos, setPagos] = useState([]);
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState('');
  const [estado, setEstado] = useState('pendiente');
  const [apoderadoId, setApoderadoId] = useState('');
  const [apoderados, setApoderados] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editMonto, setEditMonto] = useState('');
  const [editFecha, setEditFecha] = useState('');
  const [editEstado, setEditEstado] = useState('');

  // Cargar pagos y apoderados
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/pagos`)
      .then(res => res.json())
      .then(data => setPagos(data));
    fetch(`${process.env.REACT_APP_API_URL}/apoderados`)
      .then(res => res.json())
      .then(data => setApoderados(data));
  }, []);

  // Agregar pago (solo tesorero)
  const agregarPago = async (e) => {
    e.preventDefault();
    await fetch(`${process.env.REACT_APP_API_URL}/pagos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario_id: apoderadoId,
        monto,
        fecha,
        estado,
      }),
    });
    fetch(`${process.env.REACT_APP_API_URL}/pagos`)
      .then(res => res.json())
      .then(data => setPagos(data));
    setMonto('');
    setFecha('');
    setEstado('pendiente');
    setApoderadoId('');
  };

  // Iniciar edición
  const startEdit = (pago) => {
    setEditId(pago.id);
    setEditMonto(pago.monto);
    setEditFecha(pago.fecha);
    setEditEstado(pago.estado);
  };

  // Guardar edición
  const saveEdit = async (e) => {
    e.preventDefault();
    console.log('user:', user); // <-- Verifica los datos del usuario
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/pagos/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: editMonto,
          fecha: editFecha,
          estado: editEstado,
          usuario_id: user.id,
          usuario_nombre: user.nombre,
          rol_id: user.rol_id,
          curso_id: user.curso_id,
          colegio_id: user.colegio_id
        }),
      });
      const data = await response.json();
      console.log('Respuesta backend:', data); // <-- Verifica la respuesta del backend
      setEditId(null);
      fetch(`${process.env.REACT_APP_API_URL}/pagos`)
        .then(res => res.json())
        .then(data => setPagos(data));
    } catch (error) {
      console.error('Error al guardar edición:', error);
    }
  };

  // Cancelar edición
  const cancelEdit = () => {
    setEditId(null);
  };

  return (
    <section>
      <h2>Pagos</h2>
      {user.rol_id === 3 && (
        <form onSubmit={agregarPago}>
          <h3>Agregar Pago</h3>
          <select
            value={apoderadoId}
            onChange={e => setApoderadoId(e.target.value)}
            required
          >
            <option value="">Selecciona Apoderado</option>
            {apoderados.map(a => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Monto"
            value={monto}
            onChange={e => setMonto(e.target.value)}
            required
          />
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            required
          />
          <select value={estado} onChange={e => setEstado(e.target.value)}>
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
          </select>
          <button type="submit">Agregar</button>
        </form>
      )}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Apoderado</th>
            <th>Monto</th>
            <th>Fecha</th>
            <th>Estado</th>
            {user.rol_id === 3 && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {pagos.map(pago => (
            <tr key={pago.id}>
              <td>{pago.id}</td>
              <td>{pago.apoderado}</td>
              <td>
                {editId === pago.id ? (
                  <input
                    type="number"
                    value={editMonto}
                    onChange={e => setEditMonto(e.target.value)}
                  />
                ) : (
                  Number(pago.monto).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 })
                )}
              </td>
              <td>
                {editId === pago.id ? (
                  <input
                    type="date"
                    value={editFecha}
                    onChange={e => setEditFecha(e.target.value)}
                  />
                ) : (
                  pago.fecha
                )}
              </td>
              <td>
                {editId === pago.id ? (
                  <select value={editEstado} onChange={e => setEditEstado(e.target.value)}>
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagado</option>
                  </select>
                ) : (
                  pago.estado
                )}
              </td>
              {user.rol_id === 3 && (
                <td>
                  {editId === pago.id ? (
                    <>
                      <button onClick={saveEdit}>Guardar</button>
                      <button onClick={cancelEdit}>Cancelar</button>
                    </>
                  ) : (
                    <button onClick={() => startEdit(pago)}>Editar</button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default Pagos;