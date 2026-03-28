import React, { useEffect, useState } from 'react';
import { FaReceipt, FaEdit, FaTrash, FaSave, FaTimes, FaBoxOpen } from 'react-icons/fa';
import { useToast } from '../Layout/ToastProvider';

export default function GastosList({ user, refresh, onRefresh }) {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editMonto, setEditMonto] = useState('');
  const [editFecha, setEditFecha] = useState('');
  const { showToast } = useToast();

  const canEdit = user && [1, 3].includes(user.rol_id);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setLoading(true);
    fetch(`${process.env.REACT_APP_API_URL}/gastos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { setGastos(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [refresh]);

  const startEdit = (gasto) => {
    setEditId(gasto.id);
    setEditDescripcion(gasto.descripcion);
    setEditMonto(gasto.monto);
    setEditFecha(gasto.fecha ? gasto.fecha.slice(0, 10) : '');
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.REACT_APP_API_URL}/gastos/${editId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ descripcion: editDescripcion, monto: Number(editMonto), fecha: editFecha }),
    });
    if (res.ok) {
      showToast('Gasto actualizado', 'success');
      setEditId(null);
      if (onRefresh) onRefresh();
    } else {
      showToast('Error al guardar', 'error');
    }
  };

  const cancelEdit = () => setEditId(null);

  const handleDelete = async (id, descripcion) => {
    if (!window.confirm(`¿Eliminar el gasto "${descripcion}"?`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/gastos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      showToast('Gasto eliminado', 'success');
      if (onRefresh) onRefresh();
    } catch {
      showToast('Error al eliminar gasto', 'error');
    }
  };

  const totalGastos = gastos.reduce((acc, g) => acc + Number(g.monto), 0);

  const inputStyle = {
    padding: '5px 8px', borderRadius: 6, border: '1px solid #d1d5db',
    fontSize: 13, width: '100%', boxSizing: 'border-box'
  };

  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      border: '1px solid #e5e7eb', overflow: 'hidden'
    }}>
      <div style={{
        background: '#dcfce7', padding: '16px 20px',
        borderBottom: '1px solid #bbf7d0',
        display: 'flex', alignItems: 'center', gap: 10,
        fontSize: 18, fontWeight: 700, color: '#15803d'
      }}>
        <FaReceipt /> Listado de Gastos
        <span style={{
          marginLeft: 'auto', fontSize: 14, fontWeight: 600,
          background: '#fff', color: '#16a34a', padding: '4px 12px',
          borderRadius: 9999, border: '1px solid #bbf7d0'
        }}>
          Total: ${totalGastos.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
        </span>
      </div>

      {loading ? (
        <div style={{ padding: '8px 0' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-row">
              <span className="skeleton" style={{ height: 14, width: '12%' }} />
              <span className="skeleton" style={{ height: 14, width: '38%' }} />
              <span className="skeleton" style={{ height: 14, width: '14%' }} />
              <span className="skeleton" style={{ height: 14, width: '18%' }} />
            </div>
          ))}
        </div>
      ) : gastos.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon"><FaBoxOpen /></span>
          <p className="empty-state-text">No hay gastos registrados</p>
          {canEdit && <p className="empty-state-hint">Usa el formulario de arriba para agregar el primero</p>}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Curso', 'Descripción', 'Monto', 'Fecha', ...(canEdit ? ['Acciones'] : [])].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gastos.map(gasto => (
                <tr key={gasto.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  {editId === gasto.id ? (
                    <>
                      <td style={{ padding: '8px 12px', color: '#6b7280' }}>{gasto.curso}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <input style={inputStyle} value={editDescripcion} onChange={e => setEditDescripcion(e.target.value)} />
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <input style={{ ...inputStyle, width: 100 }} type="number" value={editMonto} onChange={e => setEditMonto(e.target.value)} />
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <input style={{ ...inputStyle, width: 130 }} type="date" value={editFecha} onChange={e => setEditFecha(e.target.value)} />
                      </td>
                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={saveEdit} className="btn-icon btn-save">
                            <FaSave /> Guardar
                          </button>
                          <button onClick={cancelEdit} className="btn-icon btn-cancel">
                            <FaTimes /> Cancelar
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '12px 16px', color: '#6b7280' }}>{gasto.curso}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 500 }}>{gasto.descripcion}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#16a34a' }}>
                        {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(gasto.monto)}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                        {new Date(gasto.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                      </td>
                      {canEdit && (
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => startEdit(gasto)} className="btn-icon btn-edit">
                              <FaEdit /> Editar
                            </button>
                            <button onClick={() => handleDelete(gasto.id, gasto.descripcion)} className="btn-icon btn-delete">
                              <FaTrash /> Eliminar
                            </button>
                          </div>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
