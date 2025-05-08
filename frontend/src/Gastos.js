import React, { useEffect, useState } from 'react';

function Gastos({ user }) {
  const [gastos, setGastos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState('');
  const [editId, setEditId] = useState(null);
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editMonto, setEditMonto] = useState('');
  const [editFecha, setEditFecha] = useState('');

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/gastos`)
      .then(res => res.json())
      .then(data => setGastos(data));
    fetch(`${process.env.REACT_APP_API_URL}/cursos`)
      .then(res => res.json())
      .then(data => setCursos(data));
  }, []);

  // Agregar gasto
  const agregarGasto = async (e) => {
    e.preventDefault();
    await fetch(`${process.env.REACT_APP_API_URL}/gastos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        curso_id: cursoId,
        descripcion,
        monto,
        fecha,
      }),
    });
    fetch(`${process.env.REACT_APP_API_URL}/gastos`)
      .then(res => res.json())
      .then(data => setGastos(data));
    setCursoId('');
    setDescripcion('');
    setMonto('');
    setFecha('');
  };

  // Iniciar edición
  const startEdit = (gasto) => {
    setEditId(gasto.id);
    setEditDescripcion(gasto.descripcion);
    setEditMonto(gasto.monto);
    setEditFecha(gasto.fecha);
  };

  // Guardar edición
  const saveEdit = async (e) => {
    e.preventDefault();
    await fetch(`${process.env.REACT_APP_API_URL}/gastos/${editId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        descripcion: editDescripcion,
        monto: editMonto,
        fecha: editFecha,
      }),
    });
    setEditId(null);
    fetch(`${process.env.REACT_APP_API_URL}/gastos`)
      .then(res => res.json())
      .then(data => setGastos(data));
  };

  // Cancelar edición
  const cancelEdit = () => {
    setEditId(null);
  };

  return (
    <section>
      <h2>Gastos</h2>
      {user.rol_id === 3 && (
        <form onSubmit={agregarGasto}>
          <h3>Agregar Gasto</h3>
          <select
            value={cursoId}
            onChange={e => setCursoId(e.target.value)}
            required
          >
            <option value="">Selecciona Curso</option>
            {cursos.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Descripción"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            required
          />
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
          <button type="submit">Agregar</button>
        </form>
      )}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Curso</th>
            <th>Descripción</th>
            <th>Monto</th>
            <th>Fecha</th>
            {user.rol_id === 3 && <th>Acciones</th>}
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
                  gasto.monto
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
                  gasto.fecha
                )}
              </td>
              {user.rol_id === 3 && (
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
    </section>
  );
}

export default Gastos;