import React, { useEffect, useState } from 'react';

export default function GastosList({ user }) {
  const [gastos, setGastos] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editMonto, setEditMonto] = useState('');
  const [editFecha, setEditFecha] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${process.env.REACT_APP_API_URL}/gastos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setGastos(data));
  }, []);

  const startEdit = (gasto) => {
    setEditId(gasto.id);
    setEditDescripcion(gasto.descripcion);
    setEditMonto(gasto.monto);
    setEditFecha(gasto.fecha);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await fetch(`${process.env.REACT_APP_API_URL}/gastos/${editId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        descripcion: editDescripcion,
        monto: Number(editMonto),
        fecha: editFecha,
      }),
    });
    setEditId(null);
    fetch(`${process.env.REACT_APP_API_URL}/gastos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setGastos(data));
  };

  const cancelEdit = () => {
    setEditId(null);
  };

  return (
    <div>
      <h3>Listado de Gastos</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Curso</th>
            <th>Descripción</th>
            <th>Monto</th>
            <th>Fecha</th>
            {[1, 3].includes(user.rol_id) && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {gastos.map(gasto => (
            <tr key={gasto.id}>
              <td>{gasto.id}</td>
              <td>{gasto.curso}</td>
              <td>
                {editId === gasto.id ? (
                  <input
                    type="text"
                    value={editDescripcion}
                    onChange={e => setEditDescripcion(e.target.value)}
                  />
                ) : (
                  gasto.descripcion
                )}
              </td>
              <td>
                {editId === gasto.id ? (
                  <input
                    type="number"
                    value={editMonto}
                    onChange={e => setEditMonto(e.target.value)}
                  />
                ) : (
                  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(gasto.monto)
                )}
              </td>
              <td>
                {editId === gasto.id ? (
                  <input
                    type="date"
                    value={editFecha}
                    onChange={e => setEditFecha(e.target.value)}
                  />
                ) : (
                  new Date(gasto.fecha).toLocaleDateString('es-CL', {day: '2-digit', month: '2-digit', year: 'numeric'}).replace(/\//g, '-')
                )}
              </td>
              {[1, 3].includes(user.rol_id) && (
                <td>
                  {editId === gasto.id ? (
                    <>
                      <button onClick={saveEdit}>Guardar</button>
                      <button onClick={cancelEdit}>Cancelar</button>
                    </>
                  ) : (
                    <button onClick={() => startEdit(gasto)}>Editar</button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}